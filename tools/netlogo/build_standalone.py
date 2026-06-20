#!/usr/bin/env python3
"""Build a self-contained, zero-network NetLogo Web standalone HTML for an .nlogo model.

Pipeline (fully reproducible):
  1. Download the official NetLogo Web standalone template from netlogoweb.org/standalone.
     This single HTML inlines the Tortoise compiler + engine + Galapagos UI (everything
     needed to compile and run a model entirely client-side).
  2. Strip the only outbound network references so the page makes ZERO network calls:
       - Google Fonts <link> tags (Open Sans).
       - The Google Analytics (gtag) bootstrap.
  3. Inject our own .nlogo model source into the empty
       <script type="text/nlogo" id="nlogo-code" data-filename="model.nlogox">
     element (we set data-filename to model.nlogo so the classic-format parser is used).
  4. Write the result to web/public/netlogo/<out>.html.

Usage:
  python tools/netlogo/build_standalone.py schelling.nlogo schelling.html

This is a build-time tool. The produced HTML is the redistributable artifact; the model
source is ours (see ATTRIBUTION.md), and the NetLogo Web engine/UI is GPL-2.0 (the
template ships them inlined; we redistribute unmodified except for stripping fonts/analytics).
"""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

TEMPLATE_URL = "https://netlogoweb.org/standalone"
HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent.parent / "web" / "public" / "netlogo"


def fetch_template() -> str:
    req = urllib.request.Request(TEMPLATE_URL, headers={"User-Agent": "caos-simlab-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:  # noqa: S310 (trusted host)
        return resp.read().decode("utf-8")


def strip_network(html: str) -> str:
    # 1) Google Fonts: preconnect + stylesheet links.
    html = re.sub(
        r'\s*<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>',
        "",
        html,
    )
    # 2) Google Analytics: replace the gtag injection block body so nothing loads.
    #    The block is guarded by `if (!params.has("disableAnalytics")) { ... }`; we
    #    neutralize the body to be safe even if someone forgets the query flag.
    html = html.replace(
        "const gScript = document.createElement('script');",
        "/* analytics stripped for zero-network embed */ const gScript = { set src(_) {}, async: true };",
    )
    html = html.replace("document.head.appendChild(gScript);", "/* head append stripped */;")
    return html


def inject_model(html: str, nlogo_source: str) -> str:
    # Escape any closing-script sequence in the source so it can't break out of the tag.
    safe = nlogo_source.replace("</script>", "<\\/script>")
    pattern = re.compile(
        r'(<script type="text/nlogo" id="nlogo-code" data-filename=")model\.nlogox("></script>)'
    )
    if not pattern.search(html):
        raise SystemExit("FATAL: model injection point not found in template (layout changed).")
    replacement = r"\g<1>model.nlogo\g<2>"
    html = pattern.sub(replacement, html)
    # Now put the source inside the (now empty) tag.
    html = html.replace(
        '<script type="text/nlogo" id="nlogo-code" data-filename="model.nlogo"></script>',
        f'<script type="text/nlogo" id="nlogo-code" data-filename="model.nlogo">{safe}</script>',
    )
    return html


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build_standalone.py <model.nlogo> <out.html>")
    model_path = HERE / sys.argv[1]
    out_path = OUT_DIR / sys.argv[2]
    nlogo_source = model_path.read_text(encoding="utf-8")

    html = fetch_template()
    before = len(html)
    html = strip_network(html)
    html = inject_model(html, nlogo_source)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8", newline="\n")

    # Sanity: confirm no remaining outbound http(s) references to known trackers/fonts.
    remaining = re.findall(r'https?://(?:fonts\.(?:googleapis|gstatic)|www\.googletagmanager)\.com', html)
    print(f"template bytes: {before} -> {len(html)}")
    print(f"wrote: {out_path}")
    print(f"residual font/analytics URLs: {len(remaining)} {sorted(set(remaining))}")


if __name__ == "__main__":
    main()
