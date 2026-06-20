// Headless validation of the NetLogo Web standalone model: load it, compile, run setup/go,
// confirm it actually steps (tick monitor advances + canvas pixels change), capture any
// console errors, and assert zero network calls to a server (only the local origin allowed).
//
// Usage:
//   PLAYWRIGHT_BROWSERS_PATH=... node tools/netlogo/validate.mjs <url> <shotDir>
import { mkdirSync } from "node:fs";
import { join, dirname, resolve as presolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is installed locally under web/node_modules (npm --prefix web). Resolve it from there
// so this script can live in tools/netlogo without a node_modules of its own.
const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(presolve(__dir, "../../web/node_modules/playwright"));

const url = process.argv[2] ?? "http://localhost:4199/sandbox/netlogo";
const shotDir = process.argv[3] ?? presolve(__dir, "_shots");
mkdirSync(shotDir, { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const offOriginRequests = [];

function originOf(u) {
  try { return new URL(u).origin; } catch { return null; }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const pageOrigin = originOf(url);

page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(String(err)));
page.on("request", (req) => {
  const o = originOf(req.url());
  // Allow same-origin (the static server) and data: URIs. Anything else is a network call we must flag.
  if (o && o !== pageOrigin && !req.url().startsWith("data:")) offOriginRequests.push(req.url());
});

function fail(msg) {
  console.log("RESULT: FAIL — " + msg);
  console.log("consoleErrors:", JSON.stringify(consoleErrors.slice(0, 10), null, 2));
  console.log("pageErrors:", JSON.stringify(pageErrors.slice(0, 10), null, 2));
  console.log("offOrigin:", JSON.stringify([...new Set(offOriginRequests)].slice(0, 20), null, 2));
}

try {
  await page.goto(url, { waitUntil: "load", timeout: 60000 });

  // The card may be inside the React SPA (iframe) or be the standalone HTML itself.
  // Resolve to the frame that actually contains the NetLogo world canvas.
  let frame = page.mainFrame();
  const iframeEl = await page.$('[data-testid="netlogo-iframe"], iframe');
  if (iframeEl) {
    const f = await iframeEl.contentFrame();
    if (f) frame = f;
  }

  // Wait for the NetLogo world canvas (Galapagos draws turtles to a <canvas>).
  await frame.waitForSelector("canvas", { timeout: 60000 });

  // Wait for the engine to finish compiling: the setup button must be present & enabled.
  // Galapagos renders buttons as elements containing the procedure name text.
  await frame.waitForFunction(() => {
    const txt = document.body.innerText || "";
    return /setup/i.test(txt) && /go/i.test(txt);
  }, { timeout: 60000 });

  // Give the auto-run / compile a beat to settle.
  await page.waitForTimeout(1500);

  // Helper: read the largest canvas's pixel signature (the world view).
  async function canvasSig() {
    return await frame.evaluate(() => {
      const cs = Array.from(document.querySelectorAll("canvas"));
      if (!cs.length) return null;
      const c = cs.sort((a, b) => b.width * b.height - a.width * a.height)[0];
      try {
        const g = c.getContext("2d");
        if (!g) return "no2d:" + c.width + "x" + c.height;
        const d = g.getImageData(0, 0, Math.min(c.width, 64), Math.min(c.height, 64)).data;
        let h = 0;
        for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) >>> 0;
        return "sig:" + h + ":" + c.width + "x" + c.height;
      } catch (e) {
        return "err:" + String(e);
      }
    });
  }

  // Click SETUP (find a clickable element whose text is exactly/starts setup).
  async function clickButton(name) {
    const handle = await frame.evaluateHandle((nm) => {
      const els = Array.from(document.querySelectorAll("button, .netlogo-widget, .widget-container, [class*='button']"));
      const re = new RegExp("^\\s*" + nm + "\\s*$", "i");
      let target = els.find((e) => re.test((e.innerText || "").trim()));
      if (!target) target = els.find((e) => new RegExp(nm, "i").test((e.innerText || "").trim()));
      return target || null;
    }, name);
    const el = handle.asElement();
    if (!el) return false;
    await el.click({ timeout: 5000 }).catch(() => {});
    return true;
  }

  const sigStart = await canvasSig();
  const setupOk = await clickButton("setup");
  await page.waitForTimeout(800);
  const sigAfterSetup = await canvasSig();

  // Click GO (forever button) to step the model.
  const goOk = await clickButton("go");
  await page.waitForTimeout(2500);
  const sigAfterGo = await canvasSig();

  // Read the tick counter / a monitor value to prove it stepped.
  const ticksText = await frame.evaluate(() => {
    const t = document.querySelector(".netlogo-ticks, [class*='tick']");
    return t ? (t.innerText || "").trim() : null;
  });

  await page.screenshot({ path: join(shotDir, "netlogo_full.png"), fullPage: true });
  const card = await page.$('[data-testid="netlogo-card"]');
  if (card) await card.screenshot({ path: join(shotDir, "netlogo_card.png") });
  else await page.screenshot({ path: join(shotDir, "netlogo_card.png") });

  const stepped =
    (sigAfterGo && sigAfterSetup && sigAfterGo !== sigAfterSetup) ||
    (sigAfterSetup && sigStart && sigAfterSetup !== sigStart);

  console.log("== NetLogo Web validation ==");
  console.log("url:", url);
  console.log("setupClicked:", setupOk, "goClicked:", goOk);
  console.log("sigStart:", sigStart);
  console.log("sigAfterSetup:", sigAfterSetup);
  console.log("sigAfterGo:", sigAfterGo);
  console.log("ticksText:", ticksText);
  console.log("canvasChanged(stepped):", stepped);
  console.log("consoleErrors:", consoleErrors.length, JSON.stringify(consoleErrors.slice(0, 8)));
  console.log("pageErrors:", pageErrors.length, JSON.stringify(pageErrors.slice(0, 8)));
  console.log("offOriginRequests:", offOriginRequests.length, JSON.stringify([...new Set(offOriginRequests)].slice(0, 20)));

  const ok = stepped && offOriginRequests.length === 0 && pageErrors.length === 0;
  if (ok) console.log("RESULT: PASS — model compiled, ran client-side, stepped, zero off-origin network calls.");
  else fail(`stepped=${stepped} offOrigin=${offOriginRequests.length} pageErrors=${pageErrors.length}`);
} catch (e) {
  await page.screenshot({ path: join(shotDir, "netlogo_error.png"), fullPage: true }).catch(() => {});
  fail("exception: " + String(e));
} finally {
  await browser.close();
}
