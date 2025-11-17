import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/lib/firebase.js';

async function addWargaLuarDPKJData() {
  try {
    console.log('🎯 Adding sample Warga Luar DPKJ data...');

    const wargaLuarData = [
      {
        nama: 'I Made Surya Pratama',
        email: 'surya.pratama@gmail.com',
        nik: '5171031205880001',
        alamat: 'Jl. Gatot Subroto No. 25, Denpasar Selatan',
        noTelp: '08123456789',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1988-05-12')),
        tempatLahir: 'Denpasar',
        pekerjaan: 'Pengusaha',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        alamatAsal: 'Tabanan, Bali'
      },
      {
        nama: 'Ni Putu Sari Maharani',
        email: 'sari.maharani@gmail.com',
        nik: '5171074503920001',
        alamat: 'Jl. Teuku Umar No. 78, Denpasar Barat',
        noTelp: '08198765432',
        jenisKelamin: 'Perempuan',
        tanggalLahir: Timestamp.fromDate(new Date('1992-03-05')),
        tempatLahir: 'Singaraja',
        pekerjaan: 'Dokter',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        alamatAsal: 'Buleleng, Bali'
      },
      {
        nama: 'I Komang Adi Wijaya',
        email: 'adi.wijaya@gmail.com',
        nik: '5171011808850001',
        alamat: 'Jl. Sunset Road No. 15, Kuta, Badung',
        noTelp: '08567891234',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1985-08-18')),
        tempatLahir: 'Gianyar',
        pekerjaan: 'Guide Wisata',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        alamatAsal: 'Gianyar, Bali'
      },
      {
        nama: 'Ni Luh Kadek Dewi Sartika',
        email: 'dewi.sartika@gmail.com',
        nik: '5171062209940001',
        alamat: 'Jl. Hayam Wuruk No. 45, Denpasar Timur',
        noTelp: '08234567890',
        jenisKelamin: 'Perempuan',
        tanggalLahir: Timestamp.fromDate(new Date('1994-09-22')),
        tempatLahir: 'Klungkung',
        pekerjaan: 'Mahasiswa S2',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        alamatAsal: 'Klungkung, Bali'
      },
      {
        nama: 'I Gede Bayu Mahendra',
        email: 'bayu.mahendra@gmail.com',
        nik: '5171031107900001',
        alamat: 'Jl. Diponegoro No. 88, Denpasar Utara',
        noTelp: '08345678901',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1990-07-11')),
        tempatLahir: 'Badung',
        pekerjaan: 'Software Developer',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        alamatAsal: 'Badung, Bali'
      }
    ];

    const wargaLuarCollection = collection(db, 'Warga_LuarDPKJ');
    
    for (const data of wargaLuarData) {
      const docRef = await addDoc(wargaLuarCollection, data);
      console.log(`✅ Added document with ID: ${docRef.id}`);
    }

    console.log('✅ Successfully added all Warga Luar DPKJ data!');
    console.log(`📊 Added ${wargaLuarData.length} records to Warga_LuarDPKJ collection`);

  } catch (error) {
    console.error('❌ Error adding Warga Luar DPKJ data:', error);
  }
}

// Run the function
addWargaLuarDPKJData().then(() => {
  console.log('🎉 Script completed!');
}).catch(error => {
  console.error('💥 Script failed:', error);
});