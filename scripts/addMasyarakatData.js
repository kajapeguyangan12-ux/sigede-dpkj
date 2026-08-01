const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'sigede-dpkj'
  });
}

const db = admin.firestore();

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
        tanggalLahir: admin.firestore.Timestamp.fromDate(new Date('1985-01-01')),
        tempatLahir: 'Denpasar',
        pekerjaan: 'Pegawai Swasta',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        nama: 'Ni Kadek Sari Dewi',
        email: 'sari.dewi@gmail.com',
        nik: '5107014502900001',
        alamat: 'Br. Dauh Puri Kaja, Denpasar Utara',
        noTelp: '08198765432',
        jenisKelamin: 'Perempuan',
        tanggalLahir: admin.firestore.Timestamp.fromDate(new Date('1990-02-15')),
        tempatLahir: 'Singaraja',
        pekerjaan: 'Guru',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        nama: 'I Ketut Budi Santoso',
        email: 'budi.santoso@gmail.com',
        nik: '5107011203880001',
        alamat: 'Jl. Raya Dauh Puri No. 15',
        noTelp: '08567891234',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: admin.firestore.Timestamp.fromDate(new Date('1988-03-12')),
        tempatLahir: 'Denpasar',
        pekerjaan: 'Wiraswasta',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        nama: 'Ni Made Ayu Lestari',
        email: 'ayu.lestari@gmail.com',
        nik: '5107016708920001',
        alamat: 'Br. Dauh Puri Kelod, Denpasar Utara',
        noTelp: '08234567890',
        jenisKelamin: 'Perempuan',
        tanggalLahir: admin.firestore.Timestamp.fromDate(new Date('1992-08-27')),
        tempatLahir: 'Tabanan',
        pekerjaan: 'Mahasiswa',
        agama: 'Hindu',
        statusPerkawinan: 'Belum Menikah',
        role: 'warga_luar_dpkj',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        nama: 'I Gede Agus Wijaya',
        email: 'agus.wijaya@gmail.com',
        nik: '5107012309870001',
        alamat: 'Br. Dauh Puri Kangin, Denpasar Utara',
        noTelp: '08345678901',
        jenisKelamin: 'Laki-laki',
        tanggalLahir: admin.firestore.Timestamp.fromDate(new Date('1987-09-23')),
        tempatLahir: 'Gianyar',
        pekerjaan: 'TNI',
        agama: 'Hindu',
        statusPerkawinan: 'Menikah',
        role: 'warga_dpkj',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const batch = db.batch();
    
    masyarakatData.forEach((data) => {
      const docRef = db.collection('masyarakat').doc();
      batch.set(docRef, data);
    });

    await batch.commit();
    console.log('✅ Successfully added masyarakat data!');
    console.log(`📊 Added ${masyarakatData.length} records to masyarakat collection`);

  } catch (error) {
    console.error('❌ Error adding masyarakat data:', error);
  }
}

// Run the function
addMasyarakatData().then(() => {
  console.log('🎉 Script completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});