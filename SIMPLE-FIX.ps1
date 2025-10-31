# Simple PowerShell Script to Fix Remaining Errors
# Run from project root: .\SIMPLE-POWERSHELL-FIX.ps1

Write-Host "🔧 Applying surgical fixes..." -ForegroundColor Cyan

# Fix 1: MFA failedAttempts type error (line 272)
$mfaFile = "server/actions/mfa.ts"
if (Test-Path $mfaFile) {
    $content = Get-Content $mfaFile -Raw
    $content = $content -replace 'mfa\.failedAttempts = new Date\(\);', 'mfa.failedAttempts += 1;'
    $content = $content -replace 'mfa\.lockUntil', 'mfa.lockedUntil'
    $content = $content -replace 'mfa\.failedAttempts = undefined;', 'mfa.failedAttempts = 0;'
    $content = $content -replace '(await verifyPassword\(\s*)\s*mfa\.backupCodes\[i\]', '$1mfa.backupCodes[i].code'
    $content = $content -replace 'mfa\.backupCodes = hashedBackupCodes;', 'mfa.backupCodes = hashedBackupCodes.map(code => ({ code, used: false }));'
    Set-Content $mfaFile -Value $content -NoNewline
    Write-Host "✓ Fixed server/actions/mfa.ts" -ForegroundColor Green
}

# Fix 2: KYC status (line 396)
$kycFile = "server/actions/kyc.ts"
if (Test-Path $kycFile) {
    $content = Get-Content $kycFile -Raw
    $content = $content -replace 'kyc\.status = "approved";', 'kyc.status = "verified";'
    Set-Content $kycFile -Value $content -NoNewline
    Write-Host "✓ Fixed server/actions/kyc.ts" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All fixes applied!" -ForegroundColor Green
Write-Host "Run: tsc --noEmit" -ForegroundColor Yellow