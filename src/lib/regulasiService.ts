import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from './firebase';

export interface RegulasiDesa {
  id: string;
  judul: string;
  nomor: string;
  tahun: string;
  tentang: string;
  deskripsi: string;
  isiLengkap: string;
  tanggalDitetapkan: string;
  status: 'aktif' | 'tidak_aktif';
  kategori: 'perdes' | 'peraturan_bersama' | 'keputusan_kepala_desa' | 'lainnya';
  filePdf?: string;
  totalPerkel?: number;
  totalPerdes?: number;
  berlaku?: boolean;
  tidakBerlaku?: boolean;
  diagramUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RegulasiStats {
  totalPerkel: number;
  totalPerdes: number;
  berlaku: number;
  tidakBerlaku: number;
}

const COLLECTION_NAME = 'regulasi-desa';

// Get all regulasi
export async function getRegulasiDesa(): Promise<RegulasiDesa[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegulasiDesa[];
  } catch (error) {
    console.error('Error getting regulasi:', error);
    throw error;
  }
}

// Subscribe to regulasi updates
export function subscribeToRegulasiDesa(
  callback: (data: RegulasiDesa[]) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RegulasiDesa[];
      callback(data);
    },
    (error) => {
      console.error('Error in regulasi subscription:', error);
    }
  );

  return unsubscribe;
}

// Add new regulasi
export async function addRegulasiDesa(
  data: Omit<RegulasiDesa, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding regulasi:', error);
    throw error;
  }
}

// Update regulasi
export async function updateRegulasiDesa(
  id: string,
  data: Partial<Omit<RegulasiDesa, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating regulasi:', error);
    throw error;
  }
}

// Delete regulasi
export async function deleteRegulasiDesa(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Get the document first to check if there's a file to delete
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as RegulasiDesa;
      
      // Delete file if exists
      if (data.filePdf) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, data.filePdf);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Delete diagram if exists
      if (data.diagramUrl) {
        try {
          const storage = getStorage();
          const diagramRef = ref(storage, data.diagramUrl);
          await deleteObject(diagramRef);
        } catch (error) {
          console.error('Error deleting diagram:', error);
        }
      }
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting regulasi:', error);
    throw error;
  }
}

// Upload file PDF
export async function uploadPdfToStorage(file: File, fileName: string): Promise<string> {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `regulasi/${fileName}.pdf`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

// Upload diagram image
export async function uploadDiagramToStorage(file: File, fileName: string): Promise<string> {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `regulasi/diagrams/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading diagram:', error);
    throw error;
  }
}

// Get regulasi statistics
export async function getRegulasiStats(): Promise<RegulasiStats> {
  try {
    const regulasiList = await getRegulasiDesa();
    
    const stats: RegulasiStats = {
      totalPerkel: 0,
      totalPerdes: 0,
      berlaku: 0,
      tidakBerlaku: 0,
    };

    regulasiList.forEach((regulasi) => {
      if (regulasi.kategori === 'perdes') {
        stats.totalPerdes++;
      }
      
      if (regulasi.status === 'aktif') {
        stats.berlaku++;
      } else {
        stats.tidakBerlaku++;
      }
    });

    // Calculate Perkel (other categories)
    stats.totalPerkel = regulasiList.length - stats.totalPerdes;

    return stats;
  } catch (error) {
    console.error('Error getting regulasi stats:', error);
    throw error;
  }
}
