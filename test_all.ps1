#requires -Version 5.1
<#
Test-All: Build frontend, start backend (Waitress), probe endpoints, print summary, and exit cleanly.
Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File .\test_all.ps1
#>

$ErrorActionPreference = 'Stop'

# ---- Config
$root       = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend   = Join-Path $root 'packages\frontend'
$serverHost = $env:HOST  ; if (-not $serverHost) { $serverHost = '127.0.0.1' }
$serverPort = $env:PORT  ; if (-not $serverPort) { $serverPort = '5002' }
$baseUrl    = "http://${serverHost}:${serverPort}"
$serverLog  = Join-Path $root 'logs\test_all_server.log'
$maxWaitSec = 45

# Collect results
$results = @()
function Add-Result {
  param([string]$Name,[bool]$Ok,[string]$Detail='')
  $results += [pscustomobject]@{ check=$Name; ok=$Ok; detail=$Detail }
}

# Helpers
function Write-Info($msg)    { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)      { Write-Host "[ OK ] $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "[FAIL] $msg" -ForegroundColor Red }

function Test-Endpoint {
  param([string]$Url,[string]$Name)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
      Write-Ok "$Name ($($r.StatusCode))"
      Add-Result -Name $Name -Ok $true
    } else {
      Write-Err "$Name ($($r.StatusCode))"
      Add-Result -Name $Name -Ok $false -Detail "HTTP $($r.StatusCode)"
    }
  } catch {
    Write-Err "$Name ($($_.Exception.Message))"
    Add-Result -Name $Name -Ok $false -Detail ($_.Exception.Message)
  }
}

# Ensure logs dir
$logsDir = Split-Path $serverLog -Parent
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# ---- Step 1: Build frontend
try {
  Write-Info "Building frontend (npm install + npm run build)"
  Push-Location $frontend
  if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
    Write-Info "Running npm install (first-time dependencies)"
    npm install | Out-Null
  }
  npm run build | Out-Null
  Pop-Location
  Write-Ok "Frontend build complete"
  Add-Result -Name 'frontend-build' -Ok $true
} catch {
  Pop-Location 2>$null
  Write-Err "Frontend build failed: $($_.Exception.Message)"
  Add-Result -Name 'frontend-build' -Ok $false -Detail ($_.Exception.Message)
  throw
}

# ---- Step 2: Start backend (Waitress)
$serverProc = $null
try {
  Write-Info "Starting backend (Waitress) at $baseUrl"
  $envVars = "set BACKEND_MODE=webapp && set HOST=$serverHost && set PORT=$serverPort"
  $cmd = "cd /d `"$root`" && $envVars && python entrypoint.py >> `"$serverLog`" 2>&1"
  $serverProc = Start-Process -FilePath cmd.exe -ArgumentList '/c', $cmd -WindowStyle Hidden -PassThru
  Write-Info "PID: $($serverProc.Id)  Log: $serverLog"
} catch {
  Write-Err "Failed to start backend: $($_.Exception.Message)"
  Add-Result -Name 'backend-start' -Ok $false -Detail ($_.Exception.Message)
  throw
}

# ---- Step 3: Wait for readiness
$ready = $false
for ($i=0; $i -lt $maxWaitSec; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/status" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $ready = $true; break }
  } catch { }
  Start-Sleep -Seconds 1
}
if ($ready) {
  Write-Ok "Backend is ready at $baseUrl"
  Add-Result -Name 'backend-ready' -Ok $true
} else {
  Write-Err "Backend did not become ready within $maxWaitSec seconds"
  Add-Result -Name 'backend-ready' -Ok $false -Detail 'timeout'
}

# ---- Step 4: Probe endpoints
if ($ready) {
  Test-Endpoint -Url "$baseUrl/"                        -Name 'root-html'
  Test-Endpoint -Url "$baseUrl/api/status"              -Name 'api-status'
  Test-Endpoint -Url "$baseUrl/api/dashboard-snapshot"  -Name 'api-dashboard-snapshot'
  Test-Endpoint -Url "$baseUrl/api/stock-markets"       -Name 'api-stock-markets'
}

# ---- Step 5: Print summary and exit
Write-Host ''
Write-Host '=== Test Summary ===' -ForegroundColor White
$pass = ($results | Where-Object { $_.ok }).Count
$fail = ($results | Where-Object { -not $_.ok }).Count
$results | ForEach-Object {
  if ($_.ok) { Write-Host ("[PASS] {0}" -f $_.check) -ForegroundColor Green }
  else {
    $detail = if ($_.detail) { " - $_.detail" } else { '' }
    Write-Host ("[FAIL] {0}{1}" -f $_.check, $detail) -ForegroundColor Red
  }
}
Write-Host ("Total: {0}   Passed: {1}   Failed: {2}" -f ($results.Count), $pass, $fail) -ForegroundColor White

# Exit code: non-zero if any failures
$exitCode = if ($fail -gt 0) { 1 } else { 0 }

# Cleanup backend
try {
  if ($serverProc -and (Get-Process -Id $serverProc.Id -ErrorAction SilentlyContinue)) {
    Write-Info "Stopping backend (PID $($serverProc.Id))"
    Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
  }
} catch { }

exit $exitCode
