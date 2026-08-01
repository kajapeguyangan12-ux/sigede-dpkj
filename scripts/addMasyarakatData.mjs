import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/lib/firebase.js';

async function addMasyarakatData() {
  try {
    console.log('🎯 Adding sample masyarakat data...');

    const masyarakatData = [
      {
        nama: 'I Wayan Sukarta',
        email: 'sukarta@gmail.com',
        nik: '5107010101850001',
        alamat: 'Br. Dauh Puri Kaja, Denpasar Utara',
        noTelp: '08123456789',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1985-01-01')),
        tempatLahir: 'Denpasar',
        pekerjaan: 'Pegawai Swasta',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        nama: 'Ni Kadek Sari Dewi',
        email: 'sari.dewi@gmail.com',
        nik: '5107014502900001',
        alamat: 'Br. Dauh Puri Kaja, Denpasar Utara',
        noTelp: '08198765432',
        jenisKelamin: 'Perempuan',
        tanggalLahir: Timestamp.fromDate(new Date('1990-02-15')),
        tempatLahir: 'Singaraja',
        pekerjaan: 'Guru',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        nama: 'I Ketut Budi Santoso',
        email: 'budi.santoso@gmail.com',
        nik: '5107011203880001',
        alamat: 'Jl. Raya Dauh Puri No. 15',
        noTelp: '08567891234',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1988-03-12')),
        tempatLahir: 'Denpasar',
        pekerjaan: 'Wiraswasta',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        nama: 'Ni Made Ayu Lestari',
        email: 'ayu.lestari@gmail.com',
        nik: '5107016708920001',
        alamat: 'Br. Dauh Puri Kelod, Denpasar Utara',
        noTelp: '08234567890',
        jenisKelamin: 'Perempuan',
        tanggalLahir: Timestamp.fromDate(new Date('1992-08-27')),
        tempatLahir: 'Tabanan',
        pekerjaan: 'Mahasiswa',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        nama: 'I Gede Agus Wijaya',
        email: 'agus.wijaya@gmail.com',
        nik: '5107012309870001',
        alamat: 'Br. Dauh Puri Kangin, Denpasar Utara',
        noTelp: '08345678901',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: Timestamp.fromDate(new Date('1987-09-23')),
        tempatLahir: 'Gianyar',
        pekerjaan: 'TNI',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    const masyarakatCollection = collection(db, 'masyarakat');
    
    for (const data of masyarakatData) {
      const docRef = await addDoc(masyarakatCollection, data);
      console.log(`✅ Added document with ID: ${docRef.id}`);
    }

    console.log('✅ Successfully added all masyarakat data!');
    console.log(`📊 Added ${masyarakatData.length} records to masyarakat collection`);

  } catch (error) {
    console.error('❌ Error adding masyarakat data:', error);
  }
}

// Run the function
addMasyarakatData().then(() => {
  console.log('🎉 Script completed!');
}).catch(error => {
  console.error('💥 Script failed:', error);
});