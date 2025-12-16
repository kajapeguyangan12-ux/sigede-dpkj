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
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { createLayananNotification, generateLayananMessage } from './notificationService';

export interface LayananPublik {
  id?: string;
  jenisLayanan: string;
  judulSurat: string;
  namaLengkap: string;
  nik: string;
  noKK: string;
  alamat: string;
  daerah?: string; // Field untuk daerah/banjar
  noTelepon?: string;
  email?: string;
  keperluan?: string;
  tujuan?: string;
  tanggalPermohonan?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  agama?: string;
  pekerjaan?: string;
  kewarganegaraan?: string;
  statusPerkawinan?: string;
  namaAyah?: string;
  namaIbu?: string;
  namaPassangan?: string;
  tanggalKematian?: string;
  sebabKematian?: string;
  tempatKematian?: string;
  saksiSatu?: string;
  saksiDua?: string;
  dokumenPendukung?: string[];
  foto_kk_url?: string; // URL foto KK dari Firebase Storage
  foto_ktp_url?: string; // URL foto KTP dari Firebase Storage
  catatanTambahan?: string;
  status: 'pending_kadus' | 'approved_kadus' | 'approved_admin' | 'completed' | 'ditolak' | 'auto_approved';
  alasanTolak?: string;
  catatanAdmin?: string;
  catatanKadus?: string;
  catatanKades?: string;
  nomorSuratKadus?: string; // Nomor surat pengantar kepala dusun
  nomorSurat?: string; // Nomor surat dari admin desa
  downloadedByAdmin?: boolean; // Tracking apakah admin sudah download paket lengkap
  downloadedAt?: Timestamp; // Timestamp kapan admin download
  approvedByAdmin?: boolean;
  approvedByKadus?: boolean;
  approvedByKades?: boolean;
  adminApprovalDate?: Timestamp;
  approvedAdminAt?: Timestamp; // Timestamp untuk auto-approve checker
  kadusApprovalDate?: Timestamp;
  kadesApprovalDate?: Timestamp;
  autoApprovalDate?: Timestamp;
  autoApprovedAt?: Timestamp;
  autoApprovedReason?: string;
  estimasiSelesai?: Timestamp;
  buktiApproval?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedBy?: string;
  processedAt?: Timestamp;
  userId: string;
  savedBy?: string[]; // Array of user IDs who saved this layanan
}

export interface NotifikasiLayanan {
  id?: string;
  userId: string;
  layananId: string;
  jenisLayanan: string;
  judul: string;
  pesan: string;
  status: 'pending_kadus' | 'approved_kadus' | 'approved_admin' | 'completed' | 'ditolak' | 'auto_approved';
  isRead: boolean;
  createdAt: Timestamp;
}

const COLLECTION_LAYANAN = "layanan-publik";
const COLLECTION_NOTIFIKASI = "notifikasi-layanan";

