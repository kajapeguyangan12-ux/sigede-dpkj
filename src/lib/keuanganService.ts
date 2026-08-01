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
} from "firebase/firestore";
import { db } from "./firebase";

export interface KeuanganData {
  id: string;
  judul: string;
  tanggal: string;
  keterangan: string;
  jenis: "pemasukan" | "pengeluaran";
  jumlah: number;
  kategori: "gaji" | "bantuan" | "infrastruktur" | "operasional" | "lainnya";
  bukti?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APBData {
  id?: string;
  category: string; // pendapatan, belanja, pembiayaan
  subCategories: {
    id: string;
    label: string;
    anggaran: number;
    realisasi: number;
  }[];
  totalAnggaran: number;
  totalRealisasi: number;
  tahun: number;
  tanggalDibuat: Date;
  tanggalDiperbarui?: Date;
}

export interface DetailedAPBData {
  id?: string;
  kategori: 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN';
  subKategori: string;
  kodeRekening: string;
  uraian: string;
  tahun: number;
  anggaran: number;
  realisasi: number;
  keterangan?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeuanganStats {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  totalTransaksi: number;
}

// Get all keuangan data from Firestore
export const getKeuangan = async (): Promise<KeuanganData[]> => {
  try {
    const q = query(collection(db, "keuangan"), orderBy("tanggal", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as KeuanganData[];
  } catch (error) {
    console.error("Error getting keuangan data:", error);
    return [];
  }
};

// Real-time subscription to keuangan data
export const subscribeToKeuangan = (callback: (data: KeuanganData[]) => void): (() => void) => {
  const q = query(collection(db, "keuangan"), orderBy("tanggal", "desc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as KeuanganData[];
    
    callback(data);
  });

  return unsubscribe;
};

// Add new keuangan entry
export const addKeuangan = async (data: Omit<KeuanganData, "id" | "createdAt" | "updatedAt">): Promise<void> => {
  try {
    await addDoc(collection(db, "keuangan"), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding keuangan:", error);
    throw error;
  }
};

// Update keuangan entry
export const updateKeuangan = async (id: string, data: Partial<KeuanganData>): Promise<void> => {
  try {
    const keuanganRef = doc(db, "keuangan", id);
    await updateDoc(keuanganRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating keuangan:", error);
    throw error;
  }
};

// Delete keuangan entry
export const deleteKeuangan = async (id: string): Promise<void> => {
  try {
    const keuanganRef = doc(db, "keuangan", id);
    await deleteDoc(keuanganRef);
  } catch (error) {
    console.error("Error deleting keuangan:", error);
    throw error;
  }
};

// Get statistics
export const getKeuanganStats = async (): Promise<KeuanganStats> => {
  try {
    const data = await getKeuangan();
    
    const totalPemasukan = data
      .filter((item) => item.jenis === "pemasukan")
      .reduce((sum, item) => sum + item.jumlah, 0);
    
    const totalPengeluaran = data
      .filter((item) => item.jenis === "pengeluaran")
      .reduce((sum, item) => sum + item.jumlah, 0);
    
    const saldo = totalPemasukan - totalPengeluaran;
    const totalTransaksi = data.length;

    return {
      totalPemasukan,
      totalPengeluaran,
      saldo,
      totalTransaksi,
    };
  } catch (error) {
    console.error("Error getting keuangan stats:", error);
    return {
      totalPemasukan: 0,
      totalPengeluaran: 0,
      saldo: 0,
      totalTransaksi: 0,
    };
  }
};

// ===== APB FUNCTIONS =====

// Get all APB data from Firestore (legacy collection)
export const getAPB = async (): Promise<any[]> => {
  try {
    const q = query(collection(db, "apb"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error("Error getting APB data:", error);
    return [];
  }
};

// Real-time subscription to APB data (legacy collection)
export const subscribeToAPB = (callback: (data: any[]) => void): (() => void) => {
  const q = query(collection(db, "apb"), orderBy("createdAt", "desc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
    
    callback(data);
  });

  return unsubscribe;
};

// Add new APB entry
export const addAPB = async (data: Omit<APBData, "id" | "createdAt" | "updatedAt">): Promise<void> => {
  try {
    await addDoc(collection(db, "apb"), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error adding APB:", error);
    throw error;
  }
};

// Update APB entry
export const updateAPB = async (id: string, data: Partial<APBData>): Promise<void> => {
  try {
    const apbRef = doc(db, "apb", id);
    await updateDoc(apbRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating APB:", error);
    throw error;
  }
};

// Delete APB entry
export const deleteAPB = async (id: string): Promise<void> => {
  try {
    const apbRef = doc(db, "apb", id);
    await deleteDoc(apbRef);
  } catch (error) {
    console.error("Error deleting APB:", error);
    throw error;
  }
};

// ===== NEW APB FUNCTIONS FOR DETAILED STRUCTURE =====

// Add new detailed APB data
export const addDetailedAPB = async (data: Omit<DetailedAPBData, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "keuangan"), {
      ...data,
      tanggalDibuat: Timestamp.fromDate(new Date()),
      tanggalDiperbarui: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding detailed APB data: ", error);
    throw error;
  }
};

// Get all detailed APB data
export const getDetailedAPB = async (): Promise<DetailedAPBData[]> => {
  try {
    const q = query(collection(db, "keuangan"), orderBy("tanggalDibuat", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        kategori: data.kategori || 'PENDAPATAN',
        subKategori: data.subKategori || '',
        kodeRekening: data.kodeRekening || '',
        uraian: data.uraian || '',
        tahun: data.tahun || new Date().getFullYear(),
        anggaran: data.anggaran || 0,
        realisasi: data.realisasi || 0,
        keterangan: data.keterangan || '',
        createdAt: data.tanggalDibuat?.toDate() || new Date(),
        updatedAt: data.tanggalDiperbarui?.toDate() || new Date(),
      } as DetailedAPBData;
    });
  } catch (error) {
    console.error('Error getting detailed APB data:', error);
    throw new Error('Gagal mengambil data APB');
  }
};

// Get APB data by year
export const getAPBDataByYear = async (tahun: number): Promise<DetailedAPBData[]> => {
  try {
    const allData = await getDetailedAPB();
    return allData.filter(item => item.tahun === tahun);
  } catch (error) {
    console.error('Error getting APB data by year:', error);
    throw new Error('Gagal mengambil data APB berdasarkan tahun');
  }
};

// Get APB summary by year
export const getAPBSummaryByYear = async (tahun: number) => {
  try {
    const data = await getAPBDataByYear(tahun);
    
    const summary = {
      PENDAPATAN: { anggaran: 0, realisasi: 0 },
      BELANJA: { anggaran: 0, realisasi: 0 },
      PEMBIAYAAN: { anggaran: 0, realisasi: 0 },
      total: { anggaran: 0, realisasi: 0 }
    };
    
    data.forEach(item => {
      const kategori = item.kategori.toUpperCase() as keyof typeof summary;
      if (summary[kategori] && kategori !== 'total') {
        summary[kategori].anggaran += item.anggaran;
        summary[kategori].realisasi += item.realisasi;
        summary.total.anggaran += item.anggaran;
        summary.total.realisasi += item.realisasi;
      }
    });
    
    return summary;
  } catch (error) {
    console.error('Error getting APB summary:', error);
    throw new Error('Gagal mengambil ringkasan APB');
  }
};

// Subscribe to detailed APB data
export const subscribeToDetailedAPB = (callback: (data: DetailedAPBData[]) => void) => {
  const q = query(collection(db, "keuangan"), orderBy("tanggalDibuat", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return {
        id: doc.id,
        kategori: docData.kategori || 'PENDAPATAN',
        subKategori: docData.subKategori || '',
        kodeRekening: docData.kodeRekening || '',
        uraian: docData.uraian || '',
        tahun: docData.tahun || new Date().getFullYear(),
        anggaran: docData.anggaran || 0,
        realisasi: docData.realisasi || 0,
        keterangan: docData.keterangan || '',
        createdAt: docData.tanggalDibuat?.toDate() || new Date(),
        updatedAt: docData.tanggalDiperbarui?.toDate() || new Date(),
      } as DetailedAPBData;
    });
    callback(data);
  });
};

// Update detailed APB data
export const updateDetailedAPB = async (id: string, data: Partial<DetailedAPBData>) => {
  try {
    const docRef = doc(db, "keuangan", id);
    await updateDoc(docRef, {
      ...data,
      tanggalDiperbarui: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error updating detailed APB data: ", error);
    throw error;
  }
};



// Delete detailed APB data
export const deleteDetailedAPB = async (id: string) => {
  try {
    const docRef = doc(db, "keuangan", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting detailed APB data: ", error);
    throw error;
  }
};
