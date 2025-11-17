// Import firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDpepucywG2zDXQGU5WNMNOvwD_bAGBglE",
  authDomain: "desa-dauhpurikaja.firebaseapp.com",
  projectId: "desa-dauhpurikaja",
  storageBucket: "desa-dauhpurikaja.firebasestorage.app",
  messagingSenderId: "268566437810",
  appId: "1:268566437810:web:67c6e706a9e3dd4efab03d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default desa data
const getDefaultDesaData = () => {
  return [
    {
      nama: "Dauh Puri Kaja",
      kode: "5103012001",
      kecamatan: "Denpasar Utara",
      kabupaten: "Denpasar",
      provinsi: "Bali",
      jumlahPenduduk: 12500,
      jumlahKK: 3200,
      luasWilayah: 2.5,
    },
    {
      nama: "Dauh Puri Tengah",
      kode: "5103012002",
      kecamatan: "Denpasar Utara", 
      kabupaten: "Denpasar",
      provinsi: "Bali",
      jumlahPenduduk: 8900,
      jumlahKK: 2400,
      luasWilayah: 1.8,
    },
    {
      nama: "Dauh Puri Kangin",
      kode: "5103012003",
      kecamatan: "Denpasar Utara",
      kabupaten: "Denpasar", 
      provinsi: "Bali",
      jumlahPenduduk: 7600,
      jumlahKK: 2100,
      luasWilayah: 1.3,
    }
  ];
};

async function initializeDesaData() {
  try {
    console.log("🔍 Checking existing desa data...");
    const desaCollection = collection(db, "desa");
    const snapshot = await getDocs(desaCollection);
    
    if (!snapshot.empty) {
      console.log(`✅ Found ${snapshot.size} existing desa records:`);
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.nama} (ID: ${doc.id})`);
      });
      return;
    }
    
    console.log("📝 No desa data found. Adding default desa data...");
    const defaultData = getDefaultDesaData();
    
    for (const desa of defaultData) {
      try {
        const docRef = await addDoc(collection(db, "desa"), {
          ...desa,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log(`✅ Added desa: ${desa.nama} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`❌ Error adding ${desa.nama}:`, error);
      }
    }
    
    console.log("🎉 Successfully initialized desa data!");
    
    // Verify the data was added
    console.log("\n🔍 Verifying added data...");
    const verifySnapshot = await getDocs(collection(db, "desa"));
    console.log(`✅ Total desa records: ${verifySnapshot.size}`);
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.nama} (${data.kecamatan}, ${data.kabupaten})`);
    });
    
  } catch (error) {
    console.error("❌ Error initializing desa data:", error);
  }
}

// Run the initialization
initializeDesaData();