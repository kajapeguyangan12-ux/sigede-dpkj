# Setup Gmail untuk Mengirim OTP Email

## 📧 Panduan Lengkap Setup Email Service

Sistem OTP sekarang sudah terintegrasi dengan **Nodemailer** dan siap mengirim email ke alamat yang valid. Ikuti langkah-langkah berikut untuk mengaktifkan fitur ini.

---

## 🚀 Langkah 1: Buat Gmail Khusus untuk Aplikasi (Recommended)

Untuk keamanan dan profesionalitas, buat email khusus untuk aplikasi:

**Option A: Email Gratis Gmail**
- Buat akun baru: `sigede.dpkj@gmail.com` atau sejenisnya
- Email ini akan tampil sebagai pengirim
- Display name: **SiGeDe DPKJ**

**Option B: Email Domain Sendiri (Lebih Profesional)**
- Gunakan domain desa: `noreply@dpkj.go.id`
- Setup dengan Google Workspace atau email hosting lainnya

---

## 🔐 Langkah 2: Generate App Password Gmail

### A. Enable 2-Step Verification

1. Login ke akun Gmail yang akan digunakan
2. Buka: https://myaccount.google.com/security
3. Scroll ke bagian "**Signing in to Google**"
4. Klik "**2-Step Verification**"
5. Ikuti instruksi untuk mengaktifkan (biasanya via SMS)
6. Selesai setup 2-Step Verification

### B. Create App Password

1. Setelah 2-Step Verification aktif, kembali ke: https://myaccount.google.com/security
2. Scroll ke "**Signing in to Google**"
3. Klik "**App passwords**" (muncul setelah 2FA aktif)
4. Mungkin diminta password lagi untuk verifikasi
5. Pilih app: "**Mail**"
6. Pilih device: "**Other (Custom name)**"
7. Ketik nama: "**SiGeDe DPKJ OTP Service**"
8. Klik "**Generate**"
9. **COPY** password 16 digit yang muncul (contoh: `abcd efgh ijkl mnop`)
10. Password ini hanya ditampilkan 1x, simpan dengan aman!

---

## ⚙️ Langkah 3: Update Environment Variables

Edit file `.env.local` di root project:

```env
# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=sigede.dpkj@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=SiGeDe DPKJ
EMAIL_FROM_ADDRESS=noreply@dpkj.com
```

**Penjelasan:**
- `EMAIL_USER`: Email Gmail Anda yang sudah dibuat
- `EMAIL_PASSWORD`: 16-digit App Password (tanpa spasi!)
- `EMAIL_FROM_NAME`: Nama yang tampil di inbox penerima
- `EMAIL_FROM_ADDRESS`: Alamat email yang ditampilkan (bisa berbeda dari EMAIL_USER)

---

## 🧪 Langkah 4: Test Email Service

### A. Restart Development Server

```bash
# Stop server yang sedang berjalan (Ctrl+C)
# Kemudian start lagi
npm run dev
```

### B. Test Kirim OTP

1. Buka browser: `http://localhost:3000/masyarakat/daftar/warga-lokal`
2. Isi form sampai bagian Email
3. Input email VALID yang bisa Anda akses (bisa email pribadi untuk testing)
4. Klik "**Kirim Kode OTP**"
5. Tunggu beberapa detik
6. **Cek inbox email Anda** (atau folder Spam jika tidak ada di Inbox)
7. Anda akan menerima email dengan subject: "🔐 Kode Verifikasi OTP - Registrasi SiGeDe DPKJ"
8. Email akan tampil dari: "**SiGeDe DPKJ**"
9. Copy kode OTP 6 digit dari email
10. Paste ke form dan klik "**Verifikasi OTP**"

### C. Check Logs

Di terminal tempat Anda run `npm run dev`, akan muncul log:

```
========================================
📧 SENDING OTP EMAIL
========================================
To: user@example.com
Name: Nama User
OTP Code: 123456
========================================
✅ SMTP server is ready to send emails
📤 Sending email...
✅ Email sent successfully: <message-id>
```

---

## 🎨 Template Email yang Dikirim

Email OTP yang dikirim memiliki design profesional dengan:

