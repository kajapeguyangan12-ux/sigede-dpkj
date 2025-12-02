import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface MasyarakatData {
  id: string;
  nama: string;
  email: string;
  nik?: string;
  noKK?: string;
  noTelepon?: string;
  alamat?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  kewarganegaraan?: string;
  kecamatan?: string;
  desa?: string;
  rt?: string;
  rw?: string;
  userName?: string;
  userType?: 'masyarakat' | 'warga_luar_dpkj'; // To differentiate user types
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Get masyarakat data by email (search in both collections)
export const getMasyarakatByEmail = async (email: string): Promise<MasyarakatData | null> => {
  try {
    console.log('🔍 MASYARAKAT SERVICE: Fetching data for email:', email);
    
    // First, try masyarakat collection (warga DPKJ)
    const masyarakatRef = collection(db, 'masyarakat');
    const masyarakatQuery = query(masyarakatRef, where('email', '==', email));
    const masyarakatSnapshot = await getDocs(masyarakatQuery);
    
    if (!masyarakatSnapshot.empty) {
      console.log('✅ Found user in masyarakat collection');
      const doc = masyarakatSnapshot.docs[0];
      const data = doc.data();
      console.log('📋 Raw data from Firestore:', data);
      
      const result: MasyarakatData = {
        id: doc.id,
        nama: data.displayName || data.nama || '',
        email: data.email || '',
        nik: data.idNumber || data.nik || undefined,
        noKK: data.noKK || undefined,
        noTelepon: data.phoneNumber || data.noTelp || data.noTelepon || undefined,
        alamat: data.alamat || data.address || undefined,
        tempatLahir: data.tempatLahir || undefined,
        tanggalLahir: data.tanggalLahir || undefined,
        jenisKelamin: data.jenisKelamin || undefined,
        agama: data.agama || undefined,
        pekerjaan: data.pekerjaan || undefined,
        statusPerkawinan: data.statusPerkawinan || undefined,
        kewarganegaraan: data.kewarganegaraan || undefined,
        kecamatan: data.kecamatan || undefined,
        desa: data.desa || undefined,
        rt: data.rt || undefined,
        rw: data.rw || undefined,
        userName: data.userName || undefined,
        userType: 'masyarakat',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      console.log('📦 Processed result:', result);
      return result;
    }
    
    // If not found in masyarakat, try Warga_LuarDPKJ collection
    console.log('🔍 Checking Warga_LuarDPKJ collection...');
    const wargaLuarRef = collection(db, 'Warga_LuarDPKJ');
    const wargaLuarQuery = query(wargaLuarRef, where('email', '==', email));
    const wargaLuarSnapshot = await getDocs(wargaLuarQuery);
    
    if (!wargaLuarSnapshot.empty) {
      console.log('✅ Found user in Warga_LuarDPKJ collection');
      const doc = wargaLuarSnapshot.docs[0];
      const data = doc.data();
      console.log('📋 Raw data from Firestore:', data);
      
      const result: MasyarakatData = {
        id: doc.id,
        nama: data.displayName || data.nama || data.userName || '',
        email: data.email || '',
        nik: data.idNumber || data.nik || undefined,
        noTelepon: data.phoneNumber || data.noTelp || data.noTelepon || undefined,
        userName: data.userName || undefined,
        userType: 'warga_luar_dpkj',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      console.log('📦 Processed result:', result);
      return result;
    }
    
    console.log('❌ No user found with email:', email);
    return null;
  } catch (error) {
    console.error('💥 Error fetching masyarakat data:', error);
    throw error;
  }
};

// Get masyarakat data by ID
export const getMasyarakatById = async (id: string): Promise<MasyarakatData | null> => {
  try {
    const docRef = doc(db, 'masyarakat', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nama: data.nama || '',
      email: data.email || '',
      nik: data.nik || '',
      noTelepon: data.noTelepon || '',
      alamat: data.alamat || '',
      tempatLahir: data.tempatLahir || '',
      tanggalLahir: data.tanggalLahir || '',
      jenisKelamin: data.jenisKelamin || '',
      agama: data.agama || '',
      pekerjaan: data.pekerjaan || '',
      kecamatan: data.kecamatan || '',
      desa: data.desa || '',
      rt: data.rt || '',
      rw: data.rw || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.error('Error fetching masyarakat by ID:', error);
    throw error;
  }
};

// Get masyarakat data by NIK
export const getMasyarakatByNIK = async (nik: string): Promise<MasyarakatData | null> => {
  try {
    const q = query(collection(db, 'masyarakat'), where('nik', '==', nik));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nama: data.nama || '',
      email: data.email || '',
      nik: data.nik || '',
      noTelepon: data.noTelepon || '',
      alamat: data.alamat || '',
      tempatLahir: data.tempatLahir || '',
      tanggalLahir: data.tanggalLahir || '',
      jenisKelamin: data.jenisKelamin || '',
      agama: data.agama || '',
      pekerjaan: data.pekerjaan || '',
      kecamatan: data.kecamatan || '',
      desa: data.desa || '',
      rt: data.rt || '',
      rw: data.rw || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.error('Error fetching masyarakat by NIK:', error);
    throw error;
  }
};

// Update masyarakat data
export const updateMasyarakatData = async (id: string, data: Partial<MasyarakatData>): Promise<void> => {
  try {
    const docRef = doc(db, 'masyarakat', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating masyarakat data:', error);
    throw error;
  }
};