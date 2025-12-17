# Verifikasi Form Data Desa

## ✅ Status: LENGKAP & SIAP UPLOAD KE FIRESTORE

### Field Form yang Tersedia (19 Field)

#### 1. Identitas Keluarga
- ✅ **noKK** - Nomor Kartu Keluarga (16 digit, required)
- ✅ **shdk** - Status Hubungan Dalam Keluarga (Kepala/Istri/Anak)

#### 2. Identitas Pribadi
- ✅ **namaLengkap** - Nama Lengkap (required)
- ✅ **nik** - NIK (16 digit, required)
- ✅ **jenisKelamin** - Jenis Kelamin (Laki-laki/Perempuan)
- ✅ **statusNikah** - Status Pernikahan (Belum Kawin/Kawin/Cerai)

#### 3. Tempat & Tanggal Lahir
- ✅ **tempatLahir** - Tempat Lahir (Kota/Kabupaten)
- ✅ **tanggalLahir** - Tanggal Lahir (Format: DD/MM/YYYY)

#### 4. Pekerjaan & Ekonomi
- ✅ **pekerjaan** - Pekerjaan saat ini
- ✅ **penghasilan** - Range Penghasilan (< Rp 500.000 hingga > Rp 5.000.000)
- ✅ **desil** - Desil Ekonomi (1-10)
- ✅ **pendidikan** - Pendidikan Terakhir (SD-S3)
- ✅ **pendidikanTerakhir** - Backup field untuk pendidikan

#### 5. Alamat & Lokasi
- ✅ **alamat** - Alamat Lengkap (Jalan, RT/RW, Dusun)
- ✅ **daerah** - Nama Daerah/Dusun

#### 6. Data Lainnya
- ✅ **agama** - Agama (Islam/Kristen/Katolik/Hindu/Buddha/Konghucu)
- ✅ **sukuBangsa** - Suku Bangsa (Jawa/Sunda/Batak, dll)
- ✅ **kewarganegaraan** - Kewarganegaraan (WNI/WNA)
- ✅ **golonganDarah** - Golongan Darah (A/B/AB/O/Tidak Tahu)

### Validasi yang Diterapkan

1. ✅ **Field Wajib (Required)**:
   - noKK
   - namaLengkap
   - nik

2. ✅ **Validasi Tanggal Lahir**:
   - Format DD/MM/YYYY
   - Tanggal harus valid (tidak boleh 31/02/2024)
   - Tahun antara 1900 - tahun sekarang
   - Auto-format dengan slash (/)

3. ✅ **Validasi Input**:
   - NIK: 16 digit numeric
   - No KK: 16 digit numeric
   - inputMode="numeric" untuk input angka (mobile optimization)

### Firestore Upload Process

#### File: `src/lib/dataDesaService.ts`

```typescript
export const addDataDesa = async (data: any) => {
  try {
    // Validasi field wajib
    if (!data.noKK || !data.nik || !data.namaLengkap) {
      throw new Error('Field wajib tidak lengkap');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,  // Semua 19 field akan dikirim
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
}
```

#### Collection: `data-desa`

Semua 19 field akan tersimpan di Firestore collection "data-desa" dengan struktur:

```javascript
{
  // Identitas Keluarga
  noKK: "1234567890123456",
  shdk: "Kepala Keluarga",
  
  // Identitas Pribadi
  namaLengkap: "John Doe",
  nik: "1234567890123456",
  jenisKelamin: "Laki-laki",
  statusNikah: "Kawin",
  
  // Tempat & Tanggal Lahir
  tempatLahir: "Jakarta",
  tanggalLahir: "15/08/1990",
  
  // Pekerjaan & Ekonomi
  pekerjaan: "Pegawai Swasta",
  penghasilan: "Rp 2.000.000 - Rp 5.000.000",
  desil: "5",
  pendidikan: "D4/S1",
  pendidikanTerakhir: "D4/S1",
  
  // Alamat & Lokasi
  alamat: "Jl. Merdeka No. 123, RT 001/RW 002",
  daerah: "Dusun Mekar",
  
  // Data Lainnya
  agama: "Islam",
  sukuBangsa: "Jawa",
  kewarganegaraan: "WNI",
  golonganDarah: "A",
  
  // Metadata (otomatis ditambahkan)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Testing Checklist

- ✅ Form UI lengkap dengan 6 section profesional
- ✅ Semua 19 field tersedia di formData state
- ✅ handleSubmit mengirim formData lengkap ke Firestore
- ✅ Validasi field wajib (noKK, nik, namaLengkap)
- ✅ Validasi format tanggal lahir (DD/MM/YYYY)
- ✅ Error handling untuk Firestore operations
- ✅ Loading state saat menyimpan data
- ✅ Success/error alert setelah upload
- ✅ Form reset setelah berhasil menyimpan
- ✅ Mobile-optimized (iOS & Android)

### Cara Menggunakan

1. **Buka halaman**: http://localhost:3001/admin/data-desa
2. **Klik tombol** "Tambah Data Warga" (ikon Plus)
3. **Isi form** dengan data lengkap (minimal field wajib: No KK, Nama, NIK)
4. **Klik** "Simpan Data"
5. **Verifikasi** di Firestore Console → Collection: data-desa

### Status: ✅ SIAP DIGUNAKAN

Form sudah lengkap dengan semua field sesuai screenshot dan siap untuk mengupload data ke Firestore database collection "data-desa".

---

**Last Updated**: December 17, 2025
**Status**: Production Ready ✅
