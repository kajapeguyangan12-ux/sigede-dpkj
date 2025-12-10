# 🚀 Setup Resend API untuk OTP Email - SiGeDe DPKJ

## 📋 Ringkasan

Sistem OTP email SiGeDe DPKJ sekarang menggunakan **Resend API** untuk mengirim email, dengan OTP disimpan di **Firestore** (bukan localStorage).

## ✅ Arsitektur Baru

```
User Input Email
    ↓
[API: /api/send-otp]
    ↓
1. Generate OTP 6 digit
2. Simpan ke Firestore (collection: email_otps)
3. Kirim email via Resend API
    ↓
User Terima Email
    ↓
User Input OTP
    ↓
[API: /api/verify-otp]
    ↓
1. Query Firestore by email + OTP
2. Cek expired (5 menit)
3. Hapus OTP dari Firestore
4. Return verified: true/false
```

---

## 🔧 Setup Resend API

### Langkah 1: Daftar Resend Account

1. **Buka** https://resend.com/signup
2. **Sign up** dengan email Anda
3. **Verifikasi** email Anda
4. **Login** ke dashboard Resend

### Langkah 2: Dapatkan API Key

1. Di dashboard Resend, klik **API Keys** di sidebar
2. Klik tombol **Create API Key**
3. Beri nama: `SiGeDe DPKJ - OTP Email`
4. Permission: `Sending access` (default)
5. Klik **Create**
6. **COPY** API Key yang muncul (hanya tampil sekali!)

   Contoh API Key:
   ```
   re_123abc456_YourResendAPIKey789xyz
   ```

### Langkah 3: Setup di .env.local

1. Buka file `.env.local` di root project
2. Cari atau tambahkan baris:
   ```env
   RESEND_API_KEY=re_123abc456_YourResendAPIKey789xyz
   ```
3. Ganti dengan API Key Anda
4. **Save** file

### Langkah 4: Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Start ulang
npm run dev
```

---

## 🎨 Setup Domain Email (Opsional - Recommended untuk Production)

Secara default, Resend menggunakan `onboarding@resend.dev`. Untuk production, sebaiknya gunakan domain sendiri.

### Langkah-langkah:

1. **Beli domain** (contoh: `sigede-dpkj.com`)
2. Di **Resend Dashboard** → **Domains** → **Add Domain**
3. Masukkan domain Anda (atau subdomain: `mail.sigede-dpkj.com`)
4. **Verifikasi DNS Records:**
   - Resend akan berikan DNS records (SPF, DKIM, DMARC)
   - Tambahkan records ini di DNS provider Anda (Namecheap, Cloudflare, dll)
   - Tunggu propagasi DNS (5 menit - 24 jam)
5. Klik **Verify** di Resend dashboard

### Update Email Sender

Edit file: `src/app/api/send-otp/route.ts`

```typescript
// Ganti baris ini:
from: 'SiGeDe DPKJ <onboarding@resend.dev>',

// Menjadi domain Anda:
from: 'SiGeDe DPKJ <noreply@sigede-dpkj.com>',
```

---

## 🔥 Setup Firestore Rules

OTP disimpan di Firestore collection `email_otps`. Tambahkan rules berikut:

### Edit `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // OTP Email Collection Rules
    match /email_otps/{otpId} {
      // Allow API to create OTP (server-side via Admin SDK is better)
      allow create: if true;
      
      // Allow API to read OTP for verification
      allow read: if true;
      
      // Allow API to delete OTP after verification
      allow delete: if true;
      
      // Prevent updates
      allow update: if false;
    }
  }
}
```

### Deploy Firestore Rules:

```bash
firebase deploy --only firestore:rules
```

---

## 📊 Firestore Data Structure

Collection: `email_otps`

Document fields:
```typescript
{
  email: string,           // "user@example.com"
  otp: string,             // "123456"
  createdAt: Timestamp,    // Waktu dibuat
  expiresAt: Timestamp     // Waktu expired (createdAt + 5 menit)
}
```

### Auto Cleanup (Opsional)

Untuk menghapus OTP yang expired secara otomatis, gunakan Firebase Extensions atau Cloud Functions:

```typescript
// functions/src/cleanupExpiredOTPs.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const cleanupExpiredOTPs = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await admin.firestore()
      .collection('email_otps')
      .where('expiresAt', '<', now)
      .get();
    
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Deleted ${snapshot.size} expired OTPs`);
  });
```

---

## 🧪 Testing

### Test 1: Kirim OTP

