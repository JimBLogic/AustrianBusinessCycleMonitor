# Start production-ready server: builds frontend and serves with Waitress via entrypoint

Write-Host "=== Austrian Business Cycle Monitor - PRODUCTION START ===" -ForegroundColor Cyan
Write-Host ""

$root = (Get-Location).Path
$frontend = Join-Path $root 'packages\frontend'

# 1) Build frontend
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Push-Location $frontend
npm install
npm run build
Pop-Location

# 2) Start backend in cmd window (serves built frontend from packages/frontend/dist)
Write-Host "[2/3] Starting backend on http://127.0.0.1:5002 ..." -ForegroundColor Yellow
$env:BACKEND_MODE = "webapp"
$env:HOST = "127.0.0.1"
$env:PORT = "5002"
Start-Process cmd -ArgumentList '/k', "cd /d `"$root`" && set BACKEND_MODE=webapp && set HOST=127.0.0.1 && set PORT=5002 && python entrypoint.py"

# Wait for backend to start
Start-Sleep -Seconds 5

# 3) Open browser to dashboard
Write-Host "[3/3] Opening dashboard..." -ForegroundColor Yellow
Start-Process 'http://127.0.0.1:5002'

Write-Host ""
Write-Host "Dashboard should be at: http://127.0.0.1:5002" -ForegroundColor Green
Write-Host "To stop: Close the cmd window" -ForegroundColor Yellow
Write-Host ""
