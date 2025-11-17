// Script untuk menambahkan data user berdasarkan email yang login
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpepucywG2zDXQGU5WNMNOvwD_bAGBglE",
  authDomain: "desa-dauhpurikaja.firebaseapp.com",
  projectId: "desa-dauhpurikaja",
  storageBucket: "desa-dauhpurikaja.firebasestorage.app",
  messagingSenderId: "268566437810",
  appId: "1:268566437810:web:67c6e706a9e3dd4efab03d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addUserData() {
  try {
    const email = "kadek39@gmail.com"; // Email user yang login
    
    console.log(`🔍 Checking if user exists with email: ${email}`);
    
    // Cek di collection masyarakat
    const masyarakatQuery = query(collection(db, "masyarakat"), where("email", "==", email));
    const masyarakatSnapshot = await getDocs(masyarakatQuery);
    
    if (!masyarakatSnapshot.empty) {
      console.log("✅ User already exists in masyarakat collection:");
      masyarakatSnapshot.forEach(doc => {
        console.log("   Data:", doc.data());
      });
      return;
    }
    
    // Cek di collection Warga_LuarDPKJ
    const wargaLuarQuery = query(collection(db, "Warga_LuarDPKJ"), where("email", "==", email));
    const wargaLuarSnapshot = await getDocs(wargaLuarQuery);
    
    if (!wargaLuarSnapshot.empty) {
      console.log("✅ User already exists in Warga_LuarDPKJ collection:");
      wargaLuarSnapshot.forEach(doc => {
        console.log("   Data:", doc.data());
      });
      return;
    }
    
    // Jika tidak ada, tambahkan data baru
    console.log("📝 User not found, adding new data to masyarakat collection...");
    
    const userData = {
      nama: "Kadek Surya Pratama",
      email: email,
      nik: "5103012001990001",
      noTelepon: "08123456789",
      alamat: "Jl. Raya Dauh Puri No. 123",
      tempatLahir: "Denpasar",
      tanggalLahir: "1990-05-15",
      jenisKelamin: "Laki-laki",
      agama: "Hindu",
      pekerjaan: "Pegawai Swasta",
      kecamatan: "Denpasar Utara",
      desa: "Dauh Puri Kaja",
      rt: "001",
      rw: "002",
      userName: "kadeksurya",
      role: "warga",
      status: "active",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, "masyarakat"), userData);
    console.log("✅ User data added successfully with ID:", docRef.id);
    console.log("🎉 User can now see their profile data!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addUserData();
