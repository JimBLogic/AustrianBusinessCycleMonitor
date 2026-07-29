# Comprehensive System Test for Austrian Business Cycle Monitor
# Tests backend APIs, frontend availability, and data integrity

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUSTRIAN BUSINESS CYCLE MONITOR" -ForegroundColor Yellow
Write-Host "  Comprehensive System Test" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedContent = $null
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            if ($ExpectedContent) {
                if ($response.Content -match $ExpectedContent) {
                    Write-Host " [PASS]" -ForegroundColor Green
                    return $true
                } else {
                    Write-Host " [FAIL - Content mismatch]" -ForegroundColor Red
                    return $false
                }
            } else {
                Write-Host " [PASS]" -ForegroundColor Green
                return $true
            }
        } else {
            Write-Host " [FAIL - Status: $($response.StatusCode)]" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
        return $false
    }
}

function Test-JsonEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string[]]$RequiredKeys
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            $json = $response.Content | ConvertFrom-Json
            $missingKeys = @()
            
            foreach ($key in $RequiredKeys) {
                if (-not (Get-Member -InputObject $json -Name $key -MemberType Properties)) {
                    $missingKeys += $key
                }
            }
            
            if ($missingKeys.Count -eq 0) {
                Write-Host " [PASS]" -ForegroundColor Green
                return $true
            } else {
                Write-Host " [FAIL - Missing keys: $($missingKeys -join ', ')]" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host " [FAIL - Status: $($response.StatusCode)]" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " [FAIL - $($_.Exception.Message)]" -ForegroundColor Red
        return $false
    }
}

# ========================================
# BACKEND API TESTS
# ========================================
Write-Host "`n=== BACKEND API TESTS ===" -ForegroundColor Cyan

$backendTests = @(
    @{ Name = "Health Check"; Url = "http://127.0.0.1:5002/api/health"; Content = "status" },
    @{ Name = "Analysis Endpoint"; Url = "http://127.0.0.1:5002/api/analysis"; Content = "austrian_score" },
    @{ Name = "Three Pillars"; Url = "http://127.0.0.1:5002/api/three-pillars"; Content = "monetary_policy" },
    @{ Name = "Market Data"; Url = "http://127.0.0.1:5002/api/market-data"; Content = "bitcoin" },
    @{ Name = "Bitcoin Price"; Url = "http://127.0.0.1:5002/api/bitcoin-price"; Content = "price" },
    @{ Name = "Explanations"; Url = "http://127.0.0.1:5002/api/explanations"; Content = "explanations" },
    @{ Name = "Thought Leaders"; Url = "http://127.0.0.1:5002/api/thought-leaders"; Content = "thought_leaders" },
    @{ Name = "Data Manifest"; Url = "http://127.0.0.1:5002/api/data-manifest"; Content = "endpoints" }
)

foreach ($test in $backendTests) {
    if (Test-Endpoint -Name $test.Name -Url $test.Url -ExpectedContent $test.Content) {
        $passed++
    } else {
        $failed++
    }
}

# ========================================
# DATA STRUCTURE TESTS
# ========================================
Write-Host "`n=== DATA STRUCTURE TESTS ===" -ForegroundColor Cyan

