// Copy the committed simulation artifacts (traces + manifests) into web/public so the dev server and
// local build can serve them. In CI the Pages workflow overlays the same files into dist/ directly.
// Also inline the `simlab` Python package source into one JSON, so the Pyodide live lane can write it to
// the in-browser filesystem and `import simlab` to run the SAME scenario code the pipeline ran.
// Cross-platform (Node fs).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const pub = resolve(here, "public");

const jobs = [
  ["data/artifacts", "public/data/artifacts"],
  ["manifests", "public/manifests"],
];

mkdirSync(pub, { recursive: true });
for (const [src, dst] of jobs) {
  const s = resolve(repo, src);
  const d = resolve(here, dst);
  if (existsSync(s)) {
    cpSync(s, d, { recursive: true });
    console.log(`copied ${src} -> web/${dst.replace(/\\/g, "/")}`);
  } else {
    console.warn(`skip (missing): ${src}`);
  }
}

// --- inline simlab/**/*.py into public/pyodide/simlab-sources.json ---
function walkPy(dir, root, out) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "__pycache__") continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkPy(p, root, out);
    else if (ent.name.endsWith(".py")) {
      const rel = relative(root, p).split("\\").join("/"); // posix keys for the browser FS
      out[`simlab/${rel}`] = readFileSync(p, "utf-8");
    }
  }
}

const simlabSrc = resolve(repo, "simlab");
if (existsSync(simlabSrc)) {
  const files = {};
  walkPy(simlabSrc, simlabSrc, files);
  const outDir = resolve(here, "public", "pyodide");
  mkdirSync(outDir, { recursive: true });
  const n = Object.keys(files).length;
  writeFileSync(resolve(outDir, "simlab-sources.json"), JSON.stringify({ package: "simlab", files }), "utf-8");
  console.log(`inlined ${n} simlab/*.py -> web/public/pyodide/simlab-sources.json`);
} else {
  console.warn("skip (missing): simlab/ source for Pyodide live lane");
}
