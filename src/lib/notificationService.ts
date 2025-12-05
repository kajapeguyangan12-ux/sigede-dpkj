import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

export interface UniversalNotification {
  id?: string;
  userId: string;
  type: 'pengaduan' | 'layanan_publik';
  referenceId: string; // ID of the related pengaduan or layanan
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  metadata?: {
    jenisLayanan?: string;
    kategoriPengaduan?: string;
    currentStatus?: string;
    buktiApproval?: string;
    estimasiSelesai?: string;
    alasanTolak?: string;
    tanggapan?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
  readAt?: Timestamp;
}

const COLLECTION_NOTIFICATIONS = "universal_notifications";

// Create notification for pengaduan status changes
export const createPengaduanNotification = async (data: {
  userId: string;
  pengaduanId: string;
  status: string;
  title: string;
  message: string;
  kategori?: string;
  tanggapan?: string;
  priority?: 'low' | 'medium' | 'high';
}) => {
  try {
    // Build metadata object, only including defined values
    const metadata: {
      kategoriPengaduan?: string;
      currentStatus: string;
      tanggapan?: string;
    } = {
      currentStatus: data.status,
    };

    // Only add optional fields if they are defined
    if (data.kategori !== undefined) {
      metadata.kategoriPengaduan = data.kategori;
    }
    if (data.tanggapan !== undefined) {
      metadata.tanggapan = data.tanggapan;
    }

    const notification: Omit<UniversalNotification, 'id'> = {
      userId: data.userId,
      type: 'pengaduan',
      referenceId: data.pengaduanId,
      title: data.title,
      message: data.message,
      status: 'unread',
      priority: data.priority || 'medium',
      actionRequired: false,
      metadata,
      createdAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, COLLECTION_NOTIFICATIONS), notification);
    console.log('✅ Pengaduan notification created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating pengaduan notification:', error);
    throw error;
  }
};

// Create notification for layanan publik status changes
export const createLayananNotification = async (data: {
  userId: string;
  layananId: string;
  status: string;
  title: string;
  message: string;
  jenisLayanan?: string;
  buktiApproval?: string;
  estimasiSelesai?: string;
  alasanTolak?: string;
  priority?: 'low' | 'medium' | 'high';
}) => {
  try {
    // Build metadata object, only including defined values
    const metadata: {
      jenisLayanan?: string;
      currentStatus: string;
      buktiApproval?: string;
      estimasiSelesai?: string;
      alasanTolak?: string;
    } = {
      currentStatus: data.status,
    };

    // Only add optional fields if they are defined
    if (data.jenisLayanan !== undefined) {
      metadata.jenisLayanan = data.jenisLayanan;
    }
    if (data.buktiApproval !== undefined) {
      metadata.buktiApproval = data.buktiApproval;
    }
    if (data.estimasiSelesai !== undefined) {
      metadata.estimasiSelesai = data.estimasiSelesai;
    }
    if (data.alasanTolak !== undefined) {
      metadata.alasanTolak = data.alasanTolak;
    }

    const notification: Omit<UniversalNotification, 'id'> = {
      userId: data.userId,
      type: 'layanan_publik',
      referenceId: data.layananId,
      title: data.title,
      message: data.message,
      status: 'unread',
      priority: data.priority || 'medium',
      actionRequired: data.status === 'approved_kades', // Action required when ready for pickup
      metadata,
      createdAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, COLLECTION_NOTIFICATIONS), notification);
    console.log('✅ Layanan notification created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating layanan notification:', error);
    throw error;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId: string): Promise<UniversalNotification[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NOTIFICATIONS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: UniversalNotification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as UniversalNotification);
    });
    
    return notifications;
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notifRef = doc(db, COLLECTION_NOTIFICATIONS, notificationId);
    await updateDoc(notifRef, {
      status: 'read',
      readAt: serverTimestamp()
    });
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NOTIFICATIONS),
      where("userId", "==", userId),
      where("status", "==", "unread")
    );
    
    const querySnapshot = await getDocs(q);
    const promises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        status: 'read',
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    console.log('✅ All notifications marked as read for user:', userId);
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION_NOTIFICATIONS),
      where("userId", "==", userId),
      where("status", "==", "unread")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
};

// Subscribe to user notifications (real-time)
export const subscribeToUserNotifications = (
  userId: string,
  callback: (notifications: UniversalNotification[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NOTIFICATIONS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications: UniversalNotification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as UniversalNotification);
    });
    callback(notifications);
  });
};