# Test Analysis endpoint structure
if (Test-JsonEndpoint -Name "Analysis Data Structure" -Url "http://127.0.0.1:5002/api/analysis" -RequiredKeys @("analysis")) {
    $passed++
    
    # Check for malinvestment components
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/analysis" -UseBasicParsing
        $json = $response.Content | ConvertFrom-Json
        
        Write-Host "  ↳ Checking malinvestment_components..." -NoNewline
        if ($json.analysis.indicators.malinvestment_components) {
            Write-Host " [PASS]" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} else {
    $failed++
}

# Test Three Pillars structure
if (Test-JsonEndpoint -Name "Three Pillars Structure" -Url "http://127.0.0.1:5002/api/three-pillars" -RequiredKeys @("monetary_policy", "credit_markets", "real_economy")) {
    $passed++
} else {
    $failed++
}

# ========================================
# FRONTEND TESTS
# ========================================
Write-Host "`n=== FRONTEND TESTS ===" -ForegroundColor Cyan

Start-Sleep -Seconds 2  # Give frontend time to start

if (Test-Endpoint -Name "Frontend Server" -Url "http://127.0.0.1:8080") {
    $passed++
    
    # Check for main app content
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing
        
        Write-Host "  ↳ Checking for root div..." -NoNewline
        if ($response.Content -match 'id="root"') {
            Write-Host " [PASS]" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $failed++
        }
        
        Write-Host "  ↳ Checking for Vite client..." -NoNewline
        if ($response.Content -match 'vite/client') {
            Write-Host " [PASS]" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ↳ Frontend content check failed" -ForegroundColor Red
        $failed += 2
    }
} else {
    $failed++
}

# ========================================
# DATA QUALITY TESTS
# ========================================
Write-Host "`n=== DATA QUALITY TESTS ===" -ForegroundColor Cyan

try {
    # Test Austrian Score range
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/analysis" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    $score = $json.analysis.austrian_score
    
    Write-Host "Testing: Austrian Score Range (0-10)..." -NoNewline
    if ($score -ge 0 -and $score -le 10) {
        Write-Host " [PASS] Score: $score" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL] Score out of range: $score" -ForegroundColor Red
        $failed++
    }
    
    # Test Bitcoin price is reasonable
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/bitcoin-price" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    $btcPrice = $json.price
    
    Write-Host "Testing: Bitcoin Price Sanity..." -NoNewline
    if ($btcPrice -gt 1000 -and $btcPrice -lt 1000000) {
        Write-Host " [PASS] Price: $$btcPrice" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL] Price suspicious: $$btcPrice" -ForegroundColor Red
        $failed++
    }
    
    # Test Gold price is reasonable
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/market-data" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    $goldPrice = $json.data.commodities.gold
    
    Write-Host "Testing: Gold Price Sanity..." -NoNewline
    if ($goldPrice -gt 1000 -and $goldPrice -lt 10000) {
        Write-Host " [PASS] Price: $$goldPrice/oz" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL] Price suspicious: $$goldPrice" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "Data quality tests failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed += 3
}

# ========================================
# VISUALIZATION DATA TESTS
# ========================================
Write-Host "`n=== VISUALIZATION DATA TESTS ===" -ForegroundColor Cyan

try {
    # Test credit growth quarters
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5002/api/three-pillars" -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "Testing: Credit Growth Quarters Data..." -NoNewline
    if ($json.credit_markets.metrics.credit_growth_quarters -and $json.credit_markets.metrics.credit_growth_quarters.Count -gt 0) {
        Write-Host " [PASS] $($json.credit_markets.metrics.credit_growth_quarters.Count) quarters" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
    
    Write-Host "Testing: Credit Growth Series QoQ..." -NoNewline
    if ($json.credit_markets.metrics.credit_growth_series_qoq -and $json.credit_markets.metrics.credit_growth_series_qoq.Count -gt 0) {
        Write-Host " [PASS] $($json.credit_markets.metrics.credit_growth_series_qoq.Count) data points" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "Visualization data tests failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed += 2
}

# ========================================
# SUMMARY
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

$total = $passed + $failed
$passRate = [math]::Round(($passed / $total) * 100, 1)

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

if ($failed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED! System is fully operational." -ForegroundColor Green
    Write-Host "🎉 Professional visualization dashboard is ready!" -ForegroundColor Cyan
} elseif ($passRate -ge 80) {
    Write-Host "`n⚠️  MOSTLY PASSING. Minor issues detected." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ CRITICAL ISSUES DETECTED. Review failed tests." -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Return exit code based on results
if ($failed -eq 0) {
    exit 0
} else {
    exit 1
}
