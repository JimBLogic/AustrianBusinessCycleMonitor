# Simple production start - builds frontend and starts backend
# This version keeps everything in the same PowerShell window

Write-Host "`n=== Austrian Business Cycle Monitor - PRODUCTION START ===" -ForegroundColor Cyan
Write-Host ""

$root = (Get-Location).Path
$frontend = Join-Path $root 'packages\frontend'

# 1) Build frontend
Write-Host "[1/2] Building frontend..." -ForegroundColor Yellow
Set-Location $frontend
npm install
npm run build
Set-Location $root

Write-Host ""
Write-Host "[2/2] Starting backend on http://127.0.0.1:5002 ..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: After backend starts (you'll see 'Serving on http://...'), open:" -ForegroundColor Green
Write-Host "  http://127.0.0.1:5002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start backend in same window
$env:BACKEND_MODE = "webapp"
$env:HOST = "127.0.0.1"
$env:PORT = "5002"
python entrypoint.py
