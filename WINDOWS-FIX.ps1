# WINDOWS-FIX.ps1
# PowerShell script to fix TypeScript property name mismatches
# Run this from your project root directory in PowerShell

Write-Host "🔧 Starting TypeScript fixes for Windows..." -ForegroundColor Cyan
Write-Host ""

# Function to replace text in files
function Replace-InFiles {
    param(
        [string]$Path,
        [string]$Find,
        [string]$Replace
    )
    
    Get-ChildItem -Path $Path -Filter "*.ts" -Recurse | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match [regex]::Escape($Find)) {
            $content = $content -replace [regex]::Escape($Find), $Replace
            Set-Content -Path $_.FullName -Value $content -NoNewline
            Write-Host "  ✓ Fixed: $($_.Name)" -ForegroundColor Green
        }
    }
}

# Fix 1: lockedUntil -> lockUntil
Write-Host "📝 Fixing lockedUntil -> lockUntil..." -ForegroundColor Yellow
Replace-InFiles -Path ".\server" -Find ".lockUntil" -Replace ".lockUntil"

# Fix 2: lastLogin -> lastLoginAt (but not lastLoginAt -> lastLoginAtAt)
Write-Host "📝 Fixing lastLogin -> lastLoginAt..." -ForegroundColor Yellow
Get-ChildItem -Path ".\server" -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Only replace .lastLoginAt followed by non-letter (to avoid replacing lastLoginAt)
    if ($content -match '\.lastLoginAt([^A-Za-z])') {
        $content = $content -replace '\.lastLoginAt([^A-Za-z])', '.lastLoginAt$1'
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "  ✓ Fixed: $($_.Name)" -ForegroundColor Green
    }
}

# Fix 3: lastFailedAttempt -> failedAttempts
Write-Host "📝 Fixing lastFailedAttempt -> failedAttempts..." -ForegroundColor Yellow
Replace-InFiles -Path ".\server\actions" -Find ".failedAttempts" -Replace ".failedAttempts"

# Fix 4: _id.toString() type issues - Add helper function
Write-Host "📝 Adding MongoDB _id helper..." -ForegroundColor Yellow
$files = @(
    ".\server\actions\gold.ts",
    ".\server\actions\kyc.ts",
    ".\server\actions\mfa.ts",
    ".\server\actions\profile.ts",
    ".\server\actions\wallet.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check if helper doesn't already exist
        if ($content -notmatch 'function getIdString') {
            # Add helper at the top of the file, after imports
            $helperFunction = @"

// Helper to safely convert MongoDB _id to string
function getIdString(doc: any): string {
  return doc._id?.toString() || String(doc._id) || '';
}
"@
            
            # Find the last import statement
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match '^import ') {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                $lines = $lines[0..$lastImportIndex] + $helperFunction + $lines[($lastImportIndex + 1)..($lines.Count - 1)]
                $content = $lines -join "`n"
                Set-Content -Path $file -Value $content -NoNewline
                Write-Host "  ✓ Added helper to: $(Split-Path $file -Leaf)" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Property name fixes complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Replace the auth files with the FIXED versions"
Write-Host "2. Update types/next-auth.d.ts"
Write-Host "3. Add missing properties to User model"
Write-Host "4. Run: tsc --noEmit"
Write-Host ""
