import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkPengaduanData() {
  try {
    console.log('🔍 Checking laporan-pengaduan collection data...\n');
    
    const querySnapshot = await getDocs(collection(db, 'laporan-pengaduan'));
    
    if (querySnapshot.empty) {
      console.log('❌ No documents found in laporan-pengaduan collection');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} documents in laporan-pengaduan collection\n`);
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Document ${index + 1} (ID: ${doc.id}):`);
      console.log(`   Judul: ${data.judul || 'N/A'}`);
      console.log(`   Kategori: ${data.kategori || 'N/A'}`);
      console.log(`   Username: ${data.userName || 'N/A'}`);
      console.log(`   UserId: ${data.userId || 'N/A'}`);
      console.log(`   Nama Lengkap: ${data.namaLengkap || 'NOT SET'}`);
      console.log(`   NIK: ${data.nik || 'NOT SET'}`);
      console.log(`   Alamat: ${data.alamat || 'NOT SET'}`);
      console.log(`   No Telepon: ${data.noTelepon || 'NOT SET'}`);
      console.log(`   Email: ${data.email || 'NOT SET'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   Created At: ${data.createdAt?.toDate?.() || data.createdAt || 'N/A'}`);
      console.log('   ---');
    });
    
    // Summary
    let hasReporterInfo = 0;
    let missingReporterInfo = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.namaLengkap || data.nik || data.alamat || data.noTelepon || data.email) {
        hasReporterInfo++;
      } else {
        missingReporterInfo++;
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`   ✅ Documents with reporter info: ${hasReporterInfo}`);
    console.log(`   ❌ Documents missing reporter info: ${missingReporterInfo}`);
    
  } catch (error) {
    console.error('❌ Error checking pengaduan data:', error);
  }
}

checkPengaduanData();