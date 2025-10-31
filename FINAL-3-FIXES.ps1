# FINAL 3 FIXES - Run this PowerShell script

Write-Host "🔧 Applying final 3 fixes..." -ForegroundColor Cyan

# Fix 1: Copy auth.config.ts to server/auth/config.ts
Write-Host "1. Copying auth.config.ts to server/auth/config.ts..." -ForegroundColor Yellow
Copy-Item -Path "auth.config.ts" -Destination "server/auth/config.ts" -Force
Write-Host "   ✓ Done" -ForegroundColor Green

# Fix 2: Fix typo in auth.config.ts line 137
Write-Host "2. Fixing typo in auth.config.ts..." -ForegroundColor Yellow
$content = Get-Content "auth.config.ts" -Raw
$content = $content -replace 'lastName: user\.lastName;', 'token.lastName = user.lastName;'
Set-Content "auth.config.ts" -Value $content -NoNewline
Write-Host "   ✓ Done" -ForegroundColor Green

# Fix 3: Same typo in server/auth/config.ts
Write-Host "3. Fixing typo in server/auth/config.ts..." -ForegroundColor Yellow
$content = Get-Content "server/auth/config.ts" -Raw
$content = $content -replace 'lastName: user\.lastName;', 'token.lastName = user.lastName;'
Set-Content "server/auth/config.ts" -Value $content -NoNewline
Write-Host "   ✓ Done" -ForegroundColor Green

# Fix 4: MFA backup code
Write-Host "4. Fixing MFA backup code access..." -ForegroundColor Yellow
$content = Get-Content "server/actions/mfa.ts" -Raw
$content = $content -replace 'verifyPassword\(\s*code,\s*mfa\.backupCodes\[i\]\s*\)', 'verifyPassword(code, mfa.backupCodes[i].code)'
Set-Content "server/actions/mfa.ts" -Value $content -NoNewline
Write-Host "   ✓ Done" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All fixes applied!" -ForegroundColor Green
Write-Host "Now run: tsc --noEmit" -ForegroundColor Yellow
