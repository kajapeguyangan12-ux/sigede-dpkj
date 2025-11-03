# 🔐 Firebase Storage Rules - Deployment Guide

## 📋 Overview
File `storage.rules` berisi security rules untuk Firebase Storage yang mengatur siapa saja yang bisa membaca, menulis, dan menghapus file.

## 🗂️ Struktur Folder dan Permissions

### 1. **E-News** (`/e-news/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar
- **Digunakan untuk**: Foto berita

### 2. **Pengumuman** (`/pengumuman/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar
- **Digunakan untuk**: Foto pengumuman

### 3. **Ucapan Selamat Datang** (`/ucapan-selamat-datang.jpg`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar
- **Digunakan untuk**: Gambar ucapan di home page masyarakat

### 4. **Foto Kepala Desa** (`/kepala-desa.jpg`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 5. **Slideshow** (`/slideshow/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 6. **Popup** (`/popup/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 7. **Profil Desa** (`/profil-desa/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 8. **Wisata Budaya** (`/wisata-budaya/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 9. **E-UMKM** (`/e-umkm/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 10. **Layanan Publik** (`/layanan-publik/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Validasi**: Max 5MB, harus file gambar

### 11. **Data Desa KK** (`/data-desa-kk/`)
- **Read**: Hanya Admin
- **Write/Delete**: Hanya Admin
- **Digunakan untuk**: File Excel data KK (sensitif)

### 12. **Regulasi** (`/regulasi/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Hanya Admin
- **Digunakan untuk**: Dokumen peraturan

### 13. **Keuangan** (`/keuangan/`)
- **Read**: Hanya user yang sudah login
- **Write/Delete**: Hanya Admin
- **Digunakan untuk**: Laporan keuangan

### 14. **User Profile** (`/users/{userId}/`)
- **Read**: Semua orang (public)
- **Write/Delete**: Pemilik akun atau Admin
- **Validasi**: Max 5MB, harus file gambar

## 🚀 Cara Deploy Rules

### Opsi 1: Deploy via Firebase Console (Manual)
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project Anda
3. Klik **Storage** di menu kiri
4. Klik tab **Rules** di bagian atas
5. Copy semua isi file `storage.rules`
6. Paste ke editor
7. Klik **Publish**

### Opsi 2: Deploy via Firebase CLI (Recommended)
```powershell
# 1. Install Firebase CLI (jika belum)
npm install -g firebase-tools

# 2. Login ke Firebase
firebase login

# 3. Initialize Firebase (jika belum)
firebase init

# Pilih:
# - Storage: Configure security rules
# - Gunakan file storage.rules yang sudah ada

# 4. Deploy Storage Rules
firebase deploy --only storage

# Atau deploy semua (firestore + storage)
firebase deploy --only firestore,storage
```

## 🔍 Validasi Rules

### Test di Firebase Console:
1. Buka **Storage** → **Rules** → **Rules Playground**
2. Test scenarios:
   - **Public Read**: `gs://your-bucket/e-news/test.jpg` → get → Should succeed
   - **Admin Write**: `gs://your-bucket/e-news/test.jpg` → put → Simulate as admin user
   - **Non-admin Write**: `gs://your-bucket/e-news/test.jpg` → put → Simulate as regular user → Should fail

## 🛡️ Security Features

### 1. **Authentication Check**
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```
Memastikan user sudah login.

### 2. **Admin Check**
```javascript
function isAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```
Memastikan user memiliki role admin di Firestore.

### 3. **Image Validation**
```javascript
function isValidImage() {
  return request.resource.size < 5 * 1024 * 1024 && // Max 5MB
         request.resource.contentType.matches('image/.*');
}
```
Membatasi ukuran file dan memastikan hanya gambar yang bisa diupload.

## ⚠️ Important Notes

### 1. **Role Admin Harus Ada di Firestore**
Pastikan user admin memiliki field `role: "admin"` di collection `users`:
```javascript
// Collection: users
// Document ID: {userId}
{
  email: "admin@example.com",
  role: "admin",  // ← Harus ada!
  name: "Admin Name"
}
```

### 2. **CORS Configuration**
Jika ada masalah CORS saat upload, tambahkan CORS config:
```json
[
  {
    "origin": ["http://localhost:3000", "https://yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

Save as `cors.json` dan deploy:
```powershell
gsutil cors set cors.json gs://your-bucket-name
```

### 3. **File Size Limit**
Default limit: **5MB** per file
Untuk mengubah, edit di `storage.rules`:
```javascript
request.resource.size < 10 * 1024 * 1024 // 10MB
```

## 🐛 Troubleshooting

### Error: "Permission Denied"
**Penyebab**: User tidak memiliki role admin atau rules belum di-deploy
**Solusi**:
1. Cek role di Firestore: `users/{userId}` harus punya `role: "admin"`
2. Deploy rules: `firebase deploy --only storage`
3. Clear browser cache dan coba lagi

### Error: "File too large"
**Penyebab**: File melebihi 5MB
**Solusi**: Compress gambar atau tingkatkan limit di rules

### Error: "Invalid file type"
**Penyebab**: Bukan file gambar
**Solusi**: Pastikan upload file dengan MIME type `image/*`

## 📊 Monitoring

### Check Storage Usage:
1. Firebase Console → Storage → Usage
2. Monitor:
   - Total storage used
   - Number of files
   - Download/upload activity

### Check Access Logs:
1. Firebase Console → Storage → Logs
2. Filter by:
   - Operation type (read/write/delete)
   - Success/failure
   - User ID

## 🔄 Update Rules

Jika perlu update rules:
1. Edit file `storage.rules`
2. Test locally jika memungkinkan
3. Deploy: `firebase deploy --only storage`
4. Verify di Firebase Console

## ✅ Deployment Checklist

- [ ] File `storage.rules` sudah dibuat
- [ ] File `firebase.json` sudah di-update dengan storage config
- [ ] Firebase CLI sudah terinstall
- [ ] Sudah login ke Firebase: `firebase login`
- [ ] Project sudah di-init: `firebase init`
- [ ] Rules sudah di-deploy: `firebase deploy --only storage`
- [ ] User admin sudah punya field `role: "admin"` di Firestore
- [ ] Test upload gambar dari admin panel
- [ ] Verify gambar bisa diakses public

---

**Created**: November 3, 2025
**Last Updated**: November 3, 2025
