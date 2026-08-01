import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_LAPORAN = 'laporan-masyarakat';
const COLLECTION_NOTIFIKASI_LAPORAN = 'notifikasi-laporan';

export interface LaporanMasyarakat {
  id?: string;
  judulLaporan: string;
  kategoriLaporan: string;
  isiLaporan: string;
  namaLengkap: string;
  nik: string;
  alamat: string;
  noTelepon: string;
  email?: string;
  fotoLaporan?: string[];
  status: 'menunggu' | 'diproses' | 'disetujui' | 'ditolak' | 'selesai';
  alasanTolak?: string;
  catatanAdmin?: string;
  tanggalLaporan: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedBy?: string;
  processedAt?: Timestamp;
  userId: string;
}

export interface NotifikasiLaporan {
  id?: string;
  userId: string;
  laporanId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'menunggu' | 'diproses' | 'disetujui' | 'ditolak' | 'selesai';
  isRead: boolean;
  createdAt: Timestamp;
}

// Add new laporan
export const addLaporan = async (laporanData: Omit<LaporanMasyarakat, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_LAPORAN), {
      ...laporanData,
      status: 'menunggu',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create notification for admin (optional)
    await addDoc(collection(db, COLLECTION_NOTIFIKASI_LAPORAN), {
      userId: 'admin', // or specific admin user
      laporanId: docRef.id,
      title: 'Laporan Baru',
      message: `Laporan baru "${laporanData.judulLaporan}" dari ${laporanData.namaLengkap}`,
      type: 'info',
      status: 'menunggu',
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding laporan:", error);
    throw error;
  }
};

// Get all laporan (untuk admin)
export const getAllLaporan = async (): Promise<LaporanMasyarakat[]> => {
  try {
    // Try optimized query with composite index first
    try {
      const q = query(
        collection(db, COLLECTION_LAPORAN), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaporanMasyarakat[];
    } catch (indexError) {
      console.warn("Using simple query for laporan:", indexError);
      
      // Fallback to simple query
      const querySnapshot = await getDocs(collection(db, COLLECTION_LAPORAN));
      
      const laporanData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaporanMasyarakat[];
      
      // Sort manually
      return laporanData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting all laporan:", error);
    return [];
  }
};

// Get laporan by user (untuk masyarakat)
export const getLaporanByUser = async (userId: string): Promise<LaporanMasyarakat[]> => {
  try {
    // Try optimized query with composite index first
    try {
      const q = query(
        collection(db, COLLECTION_LAPORAN), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaporanMasyarakat[];
    } catch (indexError) {
      console.warn("Composite index not available for laporan by user, falling back to simple query:", indexError);
      
      // Fallback to simple query
      const q = query(
        collection(db, COLLECTION_LAPORAN), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      const laporanData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaporanMasyarakat[];
      
      // Sort manually
      return laporanData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting laporan by user:", error);
    return [];
  }
};

// Get single laporan by ID
export const getLaporanById = async (id: string): Promise<LaporanMasyarakat | null> => {
  try {
    const docRef = doc(db, COLLECTION_LAPORAN, id);
    const docSnap = await getDocs(query(collection(db, COLLECTION_LAPORAN), where("__name__", "==", id)));
    
    if (!docSnap.empty) {
      const doc = docSnap.docs[0];
      return { id: doc.id, ...doc.data() } as LaporanMasyarakat;
    }
    return null;
  } catch (error) {
    console.error("Error getting laporan by ID:", error);
    return null;
  }
};

// Update laporan status (untuk admin)
export const updateStatusLaporan = async (id: string, status: LaporanMasyarakat['status'], adminNotes?: string, processedBy?: string) => {
  try {
    const docRef = doc(db, COLLECTION_LAPORAN, id);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (adminNotes) {
      if (status === 'ditolak') {
        updateData.alasanTolak = adminNotes;
      } else {
        updateData.catatanAdmin = adminNotes;
      }
    }

    if (processedBy) {
      updateData.processedBy = processedBy;
      updateData.processedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);

    // Get laporan data for notification
    const laporanSnap = await getDocs(query(collection(db, COLLECTION_LAPORAN), where("__name__", "==", id)));
    
    if (!laporanSnap.empty) {
      const laporan = laporanSnap.docs[0].data() as LaporanMasyarakat;
      
      // Create notification for user
      let notifTitle = '';
      let notifMessage = '';
      let notifType: NotifikasiLaporan['type'] = 'info';

      switch (status) {
        case 'diproses':
          notifTitle = 'Laporan Sedang Diproses';
          notifMessage = `Laporan "${laporan.judulLaporan}" sedang ditinjau oleh admin`;
          notifType = 'info';
          break;
        case 'disetujui':
          notifTitle = 'Laporan Disetujui';
          notifMessage = `Laporan "${laporan.judulLaporan}" telah disetujui`;
          notifType = 'success';
          break;
        case 'ditolak':
          notifTitle = 'Laporan Ditolak';
          notifMessage = `Laporan "${laporan.judulLaporan}" ditolak. ${adminNotes || ''}`;
          notifType = 'error';
          break;
        case 'selesai':
          notifTitle = 'Laporan Selesai';
          notifMessage = `Laporan "${laporan.judulLaporan}" telah selesai ditangani`;
          notifType = 'success';
          break;
      }

      if (notifTitle) {
        await addDoc(collection(db, COLLECTION_NOTIFIKASI_LAPORAN), {
          userId: laporan.userId,
          laporanId: id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          status: status,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating laporan status:", error);
    throw error;
  }
};

// Delete laporan
export const deleteLaporan = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_LAPORAN, id));
    return true;
  } catch (error) {
    console.error("Error deleting laporan:", error);
    throw error;
  }
};

// Get notifikasi laporan by user
export const getNotifikasiLaporanByUser = async (userId: string): Promise<NotifikasiLaporan[]> => {
  try {
    // Try optimized query first
    try {
      const q = query(
        collection(db, COLLECTION_NOTIFIKASI_LAPORAN), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLaporan[];
    } catch (indexError) {
      console.warn("Composite index not available for notifikasi laporan, falling back to simple query:", indexError);
      
      // Fallback to simple query
      const q = query(
        collection(db, COLLECTION_NOTIFIKASI_LAPORAN), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      const notifikasiData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLaporan[];
      
      // Sort manually
      return notifikasiData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting notifikasi laporan:", error);
    return [];
  }
};

// Mark notifikasi as read
export const markNotifikasiLaporanAsRead = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NOTIFIKASI_LAPORAN, id);
    await updateDoc(docRef, {
      isRead: true
    });
    return true;
  } catch (error) {
    console.error("Error marking notifikasi laporan as read:", error);
    throw error;
  }
};

// Subscribe to laporan real-time (untuk admin)
export const subscribeToLaporan = (callback: (laporan: LaporanMasyarakat[]) => void) => {
  const q = query(collection(db, COLLECTION_LAPORAN), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const laporan = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LaporanMasyarakat[];
    
    callback(laporan);
  }, (error) => {
    console.error("Error in laporan subscription:", error);
    // Fallback to simple query
    const fallbackQ = query(collection(db, COLLECTION_LAPORAN));
    
    return onSnapshot(fallbackQ, (snapshot) => {
      const laporan = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaporanMasyarakat[];
      
      // Sort manually
      const sortedLaporan = laporan.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
      
      callback(sortedLaporan);
    });
  });
};

// Subscribe to notifikasi laporan real-time (untuk masyarakat)
export const subscribeToNotifikasiLaporan = (userId: string, callback: (notifikasi: NotifikasiLaporan[]) => void) => {
  // Try with composite index first, fallback to simple query if needed
  let q;
  
  try {
    // Primary query with composite index
    q = query(
      collection(db, COLLECTION_NOTIFIKASI_LAPORAN), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
  } catch (indexError) {
    console.warn("Using simple query for notifikasi laporan subscription:", indexError);
    // Fallback to simple query
    q = query(
      collection(db, COLLECTION_NOTIFIKASI_LAPORAN), 
      where("userId", "==", userId)
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    let notifikasi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NotifikasiLaporan[];
    
    // Sort manually if we used the simple query
    if (!q.toString().includes('orderBy')) {
      notifikasi = notifikasi.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
    
    callback(notifikasi);
  }, (error) => {
    console.error("Error in notifikasi laporan subscription:", error);
    // If the subscription fails, try with simple query
    const fallbackQ = query(
      collection(db, COLLECTION_NOTIFIKASI_LAPORAN), 
      where("userId", "==", userId)
    );
    
    return onSnapshot(fallbackQ, (snapshot) => {
      const notifikasi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLaporan[];
      
      // Sort manually
      const sortedNotifikasi = notifikasi.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
      
      callback(sortedNotifikasi);
    });
  });
};

// Alias untuk getUserReports (untuk riwayat)
export const getUserReports = async (userId: string) => {
  return await getLaporanByUser(userId);
};

// Update laporan status dengan format baru (untuk admin panel)
export const updateLaporanStatus = async (
  id: string, 
  updateData: {
    status: LaporanMasyarakat['status'];
    catatanAdmin?: string;
    alasanTolak?: string;
  }
) => {
  try {
    const docRef = doc(db, COLLECTION_LAPORAN, id);
    const data: any = {
      status: updateData.status,
      updatedAt: serverTimestamp(),
    };

    if (updateData.catatanAdmin) {
      data.catatanAdmin = updateData.catatanAdmin;
    }

    if (updateData.alasanTolak) {
      data.alasanTolak = updateData.alasanTolak;
    }

    await updateDoc(docRef, data);

    // Get laporan data for notification
    const laporanSnap = await getDocs(query(collection(db, COLLECTION_LAPORAN), where("__name__", "==", id)));
    
    if (!laporanSnap.empty) {
      const laporan = laporanSnap.docs[0].data() as LaporanMasyarakat;
      
      // Create notification for user
      let notifTitle = '';
      let notifMessage = '';
      let notifType: NotifikasiLaporan['type'] = 'info';

      switch (updateData.status) {
        case 'diproses':
          notifTitle = 'Laporan Sedang Diproses';
          notifMessage = `Laporan "${laporan.judulLaporan}" sedang ditinjau oleh admin`;
          notifType = 'info';
          break;
        case 'disetujui':
          notifTitle = 'Laporan Disetujui';
          notifMessage = `Laporan "${laporan.judulLaporan}" telah disetujui`;
          notifType = 'success';
          break;
        case 'ditolak':
          notifTitle = 'Laporan Ditolak';
          notifMessage = `Laporan "${laporan.judulLaporan}" ditolak. ${updateData.alasanTolak || ''}`;
          notifType = 'error';
          break;
        case 'selesai':
          notifTitle = 'Laporan Selesai';
          notifMessage = `Laporan "${laporan.judulLaporan}" telah selesai ditangani`;
          notifType = 'success';
          break;
      }

      if (notifTitle) {
        await addDoc(collection(db, COLLECTION_NOTIFIKASI_LAPORAN), {
          userId: laporan.userId,
          laporanId: id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          status: updateData.status,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating laporan status:", error);
    throw error;
  }
};

export default {
  addLaporan,
  getAllLaporan,
  getLaporanByUser,
  getUserReports,
  getLaporanById,
  updateStatusLaporan,
  deleteLaporan,
  getNotifikasiLaporanByUser,
  markNotifikasiLaporanAsRead,
  subscribeToLaporan,
  subscribeToNotifikasiLaporan,
};