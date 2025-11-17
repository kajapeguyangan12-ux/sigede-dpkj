# Perbaikan Form Registrasi Warga Lokal

## 📋 Deskripsi
Dokumentasi ini menjelaskan perubahan yang dilakukan pada form registrasi warga lokal untuk meningkatkan UX dan menghilangkan auto-fill yang membingungkan.

## 🎯 Permasalahan Sebelumnya
1. **NIK berada di posisi tengah** - Tidak intuitif karena verifikasi NIK adalah langkah pertama
2. **Auto-fill setelah verifikasi NIK** - Field otomatis terisi dari data-desa, membuat user bingung
3. **Field readonly** - Setelah NIK terverifikasi, beberapa field tidak bisa diedit (tanggal lahir, dll)
4. **Field Nama dan Username tidak ada** - Missing di form HTML

## ✅ Solusi yang Diterapkan

### 1. **Reorder Form - NIK di Posisi Paling Atas**
```tsx
// Urutan baru form:
1. NIK (dengan tombol "Cek NIK")
2. Nama Lengkap
3. Username
4. No. KK (Kartu Keluarga)
5. Alamat
6. Tempat Lahir
7. Tanggal Lahir
8. Jenis Kelamin
9. Agama
10. Pekerjaan
11. Status Perkawinan
12. No. Telepon
13. Email
14. Password
15. Konfirmasi Password
```

### 2. **Hilangkan Auto-Fill - User Isi Sendiri**

#### **handleCheckNIK Function (Lines 101-135)**
```typescript
const handleCheckNIK = async () => {
  // Validate NIK format first
  if (!formData.nik || formData.nik.length !== 16) {
    setNikMessage('❌ NIK harus 16 digit');
    setNikVerified(false);
    return;
  }
  
  setNikChecking(true);
  setNikMessage('');
  setError('');
  
  try {
    const dataWarga = await getDataDesa();
    const matchedData = dataWarga.find(item => item.nik === formData.nik);
    
    if (matchedData) {
      // ✅ HANYA SET VERIFIED FLAG - TIDAK AUTO-FILL FIELD
      setNikVerified(true);
      setVerifiedData(matchedData);
      setNikMessage(`✅ NIK valid! Anda dapat melanjutkan registrasi.`);
    } else {
      setNikVerified(false);
      setVerifiedData(null);
      setNikMessage('❌ NIK tidak terdaftar di data desa.');
      setError('NIK tidak ditemukan dalam database penduduk desa.');
    }
  } catch (error: any) {
    setNikMessage('❌ Gagal memeriksa NIK. Silakan coba lagi.');
    setError(`Terjadi kesalahan: ${error.message}`);
    setNikVerified(false);
  } finally {
    setNikChecking(false);
  }
};
```

**Perubahan:**
- ❌ **Dihapus:** Auto-fill logic untuk nama, tanggal lahir, tempat lahir, dll
- ✅ **Tetap:** Validasi NIK terhadap database data-desa
- ✅ **Tetap:** Set `nikVerified` flag untuk enable submit button

### 3. **Hapus Readonly Attributes**

#### **Before (Lines 475-495)**
```tsx
<input
  type="date"
  name="tanggalLahir"
  value={formData.tanggalLahir}
  onChange={handleInputChange}
  readOnly={nikVerified}  // ❌ Field jadi readonly
  className={`... ${
    nikVerified ? 'bg-green-50 border-green-300 cursor-not-allowed' : '...'
  }`}
  required
/>
```

#### **After**
```tsx
<input
  type="date"
  name="tanggalLahir"
  value={formData.tanggalLahir}
  onChange={handleInputChange}
  // ✅ Tidak ada readOnly
  className="w-full px-6 py-4 border bg-gray-50 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900"
  required
/>
```

**Perubahan:**
- ❌ **Dihapus:** `readOnly={nikVerified}` attribute
- ❌ **Dihapus:** Conditional styling (green background, cursor-not-allowed)
- ❌ **Dihapus:** Label hint "(Dari data desa)"
- ✅ **Tetap:** Field selalu editable setelah NIK verified

