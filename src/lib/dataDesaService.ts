import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where
} from "firebase/firestore";
import { db } from "./firebase";

export interface DataDesaItem {
  id?: string;
  noKK: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  daerah?: string;
  statusNikah?: string;
  agama?: string;
  sukuBangsa?: string;
  kewarganegaraan?: string;
  pendidikanTerakhir?: string;
  pekerjaan?: string;
  penghasilan?: string;
  golonganDarah?: string;
  shdk?: string;
  desil?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  [key: string]: any; // Untuk mendukung field dinamis
}

const COLLECTION_NAME = "data-desa";

// Add new data desa item
export const addDataDesa = async (data: any) => {
  try {
    // Validasi field wajib
    if (!data.noKK || !data.nik || !data.namaLengkap) {
      throw new Error('Field wajib tidak lengkap: noKK, nik, atau namaLengkap');
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Find existing data by NIK
export const findDataDesaByNIK = async (nik: string): Promise<DataDesaItem | null> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("nik", "==", nik));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DataDesaItem;
  } catch (error) {
    console.error("Error finding data desa by NIK:", error);
    throw error;
  }
};

// Add or update data desa item (upsert operation) - Optimized
export const upsertDataDesa = async (data: any) => {
  try {
    // Validasi field wajib
    if (!data.noKK || !data.nik || !data.namaLengkap) {
      throw new Error('Field wajib tidak lengkap: noKK, nik, atau namaLengkap');
    }

    // Check if data already exists by NIK
    const existingData = await findDataDesaByNIK(data.nik);
    
    if (existingData) {
      // Update existing data - merge fields
      const mergedData = {
        ...data,
        updatedAt: Timestamp.now(),
      };
      
      const docRef = doc(db, COLLECTION_NAME, existingData.id!);
      await updateDoc(docRef, mergedData);
      return { id: existingData.id, isUpdate: true };
    } else {
      // Add new data
      const newId = await addDataDesa(data);
      return { id: newId, isUpdate: false };
    }
  } catch (error) {
    console.error("Error upserting data desa:", error);
    throw error;
  }
};

// Update data desa item
export const updateDataDesa = async (id: string, data: Partial<Omit<DataDesaItem, "id" | "createdAt" | "updatedAt">>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating data desa:", error);
    throw error;
  }
};

// Delete data desa item
export const deleteDataDesa = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting data desa:", error);
    throw error;
  }
};

// Get all data desa items
export const getDataDesa = async (): Promise<DataDesaItem[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DataDesaItem));
  } catch (error) {
    console.error("Error fetching data desa:", error);
    throw error;
  }
};

// Subscribe to data desa changes
export const subscribeToDataDesa = (callback: (data: DataDesaItem[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (querySnapshot) => {
    const data: DataDesaItem[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() } as DataDesaItem);
    });
    callback(data);
  });
};

// Search data desa by name or NIK
export const searchDataDesa = async (searchTerm: string): Promise<DataDesaItem[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("namaLengkap", ">=", searchTerm),
      where("namaLengkap", "<=", searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DataDesaItem));
  } catch (error) {
    console.error("Error searching data desa:", error);
    throw error;
  }
};