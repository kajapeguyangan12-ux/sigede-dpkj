# 📝 Catatan: OTP Storage Implementation

## Status Saat Ini

**Implementasi OTP menggunakan `localStorage` (client-side storage)**

### Lokasi Kode:
- File: `src/lib/emailService.ts`
- Functions: `storeOTP()`, `verifyOTP()`, `clearOTP()`

### Cara Kerja:
```typescript
// Simpan OTP di localStorage browser
storeOTP(email: string, otp: string) {
  const expiryTime = Date.now() + 5 * 60 * 1000; // 5 menit
  localStorage.setItem(`otp_${email}`, JSON.stringify({ otp, expiryTime }));
}

// Verifikasi OTP dari localStorage
verifyOTP(email: string, inputOTP: string) {
  const stored = localStorage.getItem(`otp_${email}`);
  // Check if OTP matches and not expired
}
```

---

## ❓ Pertanyaan untuk User

Anda meminta "Tambahkan pengecekan apakah Firestore berhasil menyimpan dokumen OTP" tapi saat ini **OTP disimpan di localStorage, bukan Firestore**.

### Pilihan:

#### **Option 1: Tetap Pakai localStorage (Current)**
✅ **Kelebihan:**
- Sudah berfungsi dengan baik
- Tidak perlu setup Firestore collection
- Tidak ada biaya read/write Firestore
- Lebih cepat (no network request)

❌ **Kekurangan:**
- OTP hilang jika user clear browser cache
- Tidak bisa di-share antar device/browser
- Tidak ada backup server-side

#### **Option 2: Migrate ke Firestore**
✅ **Kelebihan:**
- OTP tersimpan di server (lebih aman)
- Bisa diakses dari device/browser berbeda
- Bisa monitoring OTP yang aktif
- Bisa auto-cleanup dengan TTL

❌ **Kekurangan:**
- Perlu setup Firestore collection + rules
- Ada biaya read/write (minimal)
- Perlu API endpoint tambahan
- Lebih kompleks

---

## 🔄 Jika Ingin Migrasi ke Firestore

### 1. Create Firestore Collection

Struktur dokumen di collection `otp_codes`:

```typescript
{
  email: "user@example.com",
  otp: "123456",
  createdAt: Timestamp,
  expiresAt: Timestamp, // createdAt + 5 menit
  verified: false,
  usedAt: null
}
```

### 2. Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // OTP Collection Rules
    match /otp_codes/{otpId} {
      // Allow read only if email matches
      allow read: if request.auth != null 
                  && resource.data.email == request.auth.token.email;
      
      // Allow write for OTP creation (from API)
      allow create: if request.time < timestamp.date(2030,1,1) 
                    && request.resource.data.expiresAt > request.time;
      
      // Allow update for verification
      allow update: if request.auth != null
                    && resource.data.email == request.auth.token.email
                    && !resource.data.verified;
      
      // Allow delete after expiry (cleanup)
      allow delete: if request.time > resource.data.expiresAt;
    }
  }
}
```

### 3. Update emailService.ts

```typescript
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const emailService = {
  // Store OTP in Firestore
  async storeOTP(email: string, otp: string): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      
      await addDoc(collection(db, 'otp_codes'), {
        email,
        otp,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        verified: false,
        usedAt: null
      });
      
      console.log('✅ OTP stored in Firestore');
      return true;
    } catch (error) {
      console.error('❌ Failed to store OTP in Firestore:', error);
      return false;
    }
  },

  // Verify OTP from Firestore
  async verifyOTP(email: string, inputOTP: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'otp_codes'),
        where('email', '==', email),
        where('otp', '==', inputOTP),
        where('verified', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('❌ OTP not found or already used');
        return false;
      }
      
      const otpDoc = snapshot.docs[0];
      const data = otpDoc.data();
      
      // Check expiry
      if (data.expiresAt.toDate() < new Date()) {
        console.log('❌ OTP expired');
        return false;
      }
      
      // Mark as verified
      await updateDoc(doc(db, 'otp_codes', otpDoc.id), {
        verified: true,
        usedAt: Timestamp.now()
      });
      
      console.log('✅ OTP verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      return false;
    }
  },

  // Clear expired OTPs (optional cleanup function)
  async clearExpiredOTPs(): Promise<void> {
    try {
      const q = query(
        collection(db, 'otp_codes'),
        where('expiresAt', '<', Timestamp.now())
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Cleared ${snapshot.size} expired OTPs`);
    } catch (error) {
      console.error('❌ Failed to clear expired OTPs:', error);
    }
  }
};
```

### 4. Update API Route

Tambahkan pengecekan Firestore save di `/api/send-otp/route.ts`:

```typescript
// After generating OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Try to store in Firestore
const stored = await storeOTPInFirestore(email, otp);
if (!stored) {
  console.error('⚠️ WARNING: Failed to store OTP in Firestore');
  return NextResponse.json(
    {
      success: false,
      message: 'Gagal menyimpan OTP. Silakan coba lagi.',
      error_type: 'FIRESTORE_WRITE_ERROR'
    },
    { status: 500 }
  );
}

console.log('✅ OTP stored in Firestore successfully');
// Continue with email sending...
```

---

## 💡 Rekomendasi

### Untuk Development/Testing:
**Gunakan localStorage** (implementasi saat ini)
- Cepat, mudah, tidak perlu setup
- Cocok untuk testing fitur OTP

### Untuk Production:
**Migrate ke Firestore**
- Lebih aman dan reliable
- Bisa monitoring dan audit trail
- Mendukung multi-device

---

## 🎯 Keputusan Diperlukan

**Silakan pilih:**

1. **Tetap localStorage** → Tidak perlu perubahan, sudah berfungsi
2. **Migrate ke Firestore** → Saya akan implement full Firestore integration

Beri tahu pilihan Anda dan saya akan lanjutkan implementasi sesuai kebutuhan!

---

## 📊 Perbandingan Detail

| Aspek | localStorage | Firestore |
|-------|-------------|-----------|
| **Setup** | ✅ Mudah | ⚠️ Perlu config |
| **Speed** | ✅ Instant | ⚠️ Network delay |
| **Security** | ⚠️ Client-side | ✅ Server-side |
| **Persistence** | ❌ Browser only | ✅ Cross-device |
| **Monitoring** | ❌ Tidak bisa | ✅ Bisa tracking |
| **Cost** | ✅ Gratis | ⚠️ Pay per operation |
| **Cleanup** | ⚠️ Manual | ✅ Auto TTL |

---

Silakan beritahu keputusan Anda! 🚀
