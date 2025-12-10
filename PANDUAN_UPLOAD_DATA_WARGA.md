# 📋 Panduan Upload Data Warga

## 🎯 Tujuan
Dokumen ini menjelaskan cara menggunakan template Excel untuk upload data warga ke sistem DPKJ.

## 📥 Download Template
Template tersedia di: `/public/templates/template-data-warga.csv`

Atau akses melalui: `http://localhost:3000/templates/template-data-warga.csv`

## 📝 Struktur Data Template

### Field Wajib (Required)
Field ini **HARUS** diisi, sistem akan error jika kosong:

| Field | Keterangan | Contoh |
|-------|-----------|---------|
| `noKK` | Nomor Kartu Keluarga (16 digit) | 5171042505640001 |
| `nik` | NIK (16 digit) | 5171042505640001 |
| `namaLengkap` | Nama lengkap sesuai KTP | I PUTU YUDA |

### Field Opsional (Optional)
Field ini boleh kosong, tapi disarankan diisi lengkap:

| Field | Keterangan | Format/Pilihan |
|-------|-----------|----------------|
| `jenisKelamin` | Jenis kelamin | `Laki-laki` atau `Perempuan` |
| `tempatLahir` | Tempat lahir | Denpasar |
| `tanggalLahir` | Tanggal lahir | `YYYY-MM-DD` (contoh: 1964-05-25) |
| `alamat` | Alamat lengkap | JL.KARTINI GG.XXV NO.3 |
| `daerah` | Daerah/Banjar | Lihat daftar daerah di bawah |
| `statusNikah` | Status pernikahan | `Belum Kawin`, `Kawin`, `Cerai Hidup`, `Cerai Mati` |
| `agama` | Agama | `Hindu`, `Islam`, `Kristen`, `Katolik`, `Buddha`, `Konghucu` |
| `sukuBangsa` | Suku bangsa | Bali, Jawa, dll |
| `kewarganegaraan` | Kewarganegaraan | `WNI` atau `WNA` |
| `pendidikanTerakhir` | Pendidikan terakhir | `SD`, `SMP`, `SMA`, `D3`, `S1`, `S2`, `S3` |
| `pekerjaan` | Pekerjaan | PNS, Polri, Wiraswasta, Karyawan Swasta, dll |
| `penghasilan` | Rentang penghasilan | Lihat rentang penghasilan di bawah |
| `golonganDarah` | Golongan darah | `A`, `B`, `AB`, `O` |
| `shdk` | Status Hubungan Dalam Keluarga | Lihat daftar SHDK di bawah |
| `desil` | Desil kesejahteraan (1-10) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |

## 📚 Daftar Pilihan Valid

### Daerah/Banjar
Gunakan format dengan underscore (_):
- `WANGAYA_KAJA`
- `WANGAYA_TENGAH`
- `WANGAYA_KALER`
- `WANGAYA_KELOD`
- `WANGAYA_KANGIN`
- `WANGAYA_KAUH`
- `DAUH_PURI`
- `DAUH_PURI_KAJA`
- `DAUH_PURI_KELOD`
- `DAUH_PURI_KANGIN`
- `DAUH_PURI_KAUH`

### Rentang Penghasilan
- `<1000000` (Kurang dari 1 juta)
- `1000000-2000000` (1-2 juta)
- `2000000-3000000` (2-3 juta)
- `3000000-5000000` (3-5 juta)
- `5000000-10000000` (5-10 juta)
- `>10000000` (Lebih dari 10 juta)

### Status Hubungan Dalam Keluarga (SHDK)
- `Kepala Keluarga`
- `Istri`
- `Anak`
- `Menantu`
- `Cucu`
- `Orang Tua`
- `Mertua`
- `Famili Lain`
- `Pembantu`
- `Lainnya`

## 🔧 Mode Upload

### 1. **Tambah Baru (Batch 400 + Auto Retry)**
- ✅ **Super Cepat**: Insert langsung tanpa pengecekan
- ✅ **Auto Retry**: 3x percobaan otomatis jika gagal
- ✅ **Progress Log**: Tracking detail per batch
- ⚠️ **Skip Duplikat**: NIK duplikat otomatis dilewati
- 📊 **Estimasi**: ~2-3 menit untuk 18,000 data

**Kapan digunakan:**
- Upload data baru pertama kali
- Data sudah pasti bersih (tidak ada duplikat)
- Butuh kecepatan maksimal

### 2. **Update Data (Batch 300 + Smart Sync)**
- 🔍 **Cek NIK**: Bandingkan dengan data existing
- 🔄 **Update Otomatis**: Hanya update yang berubah
- ⭐ **Insert Baru**: NIK baru otomatis ditambahkan
- 🚫 **Skip Sama**: Data identik dilewati
- 📊 **Estimasi**: ~6-8 menit untuk 18,000 data

**Kapan digunakan:**
- Data sudah ada, ingin update
- Campuran data baru dan lama
- Ingin menghindari duplikasi

## 📖 Cara Penggunaan

### Langkah 1: Persiapan File Excel

1. **Download template** dari sistem
2. **Buka dengan Microsoft Excel** atau Google Sheets
3. **Hapus baris contoh** (baris 2-6), sisakan header
4. **Copy-paste** atau **ketik manual** data warga

### Langkah 2: Format Data

#### ✅ Format BENAR:

