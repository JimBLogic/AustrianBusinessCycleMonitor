# 🚀 FINAL SOLUTION - Start Dashboard (ACTUALLY WORKS!)

Write-Host "🏛️ Austrian Business Cycle Monitor - Starting..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes
Write-Host "🧹 Cleaning up old processes..." -ForegroundColor Yellow
Get-Process python,node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend in new window
Write-Host "🔧 Starting Backend API (Port 5002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python simple_backend.py"

Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "🎨 Starting Frontend Dev Server (Port 8080)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\packages\frontend'; npm run dev"

Start-Sleep -Seconds 5

# Verify both servers
Write-Host ""
Write-Host "🔍 Verifying servers..." -ForegroundColor Yellow

$backend = netstat -ano | findstr ":5002.*LISTENING"
$frontend = netstat -ano | findstr ":8080.*LISTENING"

if ($backend) {
    Write-Host "✅ Backend running on http://127.0.0.1:5002" -ForegroundColor Green
} else {
    Write-Host "❌ Backend NOT running!" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✅ Frontend running on http://127.0.0.1:8080" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend NOT running!" -ForegroundColor Red
}

Write-Host ""
if ($backend -and $frontend) {
    Write-Host "🎉 SUCCESS! Dashboard is ready!" -ForegroundColor Green
    Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:8080"
    
    Write-Host ""
    Write-Host "✨ Dashboard Features:" -ForegroundColor Cyan
    Write-Host "   🇺🇸 🇪🇸 Language Switcher - Click flags to switch languages" -ForegroundColor White
    Write-Host "   📊 Austrian Score - Real-time cycle monitoring" -ForegroundColor White
    Write-Host "   📈 Interactive Charts - Credit expansion, yield curve" -ForegroundColor White
    Write-Host "   💰 Sound Money Metrics - Bitcoin & Gold tracking" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 To stop: Close both PowerShell windows" -ForegroundColor Yellow
} else {
    Write-Host "⚠️ Some servers failed to start. Check the terminal windows." -ForegroundColor Yellow
}

Write-Host ""