1. Buka: `http://localhost:3000/masyarakat/daftar/warga-lokal`
2. Isi email Anda
3. Klik **"Kirim Kode OTP"**
4. **Cek Console Browser** (F12) → Network tab:
   - Request ke `/api/send-otp` harus status 200
   - Response: `{ success: true, message: "..." }`
5. **Cek Terminal Server**:
   ```
   ========================================
   🚀 API /api/send-otp - REQUEST RECEIVED
   ========================================
   ✅ OTP saved to Firestore successfully
   ✅✅✅ EMAIL SENT SUCCESSFULLY ✅✅✅
   ```
6. **Cek Inbox Email Anda** - OTP harus masuk

### Test 2: Verify OTP

1. Masukkan 6 digit OTP di form
2. Otomatis akan verify setelah 6 digit terisi
3. **Cek Console Browser**:
   - Request ke `/api/verify-otp` harus status 200
   - Response: `{ verified: true, message: "Email berhasil diverifikasi!" }`
4. **Cek Terminal Server**:
   ```
   ✅✅✅ OTP VERIFIED SUCCESSFULLY ✅✅✅
   Email: user@example.com
   ```

### Test 3: Cek Firestore

1. Buka **Firebase Console**
2. Pilih project `dpkj-ffc01`
3. Masuk ke **Firestore Database**
4. Lihat collection `email_otps`:
   - Saat OTP dikirim: Ada dokumen baru
   - Setelah verify berhasil: Dokumen terhapus

---

## ❌ Troubleshooting

### Error: "Email service belum dikonfigurasi"

**Penyebab:** `RESEND_API_KEY` tidak ada di `.env.local`

**Solusi:**
1. Cek file `.env.local` di root project
2. Pastikan ada baris: `RESEND_API_KEY=re_...`
3. Restart dev server: `npm run dev`

---

### Error: "Gagal menyimpan OTP"

**Penyebab:** Firestore rules tidak mengizinkan write

**Solusi:**
1. Update `firestore.rules` (lihat section di atas)
2. Deploy rules: `firebase deploy --only firestore:rules`

---

### Error: "Gagal mengirim email OTP"

**Penyebab:** 
- API Key salah
- Rate limit exceeded (free tier: 100 emails/day)
- Domain belum diverifikasi

**Solusi:**
1. Cek API Key di Resend Dashboard
2. Cek quota: Resend Dashboard → Usage
3. Jika pakai custom domain, cek DNS verification

---

### Email tidak masuk

**Penyebab:**
- Email masuk ke spam
- Domain reputation rendah (jika pakai custom domain)

**Solusi:**
1. Cek folder Spam/Junk
2. Tambahkan sender ke contacts
3. Gunakan domain terverifikasi dengan SPF/DKIM

---

## 💰 Pricing Resend (Per December 2024)

### Free Tier:
- ✅ **100 emails/day**
- ✅ **3,000 emails/month**
- ✅ Unlimited domains
- ✅ Full API access

### Pro Plan ($20/month):
- ✅ **50,000 emails/month**
- ✅ Priority support
- ✅ Custom SMTP

**Untuk development:** Free tier sudah cukup
**Untuk production:** Evaluasi based on user registration rate

---

## 📝 Files Created/Modified

### ✅ Created:
1. `src/lib/otpService.ts` - Firestore OTP management
2. `src/app/api/send-otp/route.ts` - API kirim OTP via Resend
3. `src/app/api/verify-otp/route.ts` - API verify OTP
4. `src/components/OTPInput.tsx` - UI 6 kotak input WhatsApp style
5. `RESEND_SETUP_GUIDE.md` - Dokumentasi ini

### ✅ Modified:
1. `src/app/masyarakat/daftar/warga-lokal/page.tsx` - Integrasi OTP flow
2. `.env.local` - Tambah RESEND_API_KEY
3. `firestore.rules` - Rules untuk email_otps collection

---

## 🎯 Next Steps

1. ✅ **Setup Resend API Key** di `.env.local`
2. ✅ **Update Firestore Rules** dan deploy
3. ✅ **Test kirim OTP** dari form registrasi
4. ✅ **Test verify OTP** dengan kode yang diterima
5. 🔜 **(Opsional)** Setup custom domain untuk production
6. 🔜 **(Opsional)** Setup Cloud Function untuk auto cleanup expired OTPs

---

## 📞 Support

Jika masih ada error:

1. **Check Console Logs** - Browser (F12) dan Terminal Server
2. **Check Resend Dashboard** - Logs → API Requests
3. **Check Firestore** - Data di collection `email_otps`
4. **Check Network Tab** - Request/Response dari `/api/send-otp` dan `/api/verify-otp`

Screenshot error lengkap untuk debugging lebih lanjut! 🚀
