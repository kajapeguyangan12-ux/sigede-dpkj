# Template Upload Data Warga - Panduan Singkat

## 📥 Download Template
Klik tombol **"Template"** untuk download file CSV template.

## 📋 Field Wajib (HARUS diisi)
- **noKK**: Nomor Kartu Keluarga (16 digit)
- **nik**: NIK (16 digit)  
- **namaLengkap**: Nama lengkap sesuai KTP

## 📝 Format Penting

### Tanggal Lahir
✅ Benar: `1964-05-25` (YYYY-MM-DD)  
❌ Salah: `25/05/1964` atau `25-05-1964`

### Daerah/Banjar
Gunakan underscore (_), contoh:
- `WANGAYA_KAJA`
- `WANGAYA_TENGAH`
- `DAUH_PURI`

### Jenis Kelamin
- `Laki-laki` atau `Perempuan`

### Status Nikah
- `Belum Kawin`, `Kawin`, `Cerai Hidup`, `Cerai Mati`

### Agama
- `Hindu`, `Islam`, `Kristen`, `Katolik`, `Buddha`, `Konghucu`

### Penghasilan
- `<1000000`
- `1000000-2000000`
- `2000000-3000000`
- `3000000-5000000`
- `5000000-10000000`
- `>10000000`

## 🔧 Mode Upload

### Tambah Baru
- Upload data baru pertama kali
- Cepat (~2-3 menit untuk 18rb data)
- NIK duplikat otomatis di-skip

### Update Data
- Update data yang sudah ada
- Insert data baru otomatis
- Lebih lambat tapi lebih aman (~6-8 menit untuk 18rb data)

## ⚠️ Tips Cepat
1. Pastikan 3 field wajib terisi semua
2. Format tanggal YYYY-MM-DD
3. Daerah pakai underscore
4. Simpan sebagai .csv atau .xlsx
5. Jangan tutup browser saat upload

## 📖 Dokumentasi Lengkap
Lihat file `PANDUAN_UPLOAD_DATA_WARGA.md` di root project untuk detail lengkap.