```csv
noKK,nik,namaLengkap,jenisKelamin,tempatLahir,tanggalLahir,...
5171042505640001,5171042505640001,I PUTU YUDA,Laki-laki,Denpasar,1964-05-25,...
```

#### ❌ Format SALAH:

```csv
# Tanggal format salah (harus YYYY-MM-DD)
5171042505640001,5171042505640001,I PUTU YUDA,Laki-laki,Denpasar,25/05/1964,...

# Daerah format salah (harus gunakan underscore)
5171042505640001,5171042505640001,I PUTU YUDA,Laki-laki,Denpasar,1964-05-25,JL.KARTINI,Wangaya Kaja,...

# Field wajib kosong
,,I PUTU YUDA,...
```

### Langkah 3: Validasi Data

Sebelum upload, pastikan:
- ✅ NIK 16 digit dan unik
- ✅ No KK 16 digit
- ✅ Tanggal format `YYYY-MM-DD`
- ✅ Daerah pakai underscore (contoh: `WANGAYA_KAJA`)
- ✅ Tidak ada karakter aneh (emoji, simbol khusus)
- ✅ Encoding file UTF-8

### Langkah 4: Upload ke Sistem

1. Login ke **Admin Dashboard**
2. Masuk ke menu **Data Desa**
3. Klik tombol **Upload Excel** (ikon cloud)
4. **Pilih mode upload**:
   - Pilih "Tambah Baru" untuk data baru
   - Pilih "Update Data" untuk update/sync
5. **Pilih file** Excel/CSV
6. Klik **Preview** untuk melihat data
7. Periksa data di preview
8. Klik **Upload** untuk memulai
9. Tunggu proses selesai (jangan tutup halaman!)

### Langkah 5: Monitoring Upload

Sistem akan menampilkan:
- 🔵 **Progress bar**: Persentase selesai
- 📊 **Batch info**: Batch ke-X dari total Y
- ⏱️ **Estimasi waktu**: Sisa waktu upload
- ✅ **Sukses**: Jumlah data berhasil
- ❌ **Gagal**: Jumlah data gagal
- 📝 **Log detail**: Detail per batch

## ⚠️ Troubleshooting

### Error: "Field wajib tidak lengkap"
**Penyebab:** NIK, No KK, atau Nama Lengkap kosong
**Solusi:** Pastikan 3 field wajib terisi di semua baris

### Error: "Format tanggal salah"
**Penyebab:** Tanggal bukan format `YYYY-MM-DD`
**Solusi:** Ubah format tanggal menjadi `1964-05-25` (tidak `25/05/1964`)

### Error: "NIK duplikat"
**Penyebab:** NIK sudah ada di database
**Solusi:** 
- Mode "Tambah Baru": Data akan di-skip otomatis
- Mode "Update Data": Data akan di-update otomatis

### Upload terhenti di tengah jalan
**Penyebab:** Koneksi internet terputus
**Solusi:** 
- Refresh halaman
- Upload ulang (data yang sudah masuk akan di-skip)

### File tidak bisa di-upload
**Penyebab:** Format file tidak didukung
**Solusi:** Pastikan file berformat `.xlsx`, `.xls`, atau `.csv`

## 💡 Tips & Best Practices

### 1. **Persiapan Data**
- ✅ Bersihkan data duplikat di Excel dulu
- ✅ Gunakan Excel formula untuk format tanggal
- ✅ Validasi NIK dengan formula (harus 16 digit)
- ✅ Backup data sebelum upload

### 2. **Saat Upload**
- ✅ Upload di jam sepi (malam/dini hari)
- ✅ Jangan tutup browser saat upload
- ✅ Gunakan koneksi internet stabil
- ✅ Upload maksimal 20,000 data per batch

### 3. **Setelah Upload**
- ✅ Cek jumlah data di dashboard
- ✅ Verifikasi beberapa data random
- ✅ Simpan log upload untuk audit
- ✅ Backup database secara berkala

## 📊 Performance Benchmark

| Jumlah Data | Mode Tambah Baru | Mode Update |
|-------------|------------------|-------------|
| 1,000 data | ~10 detik | ~30 detik |
| 5,000 data | ~40 detik | ~2 menit |
| 10,000 data | ~1.5 menit | ~4 menit |
| 18,000 data | ~2-3 menit | ~6-8 menit |

*Benchmark di atas menggunakan koneksi internet 10 Mbps

## 🔒 Keamanan Data

- 🔐 Upload hanya bisa dilakukan oleh **Admin** yang login
- 📝 Semua aktivitas upload ter-log di sistem
- 🔄 Data di-validasi sebelum masuk database
- 💾 Database otomatis backup setiap hari
- 🚫 Field sensitif ter-enkripsi

## 📞 Bantuan

Jika mengalami kendala:
1. Cek dokumentasi ini dulu
2. Lihat log error di console browser (F12)
3. Screenshot error dan kirim ke admin IT
4. Hubungi support: support@dpkj.go.id

## 📜 Changelog

### v1.0.0 (9 Desember 2025)
- ✅ Template awal dengan 18 field
- ✅ Dua mode upload (Tambah Baru & Update)
- ✅ Auto retry dan progress tracking
- ✅ Validasi field wajib

---

**Dibuat oleh:** Tim IT DPKJ  
**Terakhir diupdate:** 9 Desember 2025  
**Versi:** 1.0.0