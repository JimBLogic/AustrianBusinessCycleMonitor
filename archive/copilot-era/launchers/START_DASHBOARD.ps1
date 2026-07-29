<#
    Austrian Business Cycle Monitor - Easy Startup Script (ASCII-safe)
    - Starts backend (mock API) and frontend (Vite dev server) in separate cmd windows
    - Uses robust quoting to handle paths with spaces
#>

Write-Host "Starting Austrian Business Cycle Monitor..." -ForegroundColor Cyan
Write-Host ""

# Resolve absolute repo root path safely (handles spaces)
$root = (Get-Location).Path
$frontendPath = Join-Path $root 'packages\frontend'
$nodeModules = Join-Path $frontendPath 'node_modules'

# Ensure frontend dependencies (first run)
if (-not (Test-Path $nodeModules)) {
        Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
        Start-Process cmd -ArgumentList '/c', "cd /d `"$frontendPath`" && npm install" -Wait
}

# Start Backend (Flask mock API) in a CMD window (avoid PowerShell profile loading)
Write-Host "Starting Backend API (Flask) on http://127.0.0.1:5002 ..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k', "cd /d `"$root`" && python backend_prod.py"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend (Vite) in a new CMD window (avoid PowerShell profile parse errors)
Write-Host "Starting Frontend (Vite) on http://127.0.0.1:8080 ..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k', "cd /d `"$frontendPath`" && npm run dev"

# Wait for servers to initialize
Start-Sleep -Seconds 5

# Open browser
Write-Host ""
Write-Host "Dashboard should be running:" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:8080 (or 8081 if 8080 is busy)" -ForegroundColor Cyan
Write-Host "  Backend:  http://127.0.0.1:5002" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process 'http://127.0.0.1:8080'

Write-Host ""
Write-Host "If you see a blank page:" -ForegroundColor Yellow
Write-Host "  1) Check that BOTH terminal windows are running" -ForegroundColor White
Write-Host "  2) Try http://127.0.0.1:8081 if port 8080 is busy" -ForegroundColor White
Write-Host "  3) Press F12 to check browser console for errors" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close both cmd windows" -ForegroundColor Red
Write-Host ""