### 4. **Tambahkan Field yang Missing**

#### **Nama Lengkap (Lines 450-461)**
```tsx
<div>
  <label className="block text-sm font-bold text-gray-800 mb-3">
    Nama Lengkap <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="namaLengkap"
    value={formData.namaLengkap}
    onChange={handleInputChange}
    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
    placeholder="Nama lengkap sesuai KTP"
    required
  />
</div>
```

#### **Username (Lines 463-474)**
```tsx
<div>
  <label className="block text-sm font-bold text-gray-800 mb-3">
    Username <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="username"
    value={formData.username}
    onChange={handleInputChange}
    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
    placeholder="Username untuk login"
    required
  />
</div>
```

#### **No. KK - Kartu Keluarga (Lines 476-489)**
```tsx
<div className="lg:col-span-2">
  <label className="block text-sm font-bold text-gray-800 mb-3">
    No. KK (Kartu Keluarga)
  </label>
  <input
    type="text"
    name="noKK"
    value={formData.noKK}
    onChange={handleInputChange}
    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
    placeholder="Nomor Kartu Keluarga (opsional)"
    maxLength={16}
    inputMode="numeric"
    pattern="[0-9]*"
  />
</div>
```

**Catatan:**
- Field sudah ada di `formData` state (lines 39-56)
- Field sudah divalidasi di `validateForm()` (lines 148-221)
- Field sudah dikirim ke backend di `handleSubmit()` (lines 232-241)
- ✅ Sekarang sudah ditambahkan di form HTML

## 🔄 User Flow Baru

### **1. User Mengisi NIK**
```
User input NIK 16 digit
   ↓
Counter menunjukkan: "12/16 digit"
   ↓
Ketika 16 digit: "✓ Siap dicek" (tombol "Cek NIK" enabled)
```

### **2. User Klik "Cek NIK"**
```
Loading state: "Memeriksa NIK..."
   ↓
Check NIK di database data-desa
   ↓
   ├─ ✅ NIK ditemukan
   │     ↓
   │  "✅ NIK valid! Anda dapat melanjutkan registrasi."
   │  (Tombol jadi hijau "NIK Terverifikasi")
   │  (Form fields tetap KOSONG - user isi sendiri)
   │     ↓
   │  User mengisi semua field manual
   │     ↓
   │  Submit form ✅
   │
   └─ ❌ NIK tidak ditemukan
        ↓
     "❌ NIK tidak terdaftar di data desa."
     "Silakan hubungi admin desa."
```

### **3. User Mengisi Form Manual**
```
Setelah NIK verified:
   ↓
User isi SEMUA field sendiri:
  - Nama Lengkap
  - Username
  - No. KK (opsional)
  - Alamat
  - Tempat/Tanggal Lahir
  - Jenis Kelamin
  - Agama
  - Pekerjaan
  - Status Perkawinan
  - No. Telepon
  - Email
  - Password
   ↓
Submit form
   ↓
Registrasi berhasil → Redirect ke /masyarakat/login
```

## 📝 Validasi

### **validateForm() Function**
```typescript
// Check NIK verification first
if (!nikVerified) {
  setError('Silakan lakukan verifikasi NIK terlebih dahulu dengan klik tombol "Cek NIK"');
  return false;
}

// Required fields (No KK optional)
const requiredFields = [
  'namaLengkap', 'username', 'nik', 'alamat', 
  'tempatLahir', 'tanggalLahir', 'jenisKelamin', 
  'agama', 'pekerjaan', 'statusKawin', 
  'noTelp', 'email', 'password'
];

// NIK validation (16 digits)
if (formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
  setError('NIK harus terdiri dari 16 digit angka');
  return false;
}

// Password validation
if (formData.password.length < 6) {
  setError('Password minimal 6 karakter');
  return false;
}

if (formData.password !== formData.confirmPassword) {
  setError('Password dan konfirmasi password tidak cocok');
  return false;
}
```

