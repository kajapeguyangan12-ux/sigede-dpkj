# Environment Variables untuk Vercel - SIGEDE (Sistem Informasi Desa)

## 📋 Daftar Environment Variables yang Diperlukan

Salin dan tempel environment variables berikut ke dashboard Vercel Anda untuk memastikan aplikasi SIGEDE berjalan dengan lancar.

### 🔥 Firebase Configuration (Wajib)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 🔐 Firebase Admin SDK (Wajib untuk Storage & Database)
```
FIREBASE_ADMIN_TYPE=service_account
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY_ID=key-id-here
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=123456789012345678901
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

### 🗺️ Google Maps API (untuk Fitur Wisata & Lokasi)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### ⚙️ Next.js Configuration
```
NEXTAUTH_SECRET=your-nextauth-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 🚀 Vercel Deployment Settings
```
VERCEL=1
VERCEL_URL=your-domain.vercel.app
```

---

## 📝 Cara Mendapatkan Firebase Credentials

### 1. Firebase Project Configuration
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik ⚙️ Settings → Project settings
4. Di tab "General", scroll ke bawah ke "Your apps"
5. Pilih web app Anda dan salin config

### 2. Firebase Admin SDK
1. Di Firebase Console, klik ⚙️ Settings → Project settings
2. Pilih tab "Service accounts"
3. Klik "Generate new private key"
4. Download file JSON
5. Buka file JSON dan salin values ke environment variables

### 3. Google Maps API
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project yang sama dengan Firebase
3. Enable Google Maps JavaScript API
4. Buat API Key di Credentials
5. Restrict API key untuk keamanan

---

## 🔧 Firebase Storage Rules (Upload File .rules ke Firebase)

Pastikan Firebase Storage rules memungkinkan upload gambar:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all users
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow authenticated users to upload
    match /uploads/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admin uploads
    match /admin/{allPaths=**} {
      allow write: if request.auth != null;
    }
    
    // Profile photos
    match /profile_photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public uploads (e-news, wisata, etc)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🗄️ Firestore Database Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to public collections
    match /pengaturan/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /berita/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /pengumuman/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /wisata/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /umkm/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User-specific data
    match /masyarakat/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /laporan_pengaduan/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /layanan_publik/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Admin-only collections
    match /users/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## ⚡ Deployment Checklist

### ✅ Sebelum Deploy
- [ ] Semua environment variables sudah diset di Vercel
- [ ] Firebase project sudah dikonfigurasi
- [ ] Google Maps API sudah enabled
- [ ] Firebase Storage rules sudah di-upload
- [ ] Firestore rules sudah di-upload
- [ ] Domain sudah dikonfigurasi di Firebase Auth

### ✅ Setelah Deploy
- [ ] Test login admin
- [ ] Test login masyarakat
- [ ] Test upload gambar (e-news, wisata, profile)
- [ ] Test Google Maps (halaman wisata)
- [ ] Test semua fitur CRUD (Create, Read, Update, Delete)

---

## 🔍 Troubleshooting

### Gambar Tidak Muncul
1. Pastikan `FIREBASE_ADMIN_*` variables sudah benar
2. Check Firebase Storage rules
3. Pastikan gambar di-upload ke bucket yang benar

### Data Tidak Muncul
1. Check Firestore rules
2. Pastikan connection ke Firebase berhasil
3. Check console browser untuk error

### Google Maps Tidak Muncul
1. Pastikan `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` sudah benar
2. Enable Google Maps JavaScript API
3. Check billing account Google Cloud

---

## 📞 Support

Jika mengalami masalah:
1. Check Vercel deployment logs
2. Check browser console untuk error
3. Pastikan semua environment variables sudah benar
4. Test di localhost terlebih dahulu

---

## 🔒 Security Notes

- Jangan share Firebase Admin private key
- Restrict Google Maps API key
- Gunakan environment variables yang berbeda untuk development/production
- Review Firebase Security Rules secara berkala

---

*Dibuat untuk SIGEDE - Sistem Informasi Desa Dauh Puri Kaja*