import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Desa {
  id: string;
  nama: string;
  kode: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  jumlahPenduduk?: number;
  jumlahKK?: number;
  luasWilayah?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DesaInput extends Omit<Desa, "id" | "createdAt" | "updatedAt"> {}

const COLLECTION_NAME = "desa";

// Helper function to convert Firestore document to Desa object
const convertDocumentToDesa = (doc: QueryDocumentSnapshot<DocumentData>): Desa => {
  const data = doc.data();
  return {
    id: doc.id,
    nama: data.nama || "",
    kode: data.kode || "",
    kecamatan: data.kecamatan || "",
    kabupaten: data.kabupaten || "",
    provinsi: data.provinsi || "",
    jumlahPenduduk: data.jumlahPenduduk,
    jumlahKK: data.jumlahKK,
    luasWilayah: data.luasWilayah,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Validate desa input data
const validateDesaInput = (data: DesaInput): void => {
  if (!data.nama?.trim()) {
    throw new Error("Nama desa wajib diisi");
  }
  if (!data.kode?.trim()) {
    throw new Error("Kode desa wajib diisi");
  }
  if (!data.kecamatan?.trim()) {
    throw new Error("Kecamatan wajib diisi");
  }
  if (!data.kabupaten?.trim()) {
    throw new Error("Kabupaten wajib diisi");
  }
  if (!data.provinsi?.trim()) {
    throw new Error("Provinsi wajib diisi");
  }
};

// Get all desa data
export const getAllDesa = async (): Promise<Desa[]> => {
  try {
    const desaCollection = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(desaCollection);
    
    return snapshot.docs.map(convertDocumentToDesa);
  } catch (error) {
    console.error("Error getting desa data:", error);
    throw new Error(`Gagal mengambil data desa: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get single desa by ID
export const getDesaById = async (id: string): Promise<Desa | null> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID desa wajib diisi");
    }

    const desaRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(desaRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      id: snapshot.id,
      nama: data.nama || "",
      kode: data.kode || "",
      kecamatan: data.kecamatan || "",
      kabupaten: data.kabupaten || "",
      provinsi: data.provinsi || "",
      jumlahPenduduk: data.jumlahPenduduk,
      jumlahKK: data.jumlahKK,
      luasWilayah: data.luasWilayah,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error getting desa by ID:", error);
    throw new Error(`Gagal mengambil data desa: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Add new desa
export const addDesa = async (data: DesaInput): Promise<string> => {
  try {
    validateDesaInput(data);

    const desaData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), desaData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding desa:", error);
    throw new Error(`Gagal menambah data desa: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update desa
export const updateDesa = async (id: string, data: Partial<DesaInput>): Promise<void> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID desa wajib diisi");
    }

    // Validate only the fields that are being updated
    if (data.nama !== undefined && !data.nama?.trim()) {
      throw new Error("Nama desa tidak boleh kosong");
    }
    if (data.kode !== undefined && !data.kode?.trim()) {
      throw new Error("Kode desa tidak boleh kosong");
    }
    if (data.kecamatan !== undefined && !data.kecamatan?.trim()) {
      throw new Error("Kecamatan tidak boleh kosong");
    }
    if (data.kabupaten !== undefined && !data.kabupaten?.trim()) {
      throw new Error("Kabupaten tidak boleh kosong");
    }
    if (data.provinsi !== undefined && !data.provinsi?.trim()) {
      throw new Error("Provinsi tidak boleh kosong");
    }

    const desaRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(desaRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating desa:", error);
    throw new Error(`Gagal memperbarui data desa: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete desa
export const deleteDesa = async (id: string): Promise<void> => {
  try {
    if (!id?.trim()) {
      throw new Error("ID desa wajib diisi");
    }

    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting desa:", error);
    throw new Error(`Gagal menghapus data desa: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get default/initial desa data - untuk fallback
export const getDefaultDesaData = (): Desa[] => {
  return [
    {
      id: "dpkj",
      nama: "Dauh Puri Kaja",
      kode: "5103012001",
      kecamatan: "Denpasar Utara",
      kabupaten: "Denpasar",
      provinsi: "Bali",
      jumlahPenduduk: 12500,
      jumlahKK: 3200,
      luasWilayah: 2.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "dpt",
      nama: "Dauh Puri Tengah",
      kode: "5103012002",
      kecamatan: "Denpasar Utara", 
      kabupaten: "Denpasar",
      provinsi: "Bali",
      jumlahPenduduk: 8900,
      jumlahKK: 2400,
      luasWilayah: 1.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "dpk",
      nama: "Dauh Puri Kangin",
      kode: "5103012003",
      kecamatan: "Denpasar Utara",
      kabupaten: "Denpasar", 
      provinsi: "Bali",
      jumlahPenduduk: 7600,
      jumlahKK: 2100,
      luasWilayah: 1.3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
};