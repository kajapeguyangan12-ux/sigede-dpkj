# Cara Memperbaiki Error CORS Firebase Storage

Error CORS yang Anda alami disebabkan karena Firebase Storage belum dikonfigurasi untuk mengizinkan akses dari localhost. Berikut langkah-langkah untuk memperbaikinya:

## 🎯 Cara Termudah: Menggunakan Google Cloud Console (RECOMMENDED)

### Langkah 1: Buka Google Cloud Console
1. Buka: https://console.cloud.google.com/
2. Login dengan akun Google yang sama dengan Firebase
3. Pilih project **dpkj-ffc01** (di dropdown pojok kiri atas)

### Langkah 2: Aktifkan Cloud Shell
1. Klik icon **Cloud Shell** `>_` di pojok kanan atas navbar
2. Cloud Shell akan terbuka di bagian bawah browser
3. Tunggu beberapa detik sampai terminal siap

### Langkah 3: Buat dan Terapkan CORS Configuration
Copy-paste command ini di Cloud Shell (tekan Enter setelah selesai):

```bash
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
EOF
```

Kemudian jalankan command ini:

```bash
gcloud storage buckets update gs://dpkj-ffc01.firebasestorage.app --cors-file=cors.json
```

### Langkah 4: Verifikasi CORS Configuration
Untuk memverifikasi bahwa CORS sudah teraplikasi:

```bash
gcloud storage buckets describe gs://dpkj-ffc01.firebasestorage.app --format="default(cors_config)"
```

### Langkah 5: Restart Development Server
Kembali ke VS Code, restart server Next.js:

```powershell
# Stop server yang sedang berjalan (Ctrl+C)
# Kemudian jalankan ulang
npm run dev
```

**✅ SELESAI!** Error CORS seharusnya sudah teratasi.

---

## 🔧 Alternatif: Install Google Cloud SDK di Komputer Lokal

Jika Anda ingin menggunakan terminal lokal (tidak di browser):

### 1. Install Google Cloud SDK
Download dan install dari: https://cloud.google.com/sdk/docs/install

### 2. Login ke Google Cloud
```powershell
gcloud auth login
```

### 3. Set Project ID
```powershell
gcloud config set project dpkj-ffc01
```

### 4. Terapkan Konfigurasi CORS
Jalankan dari direktori root project:

```powershell
gcloud storage buckets update gs://dpkj-ffc01.firebasestorage.app --cors-file=firebase-storage-cors.json
```

Atau jika menggunakan gsutil:

```powershell
gsutil cors set firebase-storage-cors.json gs://dpkj-ffc01.firebasestorage.app
```

### 5. Restart Development Server
```powershell
npm run dev
```

---

## 📋 Yang Sudah Diperbaiki

1. ✅ `next.config.ts` - Ditambahkan konfigurasi headers CORS
2. ✅ `firebase-storage-cors.json` - Dibuat file konfigurasi CORS
3. ✅ `storage.rules` - Storage rules lengkap dengan security
4. ✅ Panduan Cloud Shell di Google Cloud Console

---

## 💡 Catatan Penting

- **CORS configuration** hanya bisa diatur melalui Google Cloud (gcloud/gsutil)
- **Storage Rules** untuk authorization sudah benar dan bisa di-deploy via Firebase
- Menggunakan **Cloud Shell di Google Cloud Console** adalah cara termudah (tidak perlu install apapun)
- Setelah CORS diterapkan, konfigurasi bersifat **permanen** (tidak perlu diulang)
