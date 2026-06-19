// Copy the committed simulation artifacts (traces + manifests) into web/public so the dev server and
// local build can serve them. In CI the Pages workflow overlays the same files into dist/ directly.
// Cross-platform (Node fs.cpSync).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
