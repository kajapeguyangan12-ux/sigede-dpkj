# Sistem Rating E-UMKM dengan Notifikasi Otomatis

Sistem rating untuk E-UMKM telah berhasil diimplementasikan dengan fitur notifikasi reminder otomatis.

## 📋 Fitur Utama

### 1. **Rating & Ulasan**
- User dapat memberikan rating dan ulasan untuk UMKM yang pernah dikunjungi
- Rating terdiri dari 4 aspek:
  - ⭐ Kualitas Produk
  - 😊 Pelayanan
  - 💰 Harga
  - ✨ Kebersihan
- Rating keseluruhan dihitung otomatis dari rata-rata 4 aspek
- User dapat menambahkan ulasan teks (opsional, max 500 karakter)
- User hanya bisa rating 1x per UMKM, tetapi bisa edit rating

### 2. **Tracking Kunjungan**
- Setiap kunjungan ke halaman detail UMKM otomatis terekam
- Data kunjungan disimpan dengan timestamp
- Tracking kunjungan digunakan untuk trigger notifikasi reminder

### 3. **Notifikasi Reminder Otomatis**
- Setelah 1-2 hari user mengunjungi UMKM
- Sistem otomatis mengirim notifikasi reminder untuk rating
- Notifikasi hanya dikirim 1x per kunjungan
- Notifikasi muncul dengan prioritas rendah (tidak mengganggu)

### 4. **Statistik Rating**
- Menampilkan rata-rata rating keseluruhan
- Distribusi rating (1-5 bintang)
- Rata-rata per aspek (kualitas, pelayanan, harga, kebersihan)
- Total jumlah ulasan

## 🚀 Cara Penggunaan

### **Untuk User (Warga)**

#### Memberikan Rating:
1. Buka halaman detail UMKM (klik UMKM dari daftar)
2. Scroll ke bawah, klik tombol **"Beri Rating & Ulasan"** (tombol kuning)
3. Beri penilaian untuk setiap aspek (1-5 bintang)
4. Tulis ulasan (opsional)
5. Klik **"Kirim Rating"**

#### Edit Rating:
1. Buka kembali halaman detail UMKM yang sudah pernah dirating
2. Tombol berubah menjadi **"Edit Rating & Ulasan"**
3. Ubah penilaian atau ulasan
4. Klik **"Update Rating"**

#### Melihat Rating:
- Rating dan ulasan ditampilkan di halaman detail UMKM
- Statistik rating ditampilkan dalam bentuk grafik dan angka
- Menampilkan 5 ulasan terakhir

#### Notifikasi Reminder:
1. Setelah mengunjungi UMKM, tunggu 1-2 hari
2. Akan muncul notifikasi: **"Bagaimana pengalaman Anda?"**
3. Klik notifikasi untuk langsung ke halaman detail UMKM
4. Beri rating sesuai pengalaman Anda

### **Untuk Admin/Developer**

#### Menjalankan Script Reminder Otomatis:

Script harus dijalankan setiap hari untuk mengirim notifikasi reminder.

**Manual (PowerShell):**
```powershell
cd "D:\Nextjs\backup\SiGede\DPKJ"
node scripts/sendRatingReminders.mjs
```

**Otomatis dengan Task Scheduler (Windows):**

1. Buka **Task Scheduler**
2. Klik **"Create Basic Task"**
3. Name: `E-UMKM Rating Reminder`
4. Trigger: **Daily** pada jam 10:00
5. Action: **Start a program**
   - Program: `node.exe`
   - Arguments: `scripts/sendRatingReminders.mjs`
   - Start in: `D:\Nextjs\backup\SiGede\DPKJ`
6. Finish

**Otomatis dengan Cron (Linux/Mac):**
```bash
# Edit crontab
crontab -e

# Tambahkan baris ini (jalan setiap hari jam 10:00)
0 10 * * * cd /path/to/DPKJ && node scripts/sendRatingReminders.mjs
```

## 📊 Struktur Database

