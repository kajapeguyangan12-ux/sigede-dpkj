# 📧 Environment Configuration Guide - Email OTP

## Konfigurasi Environment Variables

File: `.env.local`

### ✅ Contoh Konfigurasi Lengkap

```env
# === EMAIL CONFIGURATION (GMAIL) ===
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
EMAIL_FROM_NAME=SiGeDe DPKJ

# Contoh dengan App Password yang benar:
# EMAIL_PASSWORD=abcd efgh ijkl mnop (16 karakter, tanpa spasi sebenarnya)
```

### 📋 Penjelasan Setiap Variable

| Variable | Required | Nilai | Keterangan |
|----------|----------|-------|------------|
| `EMAIL_SERVICE` | ✅ Ya | `gmail` | Service email yang digunakan |
| `EMAIL_HOST` | ✅ Ya | `smtp.gmail.com` | SMTP host Gmail |
| `EMAIL_PORT` | ✅ Ya | `587` | Port untuk STARTTLS (recommended) |
| `EMAIL_SECURE` | Opsional | `false` | False untuk port 587, true untuk 465 |
| `EMAIL_USER` | ✅ Ya | Email lengkap Anda | Contoh: `sigede.dpkj@gmail.com` |
| `EMAIL_PASSWORD` | ✅ Ya | App Password 16 digit | **BUKAN password Gmail biasa!** |
| `EMAIL_FROM_NAME` | Opsional | `SiGeDe DPKJ` | Nama pengirim yang tampil di email |

---

## 🔐 Cara Mendapatkan Gmail App Password

### Langkah-langkah:

1. **Buka Google Account**
   - Kunjungi: https://myaccount.google.com/
   - Login dengan akun Gmail yang akan digunakan

2. **Enable 2-Step Verification** (jika belum aktif)
   - Masuk ke Security → 2-Step Verification
   - Ikuti panduan untuk mengaktifkan

3. **Generate App Password**
   - Kunjungi: https://myaccount.google.com/apppasswords
   - Atau: Google Account → Security → 2-Step Verification → App passwords
   - Pilih "Select app" → Pilih "Mail"
   - Pilih "Select device" → Pilih "Other" → Ketik "SiGeDe DPKJ"
   - Klik **Generate**

4. **Salin Password**
   - Google akan menampilkan 16 karakter password
   - Contoh: `abcd efgh ijkl mnop`
   - **Hapus spasi saat paste ke .env.local**
   - Hasil: `EMAIL_PASSWORD=abcdefghijklmnop`

5. **Simpan di .env.local**
   ```env
   EMAIL_USER=sigede.dpkj@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

---

## 🔍 Troubleshooting Errors

### Error: "EAUTH - Invalid login"
**Penyebab:**
- App Password salah atau tidak valid
- Masih menggunakan password Gmail biasa
- 2-Step Verification belum diaktifkan

**Solusi:**
1. Pastikan sudah menggunakan App Password (bukan password biasa)
2. Aktifkan 2-Step Verification
3. Generate ulang App Password
4. Pastikan tidak ada spasi dalam password di .env.local

---

### Error: "ETIMEDOUT - Connection timeout"
**Penyebab:**
- Port atau host salah
- Firewall memblokir koneksi SMTP
- Internet tidak stabil

**Solusi:**
1. Pastikan `EMAIL_PORT=587` dan `EMAIL_HOST=smtp.gmail.com`
2. Cek koneksi internet
3. Nonaktifkan sementara firewall/antivirus untuk testing
4. Coba gunakan port 465 dengan `EMAIL_SECURE=true`

---

### Error: "ESOCKET - Connection refused"
**Penyebab:**
- SMTP server tidak dapat dijangkau
- Port salah atau diblokir

**Solusi:**
1. Test koneksi: `telnet smtp.gmail.com 587`
2. Pastikan port 587 atau 465 tidak diblokir
3. Coba restart aplikasi

---

### Error: "Missing credentials"
**Penyebab:**
- `EMAIL_USER` atau `EMAIL_PASSWORD` tidak diset di .env.local

**Solusi:**
1. Cek file `.env.local` ada di root project
2. Pastikan kedua variable diisi:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
3. Restart dev server: `npm run dev`

---

## 🚀 Testing Konfigurasi

### 1. Cek Environment Variables
Buka browser console atau terminal server, lihat log:
```
=== EMAIL CONFIGURATION ===
EMAIL_HOST: smtp.gmail.com
EMAIL_PORT: 587
EMAIL_USER: sigede.dpkj@gmail.com
EMAIL_PASSWORD: ****
```

### 2. Test SMTP Connection
Log akan menampilkan hasil `transporter.verify()`:
```
✅ SMTP Connection verified successfully
SMTP Host: smtp.gmail.com:587
```

### 3. Test Email Sending
Coba kirim OTP dari form registrasi:
- Klik "Kirim Kode OTP"
- Cek console log: Harus muncul "EMAIL SENT SUCCESSFULLY"
- Cek inbox email yang digunakan
- OTP harus sampai dalam 1-2 menit

---

## 📝 Contoh .env.local Lengkap

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Email Configuration (Production-Ready)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=sigede.dpkj@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=SiGeDe DPKJ

# Development/Production Mode
NODE_ENV=development
```

---

## 🔒 Keamanan

### ⚠️ PENTING:
1. **Jangan commit .env.local ke Git**
   - File ini sudah di `.gitignore`
   - Berisi credential sensitif

2. **Jangan share App Password**
   - Siapapun dengan App Password bisa kirim email atas nama Anda
   - Generate password baru jika tercuri

3. **Gunakan email khusus untuk aplikasi**
   - Jangan gunakan email pribadi
   - Buat email baru khusus untuk SiGeDe: `noreply@domain.com`

4. **Monitoring penggunaan**
   - Cek Gmail Activity: https://myaccount.google.com/notifications
   - Periksa email yang terkirim secara berkala

---

## 📞 Bantuan Lebih Lanjut

Jika masih error setelah mengikuti panduan ini:

1. **Cek Console Log** - Lihat error detail di terminal server
2. **Test Credentials** - Coba login manual ke Gmail dengan credentials tersebut
3. **Firestore Rules** - Pastikan rules mengizinkan write (jika OTP disimpan di Firestore)
4. **Contact Support** - Bawa screenshot error lengkap dari console

---

## 📚 Referensi

- Nodemailer Documentation: https://nodemailer.com/
- Gmail SMTP Settings: https://support.google.com/mail/answer/7126229
- Google App Passwords: https://support.google.com/accounts/answer/185833