**Validasi yang Dihapus:**
```typescript
// ❌ REMOVED: Validasi data harus match dengan data-desa
// Sebelumnya ada validasi seperti:
// if (formData.tanggalLahir !== verifiedData.tanggalLahir) { ... }
// if (formData.nama !== verifiedData.nama) { ... }
```

## 🎨 UI/UX Improvements

### **NIK Field**
```tsx
// Dynamic border color based on status:
- Gray (default): border-gray-200
- Orange (typing): border-orange-400 (when length > 0 and < 16)
- Blue (ready): border-blue-400 (when length === 16, not verified)
- Green (verified): border-green-400 bg-green-50

// Dynamic counter:
"0/16 digit" → "12/16 digit" → "✓ NIK Valid & Terverifikasi"

// Check button states:
- Disabled (gray): formData.nik.length !== 16 || nikChecking || nikVerified
- Enabled (blue): formData.nik.length === 16 && !nikVerified
- Success (green): nikVerified === true
```

### **Success/Error Messages**
```tsx
// NIK verification success:
✅ NIK valid! Anda dapat melanjutkan registrasi.

// NIK verification failure:
❌ NIK tidak terdaftar di data desa. Silakan hubungi admin desa.

// Form validation errors:
❌ Silakan lakukan verifikasi NIK terlebih dahulu
❌ NIK harus terdiri dari 16 digit angka
❌ Password minimal 6 karakter
❌ Password dan konfirmasi password tidak cocok
```

## 📊 File yang Dimodifikasi

### **src/app/masyarakat/daftar/warga-lokal/page.tsx**
- **Total lines:** 775 (bertambah dari 725)
- **Lines modified:**
  - 101-135: `handleCheckNIK()` - removed auto-fill logic
  - 148-221: `validateForm()` - removed data matching validation
  - 337-489: Form HTML - reordered, added fields, removed readonly
  - 475-495: Tanggal lahir field - removed readonly attribute

## ✅ Testing

### **Build Test**
```bash
npm run build
```

**Result:** ✅ Success
```
✓ Compiled successfully in 3.5s
✓ Finished TypeScript in 7.2s
✓ Collecting page data in 642.5ms
✓ Generating static pages (94/94) in 953.8ms
✓ Finalizing page optimization in 8.2ms
```

### **TypeScript Validation**
```bash
# No TypeScript errors in warga-lokal/page.tsx
```

## 🚀 Deployment Notes

### **Yang Perlu Diperhatikan:**
1. **Database data-desa harus ada** - NIK validation memerlukan collection `data-desa`
2. **Firestore rules** - Ensure `data-desa` readable untuk unauthenticated users (registrasi)
3. **User experience** - Users sekarang perlu mengisi semua data manual setelah NIK verified

### **Environment Variables:**
```env
# Firebase configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (required for backend)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
```

## 📌 Catatan Penting

### **Perubahan Behavior:**
1. **NIK validation** tetap sama - check apakah NIK ada di database data-desa
2. **Auto-fill REMOVED** - Semua field harus diisi manual oleh user
3. **Readonly REMOVED** - Tidak ada field yang readonly setelah NIK verified
4. **Form order changed** - NIK sekarang di posisi paling atas

### **Keuntungan:**
- ✅ User lebih jelas: NIK check first, then fill form
- ✅ Tidak ada confusion tentang field readonly
- ✅ User punya kontrol penuh atas data yang diinput
- ✅ Validasi tetap ketat: NIK harus valid di database

### **Trade-off:**
- ❌ User harus mengetik semua data manual (tidak auto-fill)
- ℹ️ Trade-off ini acceptable karena meningkatkan UX dan menghilangkan confusion

## 🔗 Related Files
- `src/lib/dataDesaService.ts` - Service untuk fetch data-desa
- `src/lib/userManagementService.ts` - Service untuk registrasi masyarakat
- `VERCEL_ENVIRONMENT_VARIABLES.md` - Deployment environment variables
- `DEPLOYMENT_GUIDE.md` - Full deployment guide

---

**Created:** 2025-01-XX
**Last Updated:** 2025-01-XX
**Status:** ✅ Completed & Tested