// Helper function to generate professional messages for pengaduan
export const generatePengaduanMessage = (status: string, kategori?: string): { title: string; message: string; priority: 'low' | 'medium' | 'high' } => {
  switch (status) {
    case 'approved_admin':
      return {
        title: 'Pengaduan Disetujui Admin',
        message: `Pengaduan Anda telah disetujui oleh Admin Desa dan sedang menunggu persetujuan Kepala Dusun. Kami akan segera memproses lebih lanjut.`,
        priority: 'medium'
      };
    
    case 'approved_kepala_dusun':
      return {
        title: 'Pengaduan Disetujui Kepala Dusun',
        message: `Pengaduan Anda telah disetujui oleh Kepala Dusun dan akan ditindaklanjuti sesuai prosedur yang berlaku. Terima kasih atas laporan Anda.`,
        priority: 'medium'
      };
    
    case 'diproses':
      return {
        title: 'Pengaduan Sedang Diproses',
        message: `Pengaduan Anda sedang dalam tahap penanganan aktif. Tim terkait telah ditugaskan untuk menyelesaikan permasalahan yang Anda laporkan.`,
        priority: 'high'
      };
    
    case 'selesai':
      return {
        title: 'Pengaduan Telah Diselesaikan',
        message: `Alhamdulillah, pengaduan Anda telah berhasil diselesaikan. Terima kasih atas partisipasi Anda dalam membangun desa yang lebih baik.`,
        priority: 'high'
      };
    
    case 'ditolak':
      return {
        title: 'Pengaduan Tidak Dapat Diproses',
        message: `Mohon maaf, pengaduan Anda tidak dapat diproses lebih lanjut. Silakan hubungi kantor desa untuk informasi lebih detail.`,
        priority: 'high'
      };
    
    default:
      return {
        title: 'Update Status Pengaduan',
        message: `Status pengaduan Anda telah diperbarui. Silakan periksa detail lengkap di aplikasi.`,
        priority: 'medium'
      };
  }
};

// Helper function to generate professional messages for layanan publik
export const generateLayananMessage = (status: string, jenisLayanan?: string, buktiApproval?: string): { title: string; message: string; priority: 'low' | 'medium' | 'high' } => {
  const layanan = jenisLayanan || 'dokumen';
  
  switch (status) {
    case 'pending_kadus':
      return {
        title: 'Permohonan Berhasil Dikirim',
        message: `Permohonan ${layanan} Anda telah berhasil diterima dan sedang menunggu persetujuan dari Kepala Dusun. Estimasi waktu persetujuan 1-3 hari kerja.`,
        priority: 'medium'
      };
    
    case 'approved_kadus':
      return {
        title: 'Disetujui Kepala Dusun',
        message: `Permohonan ${layanan} Anda telah disetujui oleh Kepala Dusun. Saat ini sedang menunggu persetujuan dari Admin Desa.`,
        priority: 'medium'
      };
    
    case 'approved_admin':
      return {
        title: 'Dokumen Siap Diambil!',
        message: `Selamat! Permohonan ${layanan} Anda telah disetujui oleh Admin Desa dan dokumen siap untuk diambil. ${buktiApproval ? `Kode bukti: ${buktiApproval}. ` : ''}Silakan datang ke Kantor Desa dengan membawa identitas dan kode bukti ini dalam waktu 7 hari.`,
        priority: 'high'
      };
    
    case 'completed':
      return {
        title: 'Layanan Selesai',
        message: `Terima kasih telah menggunakan layanan ${layanan}. Dokumen Anda telah berhasil diambil. Semoga bermanfaat.`,
        priority: 'medium'
      };
    
    case 'ditolak':
      return {
        title: 'Permohonan Tidak Dapat Diproses',
        message: `Mohon maaf, permohonan ${layanan} Anda tidak dapat diproses lebih lanjut karena tidak memenuhi persyaratan. Silakan hubungi kantor desa untuk informasi lebih detail.`,
        priority: 'high'
      };
    
    case 'auto_approved':
      return {
        title: 'Disetujui Otomatis',
        message: `Permohonan ${layanan} Anda telah disetujui secara otomatis karena melebihi batas waktu pemrosesan. Dokumen akan segera diproses.`,
        priority: 'medium'
      };
    
    default:
      return {
        title: 'Update Status Layanan',
        message: `Status permohonan ${layanan} Anda telah diperbarui. Silakan periksa detail lengkap di aplikasi.`,
        priority: 'medium'
      };
  }
};