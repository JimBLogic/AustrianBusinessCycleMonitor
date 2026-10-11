# Austrian Business Cycle Monitor - Server Launcher
# Run this script to start the dashboard server

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Austrian Business Cycle Monitor" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server on http://127.0.0.1:5002" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
C:/Python313/python.exe apps/dashboard/webapp.py
