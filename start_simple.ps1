# Austrian Business Cycle Monitor - Simple PowerShell Launcher

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Austrian Business Cycle Monitor - Starting..." -ForegroundColor Yellow  
Write-Host "================================================================" -ForegroundColor Cyan

# Change to script directory
Set-Location -Path $PSScriptRoot

# Activate virtual environment if available
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & ".venv\Scripts\Activate.ps1"
    Write-Host "Virtual environment activated" -ForegroundColor Green
}

# Run the Austrian Monitor
Write-Host "Starting Austrian Monitor..." -ForegroundColor Green
python "launchers\main.py"

Write-Host "Press any key to exit..."
Read-Host
