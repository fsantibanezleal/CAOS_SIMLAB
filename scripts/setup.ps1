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
& $py -m pip install -r requirements.txt -r requirements-dev.txt

Write-Host ""
Write-Host "Ready. Next:"
Write-Host "  $py -m pytest                       # run the tests"
Write-Host "  .\scripts\precompute.ps1 s01_queue  # run the M/M/c queue"
