// Import firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

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

// Sample masyarakat data
const getSampleMasyarakatData = () => {
  return [
    {
      nama: "John Doe",
      email: "john@example.com",
      nik: "5103012001990001",
      noTelepon: "08123456789",
      alamat: "Jl. Raya No. 123",
      tempatLahir: "Denpasar",
      tanggalLahir: "1990-01-15",
      jenisKelamin: "Laki-laki",
      agama: "Hindu",
      pekerjaan: "Pegawai Swasta",
      kecamatan: "Denpasar Utara",
      desa: "Dauh Puri Kaja",
      rt: "001",
      rw: "002"
    },
    {
      nama: "Jane Smith", 
      email: "jane@example.com",
      nik: "5103012001950002",
      noTelepon: "08234567890",
      alamat: "Jl. Melati No. 456",
      tempatLahir: "Denpasar",
      tanggalLahir: "1995-03-20",
      jenisKelamin: "Perempuan",
      agama: "Hindu",
      pekerjaan: "Guru",
      kecamatan: "Denpasar Utara",
      desa: "Dauh Puri Tengah", 
      rt: "003",
      rw: "004"
    }
  ];
};

async function checkMasyarakatData() {
  try {
    console.log("🔍 Checking existing masyarakat data...");
    const masyarakatCollection = collection(db, "masyarakat");
    const snapshot = await getDocs(masyarakatCollection);
    
    if (!snapshot.empty) {
      console.log(`✅ Found ${snapshot.size} existing masyarakat records:`);
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.nama} (${data.email}) - ID: ${doc.id}`);
      });
      return;
    }
    
    console.log("📝 No masyarakat data found. Adding sample masyarakat data...");
    const sampleData = getSampleMasyarakatData();
    
    for (const masyarakat of sampleData) {
      try {
        const docRef = await addDoc(collection(db, "masyarakat"), {
          ...masyarakat,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        console.log(`✅ Added masyarakat: ${masyarakat.nama} (${masyarakat.email}) - ID: ${docRef.id}`);
      } catch (error) {
        console.error(`❌ Error adding ${masyarakat.nama}:`, error);
      }
    }
    
    console.log("🎉 Successfully initialized masyarakat data!");
    
    // Verify the data was added
    console.log("\n🔍 Verifying added data...");
    const verifySnapshot = await getDocs(collection(db, "masyarakat"));
    console.log(`✅ Total masyarakat records: ${verifySnapshot.size}`);
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.nama} (${data.email}) from ${data.desa}`);
    });
    
  } catch (error) {
    console.error("❌ Error checking masyarakat data:", error);
  }
}

// Run the check
checkMasyarakatData();