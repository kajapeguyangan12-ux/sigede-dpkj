# 🚀 Quick Start - Setup Email OTP (5 Menit)

## Langkah Cepat:

### 1. Buat/Gunakan Gmail
```
Email: sigede.dpkj@gmail.com (atau email Anda)
```

### 2. Enable 2FA & Generate App Password
1. Buka: https://myaccount.google.com/security
2. Aktifkan "2-Step Verification"
3. Buka "App passwords"
4. Generate untuk "Mail" → "Other (Custom)"
5. **COPY** password 16 digit (contoh: `abcd efgh ijkl mnop`)

### 3. Edit `.env.local`
```env
EMAIL_USER=sigede.dpkj@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```
(Ganti dengan email & password Anda, **HAPUS SPASI** dari password)

### 4. Restart Server
```bash
# Ctrl+C untuk stop, lalu:
npm run dev
```

### 5. Test!
1. Buka: http://localhost:3000/masyarakat/daftar/warga-lokal
2. Input email VALID Anda
3. Klik "Kirim Kode OTP"
4. **Cek inbox email Anda** (atau folder Spam)
5. Copy OTP dari email → Paste ke form
6. Done! ✅

---

## ⚠️ PENTING

**Email HARUS dikonfigurasi!**
- Tanpa setup EMAIL_USER dan EMAIL_PASSWORD, OTP tidak akan terkirim
- User akan menerima error jika email belum dikonfigurasi
- Tidak ada development mode - email harus benar-benar dikirim

---

## ⚠️ Troubleshooting Cepat

**Email tidak terkirim?**
- Pastikan EMAIL_USER dan EMAIL_PASSWORD sudah di .env.local
- Restart server setelah edit .env.local
- Gunakan App Password (16 digit), BUKAN password Gmail biasa
- Hapus semua spasi dari App Password

**Email masuk Spam?**
- Normal untuk pertama kali
- Mark as "Not Spam"

**Butuh bantuan?**
- Lihat: SETUP_GMAIL_OTP.md (panduan lengkap)

---

## 📧 Tampilan Email yang Dikirim

**From**: SiGeDe DPKJ  
**Subject**: 🔐 Kode Verifikasi OTP - Registrasi SiGeDe DPKJ  
**Design**: Professional dengan gradient merah, kode OTP besar, tips keamanan

Siap untuk umum! 🎉
