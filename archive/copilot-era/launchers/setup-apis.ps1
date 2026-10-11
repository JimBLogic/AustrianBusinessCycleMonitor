# 🚀 Quick API Setup Script
# Run this to set up your environment variables for real data

Write-Host "🏛️ Austrian Business Cycle Monitor - API Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check current environment variables
Write-Host "📊 Checking current API configuration..." -ForegroundColor Yellow
Write-Host ""

$fredKey = $env:FRED_API_KEY
$metalsKey = $env:METALS_API_KEY
$goldKey = $env:GOLDAPI_KEY

if ($fredKey) {
    Write-Host "✅ FRED_API_KEY is set: $($fredKey.Substring(0, [Math]::Min(8, $fredKey.Length)))..." -ForegroundColor Green
} else {
    Write-Host "❌ FRED_API_KEY is NOT set (REQUIRED for real economic data)" -ForegroundColor Red
}

if ($metalsKey) {
    Write-Host "✅ METALS_API_KEY is set: $($metalsKey.Substring(0, [Math]::Min(8, $metalsKey.Length)))..." -ForegroundColor Green
} else {
    Write-Host "⚠️  METALS_API_KEY is NOT set (optional - for real gold/silver prices)" -ForegroundColor Yellow
}

if ($goldKey) {
    Write-Host "✅ GOLDAPI_KEY is set: $($goldKey.Substring(0, [Math]::Min(8, $goldKey.Length)))..." -ForegroundColor Green
} else {
    Write-Host "⚠️  GOLDAPI_KEY is NOT set (optional - alternative to Metals-API)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# FRED API Setup
if (-not $fredKey) {
    Write-Host "🔑 Setting up FRED API (REQUIRED)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to: https://fred.stlouisfed.org/" -ForegroundColor White
    Write-Host "2. Create a free account" -ForegroundColor White
    Write-Host "3. Get your API key from: My Account → API Keys" -ForegroundColor White
    Write-Host "4. Paste it here" -ForegroundColor White
    Write-Host ""
    
    $newFredKey = Read-Host "Enter your FRED API key (or press Enter to skip)"
    
    if ($newFredKey) {
        # Set for current session
        $env:FRED_API_KEY = $newFredKey
        
        # Ask if user wants to make it permanent
        $makePermanent = Read-Host "Make this permanent? (y/n)"
        
        if ($makePermanent -eq 'y') {
            [System.Environment]::SetEnvironmentVariable('FRED_API_KEY', $newFredKey, 'User')
            Write-Host "✅ FRED API key saved permanently!" -ForegroundColor Green
        } else {
            Write-Host "✅ FRED API key set for this session only" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Skipped FRED API setup - using demo data" -ForegroundColor Yellow
    }
}

Write-Host ""

# Metals API Setup
if (-not $metalsKey -and -not $goldKey) {
    Write-Host "🪙 Setting up Metals API (OPTIONAL - for real gold/silver)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Metals-API (50 requests/month free)" -ForegroundColor White
    Write-Host "   Get key: https://metals-api.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: GoldAPI (1 request/day free)" -ForegroundColor White
    Write-Host "   Get key: https://www.goldapi.io/" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Skip (use demo gold/silver prices)" -ForegroundColor White
    Write-Host ""
    
    $metalsChoice = Read-Host "Choose option (1/2/3)"
    
    if ($metalsChoice -eq '1') {
        $newMetalsKey = Read-Host "Enter your Metals-API key"
        if ($newMetalsKey) {
            $env:METALS_API_KEY = $newMetalsKey
            
            $makePermanent = Read-Host "Make this permanent? (y/n)"
            if ($makePermanent -eq 'y') {
                [System.Environment]::SetEnvironmentVariable('METALS_API_KEY', $newMetalsKey, 'User')
                Write-Host "✅ Metals-API key saved permanently!" -ForegroundColor Green
            } else {
                Write-Host "✅ Metals-API key set for this session" -ForegroundColor Yellow
            }
        }
    } elseif ($metalsChoice -eq '2') {
        $newGoldKey = Read-Host "Enter your GoldAPI key"
        if ($newGoldKey) {
            $env:GOLDAPI_KEY = $newGoldKey
            
            $makePermanent = Read-Host "Make this permanent? (y/n)"
            if ($makePermanent -eq 'y') {
                [System.Environment]::SetEnvironmentVariable('GOLDAPI_KEY', $newGoldKey, 'User')
                Write-Host "✅ GoldAPI key saved permanently!" -ForegroundColor Green
            } else {
                Write-Host "✅ GoldAPI key set for this session" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️  Skipped metals API - using demo gold prices" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Current Configuration:" -ForegroundColor Cyan
Write-Host ""

if ($env:FRED_API_KEY) {
    Write-Host "✅ FRED API: Configured → Real economic data" -ForegroundColor Green
} else {
    Write-Host "❌ FRED API: Not configured → Demo data" -ForegroundColor Red
}

Write-Host "✅ Bitcoin/Crypto: CoinGecko (no key needed) → Real prices" -ForegroundColor Green

if ($env:METALS_API_KEY) {
    Write-Host "✅ Gold/Silver: Metals-API → Real prices" -ForegroundColor Green
} elseif ($env:GOLDAPI_KEY) {
    Write-Host "✅ Gold/Silver: GoldAPI → Real prices" -ForegroundColor Green
} else {
    Write-Host "⚠️  Gold/Silver: Demo data" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Flask backend:" -ForegroundColor White
Write-Host "   cd apps\dashboard" -ForegroundColor Gray
Write-Host "   python webapp.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start React frontend:" -ForegroundColor White
Write-Host "   cd packages\frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$startNow = Read-Host "Start Flask backend now? (y/n)"

if ($startNow -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting Flask backend..." -ForegroundColor Green
    Write-Host ""
    
    Set-Location apps\dashboard
    python webapp.py
}
