# Dokumentasi Fitur OTP Email & Validasi Username

## Ringkasan Perubahan

Telah ditambahkan fitur validasi email dengan OTP dan validasi username unik pada halaman registrasi warga lokal (`/masyarakat/daftar/warga-lokal`).

## Fitur yang Ditambahkan

### 1. **Email Service dengan OTP** (`src/lib/emailService.ts`)
   - Generate OTP 6 digit secara random
   - Simpan OTP ke localStorage dengan expiry 5 menit
   - Verifikasi OTP yang diinput user
   - Tandai email sebagai terverifikasi setelah OTP benar

### 2. **API Endpoint untuk Kirim OTP** (`src/app/api/send-otp/route.ts`)
   - Endpoint: `POST /api/send-otp`
   - Menerima: `{ email, name, otp }`
   - Untuk development: OTP ditampilkan di console
   - Untuk production: Dapat di-integrate dengan email service (SendGrid, Nodemailer, dll)
   - Response: Success message dengan OTP (untuk dev mode)

### 3. **API Endpoint untuk Check Availability** (`src/app/api/check-availability/route.ts`)
   - Endpoint: `POST /api/check-availability`
   - Menerima: `{ username, email, nik }`
   - Cek ke Firestore collection `masyarakat`
   - Return: `{ usernameExists, emailExists, nikExists, message }`

### 4. **Update Halaman Registrasi Warga Lokal** (`src/app/masyarakat/daftar/warga-lokal/page.tsx`)

#### Validasi Username:
- Real-time check saat blur dari input username
- Username minimal 3 karakter
- Tidak boleh duplikat dengan yang sudah ada di database
- Visual feedback: green border untuk tersedia, red untuk sudah terpakai
- Auto check saat user selesai mengetik username

#### Validasi Email dengan OTP:
- User input email
- Klik tombol "Kirim Kode OTP"
- OTP dikirim ke email (saat ini ditampilkan di console untuk development)
- User masukkan 6 digit OTP
- Klik tombol "Verifikasi OTP"
- Email akan ditandai sebagai terverifikasi jika OTP benar
- OTP expired dalam 5 menit
- User bisa request kirim ulang OTP

#### Validasi NIK (sudah ada sebelumnya):
- NIK harus terdaftar di data-desa
- Cek NIK ke collection data-desa
- Auto-fill tanggal lahir dan daerah setelah NIK terverifikasi

#### Submit Button:
Tombol "Daftar Sekarang" hanya aktif jika:
1. ✅ NIK sudah terverifikasi
2. ✅ Email sudah terverifikasi dengan OTP
3. ✅ Username sudah dicek dan tersedia

## Cara Menggunakan (User Flow)

1. User masuk ke halaman `/masyarakat/daftar/warga-lokal`
2. User input NIK (16 digit)
3. Klik tombol "Cek NIK" untuk verifikasi NIK
4. Jika NIK valid, form lain akan terisi otomatis (daerah, tanggal lahir)
5. User input nama lengkap
6. User input username (minimal 3 karakter)
   - Saat blur/keluar dari input, otomatis dicek ketersediaannya
   - Harus menunggu sampai status "tersedia" muncul
7. User input email
8. Klik tombol "Kirim Kode OTP"
9. Cek email untuk mendapatkan kode OTP (atau lihat di console browser untuk development)
10. Input 6 digit kode OTP
11. Klik tombol "Verifikasi OTP"
12. Lengkapi form lainnya (alamat, tempat lahir, jenis kelamin, dll)
13. Input password dan konfirmasi password
14. Klik tombol "Daftar Sekarang" (hanya aktif jika semua validasi terpenuhi)

## Development Mode

Untuk development, OTP akan ditampilkan di:
- Browser Console (client-side)
- Server Console (terminal yang menjalankan `npm run dev`)

Format di console:
```
========================================
📧 OTP EMAIL NOTIFICATION
========================================
To: user@example.com
Name: Nama User
OTP Code: 123456
========================================
```

## Production Setup

Untuk production, Anda perlu:

1. **Setup Email Service**
   - Pilih email provider (SendGrid, Gmail SMTP, Mailgun, dll)
   - Dapatkan credentials (API key atau SMTP credentials)
   
2. **Edit file `src/app/api/send-otp/route.ts`**
   - Uncomment bagian kode Nodemailer atau integrate dengan email service pilihan
   - Tambahkan environment variables untuk credentials:
     ```
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-app-password
     ```
   
3. **Contoh dengan Nodemailer (Gmail)**:
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```
   
   Kemudian uncomment bagian nodemailer di `route.ts` dan setup credentials di `.env.local`

## Testing

### Test OTP Flow:
1. Buka halaman registrasi
2. Input email valid
3. Klik "Kirim Kode OTP"
4. Lihat OTP di console browser/server
5. Copy OTP tersebut
6. Paste ke input OTP
7. Klik "Verifikasi OTP"
8. Status email akan berubah menjadi "Terverifikasi"

### Test Username Validation:
1. Input username yang sudah ada di database
2. Blur dari input field
3. Pesan "Username sudah digunakan" akan muncul
4. Input username baru yang belum ada
5. Blur dari input field
6. Pesan "Username tersedia" akan muncul

### Test Submit Button:
1. Coba klik submit sebelum verifikasi NIK → button disabled
2. Coba klik submit sebelum verifikasi email → button disabled
3. Coba klik submit dengan username yang tidak tersedia → button disabled
4. Lengkapi semua validasi → button aktif dan bisa submit

## Keamanan

- OTP disimpan di localStorage dengan expiry time
- OTP hanya valid selama 5 menit
- OTP dihapus setelah berhasil diverifikasi
- Username, email, dan NIK dicek uniqueness di database
- Password minimal 6 karakter
- Semua validasi dilakukan di client dan server side

## Notes

- Fitur ini sudah terintegrasi dengan flow registrasi yang ada
- Tidak mengubah struktur database yang sudah ada
- Backward compatible dengan data yang sudah ada
- Email service masih dalam mode development (console log)
- Siap untuk production dengan setup email service provider

## Support

Jika ada pertanyaan atau issue, silakan dokumentasikan di repository atau hubungi developer.