### Collection: `e-umkm-ratings`
```typescript
{
  id: string,
  umkmId: string,
  userId: string,
  userName: string,
  rating: number,           // Rata-rata dari 4 aspek
  kualitasProduk: number,   // 1-5
  pelayanan: number,        // 1-5
  harga: number,            // 1-5
  kebersihan: number,       // 1-5
  ulasan: string,
  helpful: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `e-umkm-visits`
```typescript
{
  id: string,               // Format: userId_umkmId
  umkmId: string,
  umkmName: string,
  userId: string,
  visitedAt: Timestamp,
  notificationSent: boolean,
  notificationSentAt: Timestamp,
  rated: boolean,
  ratedAt: Timestamp
}
```

### Collection: `universal_notifications`
```typescript
{
  id: string,
  userId: string,
  type: 'e_umkm_rating',
  referenceId: string,      // umkmId
  title: string,
  message: string,
  status: 'unread' | 'read',
  priority: 'low',
  actionRequired: true,
  metadata: {
    umkmId: string,
    umkmName: string
  },
  createdAt: Timestamp,
  readAt: Timestamp
}
```

## 🔧 File yang Ditambahkan/Diubah

### File Baru:
1. `src/lib/ratingService.ts` - Service untuk rating & visit tracking
2. `scripts/sendRatingReminders.mjs` - Script untuk kirim notifikasi

### File Diubah:
1. `src/lib/notificationService.ts` - Tambah type `e_umkm_rating`
2. `src/app/masyarakat/e-umkm/detail/page.tsx` - Tambah form rating & tracking
3. `src/app/masyarakat/notifikasi/page.tsx` - Handle notifikasi rating

## 🎯 Flow Sistem

```
1. User mengunjungi halaman detail UMKM
   ↓
2. Sistem merekam kunjungan (userId, umkmId, timestamp)
   ↓
3. Setelah 1-2 hari, script cron job berjalan
   ↓
4. Script cek visits yang belum dinotifikasi dan belum dirating
   ↓
5. Kirim notifikasi reminder ke user
   ↓
6. User klik notifikasi → redirect ke halaman detail UMKM
   ↓
7. User klik tombol "Beri Rating & Ulasan"
   ↓
8. User isi form rating & submit
   ↓
9. Rating tersimpan & rata-rata UMKM ter-update
   ↓
10. Visit ditandai sudah dirating (tidak akan dinotifikasi lagi)
```

## 📈 Monitoring

Untuk melihat log script reminder:
```powershell
# Jalankan manual dan lihat output
node scripts/sendRatingReminders.mjs

# Output contoh:
# 🔍 Checking for visits needing rating reminders...
# 📊 Found 5 visits needing reminders
# ✅ Reminder sent to user abc123 for Warung Makan Sari
# ✅ Reminder sent to user def456 for Toko Kue Bu Ani
# ...
# 📈 Summary:
#    ✅ Success: 5
#    ❌ Errors: 0
#    📊 Total: 5
```

## 💡 Tips

1. **Frekuensi Reminder**: Script sebaiknya dijalankan 1x sehari (pagi hari)
2. **Interval Reminder**: Default 1-2 hari setelah kunjungan (bisa disesuaikan)
3. **Testing**: Untuk testing, bisa ubah interval menjadi beberapa menit di `ratingService.ts`
4. **Cleanup**: Visits yang sudah rated tidak perlu dihapus (untuk tracking history)

## 🐛 Troubleshooting

**Notifikasi tidak terkirim?**
- Pastikan script berjalan dengan cron/task scheduler
- Cek Firebase credentials di environment variables
- Cek console log untuk error

**User tidak bisa rating?**
- Pastikan user sudah login
- Cek apakah user pernah mengunjungi halaman detail UMKM
- Cek Firebase permissions

**Rating tidak muncul?**
- Refresh halaman detail UMKM
- Cek console browser untuk error
- Pastikan data tersimpan di Firestore

## 📞 Support

Jika ada pertanyaan atau issue, silakan hubungi developer.

---

**Update Log:**
- 2026-01-08: Initial implementation of rating system with automated reminders
