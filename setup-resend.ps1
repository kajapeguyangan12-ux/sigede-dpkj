# 🚀 Setup Resend API untuk Production
# Run this script: .\setup-resend.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 RESEND API SETUP - PRODUCTION MODE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Langkah-langkah Setup:`n" -ForegroundColor Yellow

Write-Host "1️⃣  Sign Up & Get API Key dari Resend" -ForegroundColor White
Write-Host "   URL: https://resend.com/signup" -ForegroundColor Cyan
Write-Host "   - Daftar dengan email Anda" -ForegroundColor Gray
Write-Host "   - Verifikasi email" -ForegroundColor Gray
Write-Host "   - Login ke dashboard" -ForegroundColor Gray
Write-Host "   - Klik 'API Keys' → 'Create API Key'" -ForegroundColor Gray
Write-Host "   - Name: SiGeDe DPKJ Production" -ForegroundColor Gray
Write-Host "   - COPY API Key (format: re_...)`n" -ForegroundColor Gray

# Buka browser
$confirm = Read-Host "Buka browser untuk sign up? (y/n)"
if ($confirm -eq 'y') {
    Start-Process "https://resend.com/signup"
    Write-Host "`n✅ Browser opened! Silakan complete sign up.`n" -ForegroundColor Green
}

Write-Host "2️⃣  Paste API Key Anda di bawah ini:`n" -ForegroundColor White

# Input API Key
$apiKey = Read-Host "Paste RESEND_API_KEY Anda (atau ketik 'skip' untuk nanti)"

if ($apiKey -eq 'skip' -or $apiKey -eq '') {
    Write-Host "`n⚠️  Setup dibatalkan. Sistem tetap di Development Mode." -ForegroundColor Yellow
    Write-Host "   Untuk setup nanti, jalankan script ini lagi.`n" -ForegroundColor Gray
    exit
}

# Validasi format API Key
if (-not $apiKey.StartsWith('re_')) {
    Write-Host "`n❌ Error: API Key tidak valid!" -ForegroundColor Red
    Write-Host "   Format API Key harus dimulai dengan 're_'" -ForegroundColor Yellow
    Write-Host "   Contoh: re_abc123def456ghi789jkl`n" -ForegroundColor Gray
    exit
}

Write-Host "`n3️⃣  Updating .env.local...`n" -ForegroundColor White

# Backup .env.local
$envPath = ".\.env.local"
$backupPath = ".\.env.local.backup"

if (Test-Path $envPath) {
    Copy-Item $envPath $backupPath -Force
    Write-Host "   ✅ Backup created: .env.local.backup" -ForegroundColor Green
}

# Read and update .env.local
$envContent = Get-Content $envPath -Raw

# Replace RESEND_API_KEY
$pattern = 'RESEND_API_KEY=.*'
$replacement = "RESEND_API_KEY=$apiKey"
$envContent = $envContent -replace $pattern, $replacement

# Save updated content
Set-Content $envPath -Value $envContent -NoNewline

Write-Host "   ✅ .env.local updated with your API key`n" -ForegroundColor Green

Write-Host "4️⃣  Verifying setup...`n" -ForegroundColor White

# Verify
$envCheck = Get-Content $envPath | Select-String "RESEND_API_KEY="
if ($envCheck -match "re_") {
    Write-Host "   ✅ API Key configured successfully!" -ForegroundColor Green
    Write-Host "   ✅ Production mode will be active after server restart`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Something went wrong. Please check .env.local manually`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Next Steps:`n" -ForegroundColor Yellow
Write-Host "1. Restart dev server:" -ForegroundColor White
Write-Host "   npm run dev`n" -ForegroundColor Cyan

Write-Host "2. Test kirim OTP:" -ForegroundColor White
Write-Host "   - Buka form registrasi" -ForegroundColor Gray
Write-Host "   - Isi email VALID (Anda punya akses)" -ForegroundColor Gray
Write-Host "   - Klik 'Kirim Kode OTP'" -ForegroundColor Gray
Write-Host "   - Cek inbox email Anda" -ForegroundColor Gray
Write-Host "   - Email dari 'SiGeDe DPKJ' harus masuk`n" -ForegroundColor Gray

Write-Host "3. Jika email tidak masuk:" -ForegroundColor White
Write-Host "   - Cek folder Spam/Junk" -ForegroundColor Gray
Write-Host "   - Cek Resend Dashboard → Logs" -ForegroundColor Gray
Write-Host "   - Cek console server untuk error`n" -ForegroundColor Gray

Write-Host "📊 Resend Free Tier:" -ForegroundColor Yellow
Write-Host "   - 100 emails/day" -ForegroundColor White
Write-Host "   - 3,000 emails/month" -ForegroundColor White
Write-Host "   - Cukup untuk development & testing`n" -ForegroundColor White

Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "   Dashboard: https://resend.com/home" -ForegroundColor Cyan
Write-Host "   API Logs:  https://resend.com/logs" -ForegroundColor Cyan
Write-Host "   Docs:      https://resend.com/docs`n" -ForegroundColor Cyan

Write-Host "========================================`n" -ForegroundColor Cyan
