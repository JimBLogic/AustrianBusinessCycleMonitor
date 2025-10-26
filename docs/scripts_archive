}
Write-Host "  Total files deleted: $fileCount" -ForegroundColor Cyan

# Directories to delete
$dirsToDelete = @(
    ".github\TOLEARNFROMANDIMPROVEMYCODE",
    "k8s",
    "src",
    "launchers",
    "abcm",
    "translations",
    "templates",
    "static"
)

Write-Host "`n🗑️  Deleting obsolete directories..." -ForegroundColor Magenta
$dirCount = 0
foreach ($dir in $dirsToDelete) {
    if (Test-Path $dir) {
        Write-Host "  📁 Backing up: $dir" -ForegroundColor Yellow
        Copy-Item $dir $backupDir -Recurse -Force
        Remove-Item $dir -Recurse -Force
        Write-Host "  ✅ Deleted directory: $dir" -ForegroundColor Green
        $dirCount++
    }
}
Write-Host "  Total directories deleted: $dirCount" -ForegroundColor Cyan

# Clean up specific files in subdirectories
Write-Host "`n🗑️  Cleaning up backup/legacy files in subdirectories..." -ForegroundColor Magenta
$subFileCount = 0

$subFilesToDelete = @{
    "apps\utils\asset_tracker.py" = "Old asset tracker (replaced by live version)"
    "apps\utils\asset_tracker_backup.py" = "Backup file"
    "apps\utils\asset_tracker_clean.py" = "Backup file"
    "apps\dashboard\webapp_backups.py" = "Backup file"
    "apps\core\import os.py" = "Leftover import file"
    "apps\core\import sys.py" = "Leftover import file"
    "docs\AUSTRIAN_INTEGRATION_IMPLEMENTATION.md" = "Duplicate content"
    "docs\austrian_theory.md" = "Duplicate content"
    "docs\indicator_guide.md" = "Covered in quick reference"
    "docs\NETTIME_GUIDE.md" = "Not used"
    "docs\REPO_MANIFEST.md" = "Auto-generated"
    "docs\manifest.json" = "Auto-generated"
    "docs\README.md" = "Redundant"
    "scripts\README.md" = "Just placeholder"
    "scripts\script_template.py" = "Not used"
    "logs\deployment_20250807_151618.json" = "Old log"
    "logs\system_test_20250807_150657.json" = "Old log"
    "logs\README.md" = "Just placeholder"
    "data\austrian_analysis_comprehensive_2025-08-05_18-27-18.md" = "Old analysis"
    "data\dashboard.html" = "Old dashboard"
    "data\latest_report.txt" = "Old report"
}

foreach ($file in $subFilesToDelete.Keys) {
    if (Test-Path $file) {
        $reason = $subFilesToDelete[$file]
        Copy-Item $file $backupDir -Force -ErrorAction SilentlyContinue
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Deleted: $file ($reason)" -ForegroundColor Green
        $subFileCount++
    }
}
Write-Host "  Total subdirectory files deleted: $subFileCount" -ForegroundColor Cyan

# Summary
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Root files deleted: $fileCount" -ForegroundColor White
Write-Host "  - Directories deleted: $dirCount" -ForegroundColor White
Write-Host "  - Subdirectory files deleted: $subFileCount" -ForegroundColor White
Write-Host "  - Total items removed: $($fileCount + $dirCount + $subFileCount)" -ForegroundColor White
Write-Host "`n📦 Backup saved to: $backupDir" -ForegroundColor Yellow
Write-Host "`n⚠️  IMPORTANT: Test the application!" -ForegroundColor Red
Write-Host "  1. cd apps\dashboard" -ForegroundColor Gray
Write-Host "  2. python webapp.py" -ForegroundColor Gray
Write-Host "  3. Open http://127.0.0.1:5002" -ForegroundColor Gray
Write-Host "`n  If issues arise, restore from backup folder." -ForegroundColor Yellow
Write-Host "`n✨ Your project is now lean and efficient!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