- ✅ Header dengan gradient merah (warna DPKJ)
- ✅ Logo/nama: **SiGeDe DPKJ**
- ✅ Kode OTP dalam box besar yang mudah dibaca
- ✅ Warning tentang expiry (5 menit)
- ✅ Tips keamanan
- ✅ Footer dengan copyright
- ✅ Responsive design (terlihat bagus di mobile & desktop)

Contoh tampilan:

```
┌────────────────────────────────────────┐
│         SiGeDe DPKJ                    │
│  Sistem Informasi Desa Dauh Puri Kaja  │
├────────────────────────────────────────┤
│                                        │
│  Halo, Nama User! 👋                   │
│                                        │
│  Terima kasih telah mendaftar...       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │        1 2 3 4 5 6               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ⚠️ Kode ini akan kadaluarsa dalam    │
│     5 menit                            │
│                                        │
│  Tips Keamanan:                        │
│  • Jangan bagikan kode ini             │
│  • Kami tidak akan meminta kode OTP    │
│                                        │
└────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Error: "Invalid login" atau "Username and Password not accepted"

**Solusi:**
1. Pastikan 2-Step Verification sudah aktif
2. Gunakan App Password (16 digit), BUKAN password Gmail biasa
3. Hapus spasi dari App Password
4. Restart dev server setelah update .env.local

### Email masuk ke Spam

**Solusi:**
1. Normal untuk email baru pertama kali
2. Mark as "Not Spam" di inbox
3. Untuk production, gunakan email domain sendiri dengan SPF/DKIM setup
4. Atau gunakan email service professional (SendGrid, AWS SES)

### Error: "Connection timeout"

**Solusi:**
1. Check internet connection
2. Pastikan firewall tidak block port 587
3. Coba ganti EMAIL_PORT ke 465 dan EMAIL_SECURE ke true

### Email tidak terkirim tapi tidak error

**Solusi:**
1. Check EMAIL_USER dan EMAIL_PASSWORD di .env.local
2. Pastikan tidak ada typo
3. Restart dev server
4. Check console untuk error logs

---

## 🚀 Production Deployment

Untuk production (hosting online), tambahkan environment variables di platform hosting:

### Vercel
```bash
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
# ... dst untuk semua EMAIL_* variables
```

### Netlify
Tambahkan di: Site settings > Environment variables

### Heroku
```bash
heroku config:set EMAIL_USER=sigede.dpkj@gmail.com
heroku config:set EMAIL_PASSWORD=abcdefghijklmnop
# ... dst
```

---

## 📊 Rate Limits

### Gmail SMTP Free
- **500 emails per day** (reset setiap 24 jam)
- **Recommended untuk**: Development & small deployment

### Jika butuh lebih banyak:
- **Google Workspace**: 2000 emails/day
- **SendGrid**: 100 emails/day (free), unlimited (paid)
- **AWS SES**: 62,000 emails/bulan (free tier)

---

## 🔒 Keamanan Best Practices

1. ✅ **Jangan commit .env.local** ke git
2. ✅ Gunakan App Password, bukan password Gmail asli
3. ✅ Rotasi password secara berkala (3-6 bulan)
4. ✅ Monitor email logs untuk suspicious activity
5. ✅ Setup rate limiting di API untuk prevent abuse
6. ✅ Untuk production, gunakan email service dedicated (SendGrid/AWS SES)

---

## 📞 Support

Jika masih ada masalah:

1. Check terminal logs untuk error messages
2. Check browser console (F12)
3. Test dengan email lain
4. Pastikan semua env variables terisi dengan benar

---

## ✅ Checklist Setup

- [ ] Buat Gmail baru atau gunakan existing
- [ ] Enable 2-Step Verification
- [ ] Generate App Password
- [ ] Copy App Password (16 digit)
- [ ] Update .env.local dengan credentials
- [ ] Restart development server
- [ ] Test kirim OTP ke email valid
- [ ] Verify OTP berhasil diterima di inbox
- [ ] Test verifikasi OTP
- [ ] Email berhasil terverifikasi ✅

---

**Selamat! Email OTP service sudah aktif! 🎉**

Email akan dikirim dengan nama pengirim: **SiGeDe DPKJ**
Dan terlihat sangat profesional untuk pengguna umum.