// Tambah permohonan layanan baru
export const addLayananPublik = async (data: Omit<LayananPublik, "id" | "createdAt" | "updatedAt" | "status">) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_LAYANAN), {
      ...data,
      status: 'pending_kadus', // Status awal: menunggu approval kepala dusun
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create notification for initial submission
    const notificationData = generateLayananMessage('pending_kadus', data.jenisLayanan);
    
    await createLayananNotification({
      userId: data.userId,
      layananId: docRef.id,
      status: 'pending_kadus',
      title: notificationData.title,
      message: notificationData.message,
      jenisLayanan: data.jenisLayanan,
      priority: notificationData.priority
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding layanan publik:", error);
    throw error;
  }
};

// Update status layanan
export const updateStatusLayanan = async (
  id: string, 
  status: LayananPublik['status'], 
  adminData: { 
    processedBy?: string; 
    catatanAdmin?: string;
    catatanKadus?: string;
    catatanKades?: string; 
    alasanTolak?: string;
    approvedByAdmin?: boolean;
    approvedByKadus?: boolean;
    approvedByKades?: boolean;
    adminApprovalDate?: any;
    approvedAdminAt?: any; // Timestamp untuk auto-approve checker
    kadusApprovalDate?: any;
    kadesApprovalDate?: any;
    autoApprovalDate?: any;
    autoApprovedAt?: any;
    autoApprovedReason?: string;
    estimasiSelesai?: any;
    buktiApproval?: string;
    processedAt?: any;
  }
) => {
  try {
    const docRef = doc(db, COLLECTION_LAYANAN, id);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Add all provided fields
    Object.keys(adminData).forEach(key => {
      if (adminData[key as keyof typeof adminData] !== undefined) {
        updateData[key] = adminData[key as keyof typeof adminData];
      }
    });

    // Set processedBy if provided, otherwise keep existing
    if (adminData.processedBy) {
      updateData.processedBy = adminData.processedBy;
    }

    await updateDoc(docRef, updateData);

    // Get layanan data for notification
    const layananDoc = await getDoc(docRef);
    if (layananDoc.exists()) {
      const layananData = { id: layananDoc.id, ...layananDoc.data() } as LayananPublik;
      
      // Generate professional notification message
      const notificationData = generateLayananMessage(
        status, 
        layananData.jenisLayanan, 
        layananData.buktiApproval
      );
      
      // Create universal notification
      await createLayananNotification({
        userId: layananData.userId,
        layananId: id,
        status,
        title: notificationData.title,
        message: notificationData.message,
        jenisLayanan: layananData.jenisLayanan,
        buktiApproval: layananData.buktiApproval,
        estimasiSelesai: layananData.estimasiSelesai?.toDate?.()?.toLocaleDateString('id-ID') || undefined,
        alasanTolak: adminData.alasanTolak,
        priority: notificationData.priority
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating status layanan:", error);
    throw error;
  }
};

// Get semua layanan (untuk admin)
export const getAllLayananPublik = async (): Promise<LayananPublik[]> => {
  try {
    const q = query(collection(db, COLLECTION_LAYANAN), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LayananPublik[];
  } catch (error) {
    console.error("Error getting layanan publik:", error);
    throw error;
  }
};

// Get layanan by jenis untuk admin
export const getLayananByJenis = async (jenisLayanan: string): Promise<LayananPublik[]> => {
  try {
    // First try the optimized query with composite index
    try {
      const q = query(
        collection(db, COLLECTION_LAYANAN), 
        where("jenisLayanan", "==", jenisLayanan),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LayananPublik[];
    } catch (indexError) {
      console.warn("Composite index not available for layanan by jenis, falling back to simple query:", indexError);
      
      // Fallback: Use simple query without orderBy
      const q = query(
        collection(db, COLLECTION_LAYANAN), 
        where("jenisLayanan", "==", jenisLayanan)
      );
      const querySnapshot = await getDocs(q);
      
      const layananData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LayananPublik[];
      
      // Sort manually in JavaScript
      return layananData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting layanan by jenis:", error);
    return []; // Return empty array instead of throwing
  }
};

// Get layanan by user (untuk masyarakat)
export const getLayananByUser = async (userId: string): Promise<LayananPublik[]> => {
  try {
    // First try the optimized query with composite index
    try {
      const q = query(
        collection(db, COLLECTION_LAYANAN), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LayananPublik[];
    } catch (indexError) {
      console.warn("Composite index not available, falling back to simple query:", indexError);
      
      // Fallback: Use simple query without orderBy
      const q = query(
        collection(db, COLLECTION_LAYANAN), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      const layananData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LayananPublik[];
      
      // Sort manually in JavaScript
      return layananData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting layanan by user:", error);
    return []; // Return empty array instead of throwing
  }
};

// Get single layanan by ID
export const getLayananById = async (id: string): Promise<LayananPublik | null> => {
  try {
    const docRef = doc(db, COLLECTION_LAYANAN, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as LayananPublik;
    }
    return null;
  } catch (error) {
    console.error("Error getting layanan by ID:", error);
    throw error;
  }
};

// Tambah notifikasi
export const addNotifikasiLayanan = async (data: Omit<NotifikasiLayanan, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NOTIFIKASI), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding notifikasi:", error);
    throw error;
  }
};

// Get notifikasi by user
export const getNotifikasiByUser = async (userId: string): Promise<NotifikasiLayanan[]> => {
  try {
    // First try the optimized query with composite index
    try {
      const q = query(
        collection(db, COLLECTION_NOTIFIKASI), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLayanan[];
    } catch (indexError) {
      console.warn("Composite index not available for notifikasi, falling back to simple query:", indexError);
      
      // Fallback: Use simple query without orderBy
      const q = query(
        collection(db, COLLECTION_NOTIFIKASI), 
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      
      const notifikasiData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLayanan[];
      
      // Sort manually in JavaScript
      return notifikasiData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // desc order
      });
    }
  } catch (error) {
    console.error("Error getting notifikasi:", error);
    return []; // Return empty array instead of throwing
  }
};

// Mark notifikasi as read
export const markNotifikasiAsRead = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NOTIFIKASI, id);
    await updateDoc(docRef, {
      isRead: true
    });
    return true;
  } catch (error) {
    console.error("Error marking notifikasi as read:", error);
    throw error;
  }
};

// Subscribe to layanan real-time (untuk admin)
export const subscribeToLayanan = (callback: (layanan: LayananPublik[]) => void) => {
  const q = query(collection(db, COLLECTION_LAYANAN), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const layanan = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LayananPublik[];
    
    callback(layanan);
  });
};

// Subscribe to notifikasi real-time (untuk masyarakat)
export const subscribeToNotifikasi = (userId: string, callback: (notifikasi: NotifikasiLayanan[]) => void) => {
  // Try with composite index first, fallback to simple query if needed
  let q;
  
  try {
    // Primary query with composite index
    q = query(
      collection(db, COLLECTION_NOTIFIKASI), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
  } catch (indexError) {
    console.warn("Using simple query for notifikasi subscription:", indexError);
    // Fallback to simple query
    q = query(
      collection(db, COLLECTION_NOTIFIKASI), 
      where("userId", "==", userId)
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    let notifikasi = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NotifikasiLayanan[];
    
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
    console.error("Error in notifikasi subscription:", error);
    // If the subscription fails, try with simple query
    const fallbackQ = query(
      collection(db, COLLECTION_NOTIFIKASI), 
      where("userId", "==", userId)
    );
    
    return onSnapshot(fallbackQ, (snapshot) => {
      const notifikasi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotifikasiLayanan[];
      
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

// Get statistik layanan untuk admin dashboard
export const getLayananStats = async () => {
  try {
    const allLayanan = await getAllLayananPublik();
    
    const stats = {
      total: allLayanan.length,
      pending_kadus: allLayanan.filter(l => l.status === 'pending_kadus').length,
      approved_kadus: allLayanan.filter(l => l.status === 'approved_kadus').length,
      approved_admin: allLayanan.filter(l => l.status === 'approved_admin').length,
      completed: allLayanan.filter(l => l.status === 'completed').length,
      ditolak: allLayanan.filter(l => l.status === 'ditolak').length,
      auto_approved: allLayanan.filter(l => l.status === 'auto_approved').length,
      byJenis: {} as Record<string, number>
    };

    // Statistik per jenis layanan
    allLayanan.forEach(layanan => {
      if (stats.byJenis[layanan.jenisLayanan]) {
        stats.byJenis[layanan.jenisLayanan]++;
      } else {
        stats.byJenis[layanan.jenisLayanan] = 1;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting layanan stats:", error);
    throw error;
  }
};

// Delete layanan (untuk admin)
export const deleteLayanan = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_LAYANAN, id));
    return true;
  } catch (error) {
    console.error("Error deleting layanan:", error);
    throw error;
  }
};

// Approval functions for workflow
export const approveByAdmin = async (id: string, adminData: { catatanAdmin?: string }) => {
  try {
    await updateStatusLayanan(id, 'approved_admin', {
      ...adminData,
      approvedByAdmin: true,
      adminApprovalDate: serverTimestamp(),
      approvedAdminAt: serverTimestamp(), // Timestamp untuk auto-approve checker
      buktiApproval: `LAYANAN-${Date.now()}`, // Generate bukti approval
      estimasiSelesai: new Timestamp(Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), 0) // 7 hari dari sekarang
    });
    
    // Send notification to masyarakat
    const docRef = doc(db, COLLECTION_LAYANAN, id);
    const layananDoc = await getDoc(docRef);
    if (layananDoc.exists()) {
      const layananData = { id: layananDoc.id, ...layananDoc.data() } as LayananPublik;
      
      // Create notification for masyarakat
      await createLayananNotification({
        userId: layananData.userId,
        layananId: id,
        status: 'approved_admin',
        title: '✅ Dokumen Siap Diambil!',
        message: `Permohonan ${layananData.jenisLayanan} Anda telah disetujui oleh Admin Desa. Silakan datang ke Kantor Desa untuk mengambil dokumen.`,
        jenisLayanan: layananData.jenisLayanan,
        priority: 'high',
        buktiApproval: `LAYANAN-${Date.now()}`
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error approving by admin:", error);
    throw error;
  }
};

export const approveByKadus = async (id: string, kadusData: { catatanKadus?: string; nomorSuratKadus?: string }) => {
  try {
    await updateStatusLayanan(id, 'approved_kadus', {
      ...kadusData,
      approvedByKadus: true,
      kadusApprovalDate: serverTimestamp()
    });
    
    // Send notification to masyarakat
    const docRef = doc(db, COLLECTION_LAYANAN, id);
    const layananDoc = await getDoc(docRef);
    if (layananDoc.exists()) {
      const layananData = { id: layananDoc.id, ...layananDoc.data() } as LayananPublik;
      
      // Create notification for masyarakat
      await createLayananNotification({
        userId: layananData.userId,
        layananId: id,
        status: 'approved_kadus',
        title: '✅ Disetujui Kepala Dusun',
        message: `Permohonan ${layananData.jenisLayanan} Anda telah disetujui oleh Kepala Dusun. Saat ini sedang menunggu persetujuan dari Admin Desa.`,
        jenisLayanan: layananData.jenisLayanan,
        priority: 'medium'
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error approving by kadus:", error);
    throw error;
  }
};

export const markAsCompleted = async (id: string) => {
  try {
    await updateStatusLayanan(id, 'completed', {
      processedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error marking as completed:", error);
    throw error;
  }
};

export const autoApprove = async (id: string, currentStatus: string) => {
  try {
    let nextStatus = '';
    switch (currentStatus) {
      case 'pending_kadus':
        nextStatus = 'approved_kadus';
        break;
      default:
        throw new Error('Invalid status for auto-approval');
    }
    
    await updateStatusLayanan(id, nextStatus as any, {
      autoApprovalDate: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error auto-approving:", error);
    throw error;
  }
};

export const checkAndAutoApprove = async () => {
  try {
    const allLayanan = await getAllLayananPublik();
    const threeDaysAgo = new Timestamp(Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60), 0);
    
    const toAutoApprove = allLayanan.filter(layanan => {
      return layanan.status === 'pending_kadus' && 
             layanan.createdAt.seconds <= threeDaysAgo.seconds;
    });

    for (const layanan of toAutoApprove) {
      await autoApprove(layanan.id!, layanan.status);
    }

    return toAutoApprove.length;
  } catch (error) {
    console.error("Error checking auto-approval:", error);
    throw error;
  }
};

// Alias untuk getUserSubmissions (untuk riwayat)
export const getUserSubmissions = async (userId: string) => {
  return await getLayananByUser(userId);
};

// Save layanan (add user to savedBy array)
export async function saveLayanan(layananId: string, userId: string): Promise<void> {
  try {
    const layananRef = doc(db, 'layanan-publik', layananId);
    const layananDoc = await getDoc(layananRef);
    
    if (!layananDoc.exists()) {
      throw new Error('Layanan not found');
    }

    const currentSavedBy = layananDoc.data().savedBy || [];
    
    if (!currentSavedBy.includes(userId)) {
      await updateDoc(layananRef, {
        savedBy: [...currentSavedBy, userId],
        updatedAt: serverTimestamp()
      });
      console.log('✅ Layanan saved successfully');
    }
  } catch (error) {
    console.error('❌ Error saving layanan:', error);
    throw error;
  }
}

// Unsave layanan (remove user from savedBy array)
export async function unsaveLayanan(layananId: string, userId: string): Promise<void> {
  try {
    const layananRef = doc(db, 'layanan-publik', layananId);
    const layananDoc = await getDoc(layananRef);
    
    if (!layananDoc.exists()) {
      throw new Error('Layanan not found');
    }

    const currentSavedBy = layananDoc.data().savedBy || [];
    const updatedSavedBy = currentSavedBy.filter((id: string) => id !== userId);
    
    await updateDoc(layananRef, {
      savedBy: updatedSavedBy,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Layanan unsaved successfully');
  } catch (error) {
    console.error('❌ Error unsaving layanan:', error);
    throw error;
  }
}

// Get saved layanan by user
export async function getSavedLayananByUser(userId: string): Promise<LayananPublik[]> {
  try {
    // Try with index first
    try {
      const q = query(
        collection(db, 'layanan-publik'),
        where('savedBy', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const layanan: LayananPublik[] = [];
      
      querySnapshot.forEach((doc) => {
        layanan.push({
          id: doc.id,
          ...doc.data()
        } as LayananPublik);
      });
      
      return layanan;
    } catch (indexError: any) {
      // If index is not ready, use fallback without orderBy
      console.warn('Index not ready, using fallback query for saved layanan');
      
      const q = query(
        collection(db, 'layanan-publik'),
        where('savedBy', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const layanan: LayananPublik[] = [];
      
      querySnapshot.forEach((doc) => {
        layanan.push({
          id: doc.id,
          ...doc.data()
        } as LayananPublik);
      });
      
      // Sort manually in JavaScript
      return layanan.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    }
  } catch (error) {
    console.error('❌ Error getting saved layanan:', error);
    throw error;
  }
}

export default {
  addLayananPublik,
  updateStatusLayanan,
  getAllLayananPublik,
  getLayananByJenis,
  getLayananByUser,
  getUserSubmissions,
  getLayananById,
  addNotifikasiLayanan,
  getNotifikasiByUser,
  markNotifikasiAsRead,
  subscribeToLayanan,
  subscribeToNotifikasi,
  getLayananStats,
  deleteLayanan,
  saveLayanan,
  unsaveLayanan,
  getSavedLayananByUser

};