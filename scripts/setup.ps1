# CAOS_SIMLAB — create the local Python .venv and install deps (Windows / PowerShell).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".venv")) {
    Write-Host "Creating .venv (Python 3.13)..."
    py -3.13 -m venv .venv
}
$py = ".\.venv\Scripts\python.exe"
& $py -m pip install --upgrade pip
# Core (live/Pyodide engine) + dev tooling + the dedicated precompute engines (Mesa, OR-Tools, Ciw,
# PyVRP, NetworkX/OSMnx, joblib/SciPy, ...). The precompute engines are what the scenarios actually use
# to generate the committed traces — see docs/guides/precompute-pipeline.md.
& $py -m pip install -r requirements.txt -r requirements-dev.txt -r requirements-precompute.txt

Write-Host ""
Write-Host "Optional GPU lane (CuPy/Numba/Taichi/JAX) for the Monte-Carlo exhibit — only on a CUDA box:"
Write-Host "  $py -m pip install -r requirements-gpu.txt   # see docs/guides/gpu-lane.md"
Write-Host ""
Write-Host "Ready. Next:"
Write-Host "  $py -m pytest                       # run the tests"
Write-Host "  .\scripts\precompute.ps1 s01_queue  # run the M/M/c queue"
