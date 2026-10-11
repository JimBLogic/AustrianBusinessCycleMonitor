Write-Host "=== Austrian Business Cycle Monitor - Startup ===" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Write-Host "[1/5] Stopping old processes..." -ForegroundColor Yellow
Get-Process python,node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend
Write-Host "[2/5] Starting Backend API on port 5002..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Backend Server' -ForegroundColor Green; python simple_backend.py"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[3/5] Starting Frontend Dev Server on port 8080..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\packages\frontend'; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 5

# Verify servers
Write-Host "[4/5] Verifying servers..." -ForegroundColor Yellow

$backend = netstat -ano | findstr ":5002.*LISTENING"
$frontend = netstat -ano | findstr ":8080.*LISTENING"

if ($backend) {
    Write-Host "  [OK] Backend running on http://127.0.0.1:5002" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Backend NOT running!" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "  [OK] Frontend running on http://127.0.0.1:8080" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Frontend NOT running!" -ForegroundColor Red
}

Write-Host ""
if ($backend -and $frontend) {
    Write-Host "[5/5] SUCCESS! Opening dashboard..." -ForegroundColor Green
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:8080"
    
    Write-Host ""
    Write-Host "=== Dashboard Features ===" -ForegroundColor Cyan
    Write-Host "  - Language Switcher (US/ES flags)" -ForegroundColor White
    Write-Host "  - Austrian Score Monitoring" -ForegroundColor White
    Write-Host "  - Interactive Charts" -ForegroundColor White
    Write-Host "  - Sound Money Metrics" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop: Close both PowerShell windows" -ForegroundColor Yellow
} else {
    Write-Host "[5/5] Some servers failed. Check the terminal windows." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
