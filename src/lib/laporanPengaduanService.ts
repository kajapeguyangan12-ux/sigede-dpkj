import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where,
  Timestamp,
  getDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { createPengaduanNotification, generatePengaduanMessage } from './notificationService';

// Helper function to convert image to WebP with 85% quality
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const originalSize = file.size;
              const webpSize = blob.size;
              const compressionRatio = ((1 - webpSize / originalSize) * 100).toFixed(2);
              console.log(`📦 WebP Conversion: ${(originalSize / 1024).toFixed(2)}KB → ${(webpSize / 1024).toFixed(2)}KB (${compressionRatio}% smaller)`);
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export type StatusLaporan = 'menunggu' | 'diproses' | 'disetujui' | 'selesai' | 'ditolak' | 'approved_admin' | 'approved_kadus' | 'approved_kades' | 'auto_approved';

export interface LaporanPengaduan {
  id?: string;
  userId: string;
  userName: string;
  judul: string;
  kategori: string;
  isi: string;
  fotoUrl?: string;
  status: StatusLaporan;
  tanggapan?: string;
  createdAt?: any;
  updatedAt?: any;
  // Optional additional fields
  namaLengkap?: string;
  nik?: string;
  alamat?: string;
  daerah?: string; // Daerah/banjar pelapor
  noTelepon?: string;
  email?: string;
  // Approval tracking
  approvedByAdmin?: boolean;
  approvedByKadus?: boolean;
  approvedByKades?: boolean;
  adminApprovalDate?: any;
  approvedAdminAt?: any;
  kadusApprovalDate?: any;
  kadesApprovalDate?: any;
  autoApprovedAt?: any;
  autoApprovedReason?: string;
  catatanAdmin?: string;
  catatanKadus?: string;
  catatanKades?: string;
  // Bookmark/Save feature
  savedBy?: string[]; // Array of user IDs who saved this laporan
}

// Upload foto ke Firebase Storage dengan konversi WebP
async function uploadFoto(file: File, laporanId: string): Promise<string> {
  try {
    console.log('🖼️ Converting image to WebP...');
    const webpBlob = await convertToWebP(file);
    
    const fileName = `laporan_${laporanId}_${Date.now()}.webp`;
    const storageRef = ref(storage, `laporan-pengaduan/${fileName}`);
    
    console.log('⬆️ Uploading to Firebase Storage...');
    await uploadBytes(storageRef, webpBlob, {
      contentType: 'image/webp',
    });
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Upload successful:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading foto:', error);
    throw error;
  }
}

// Buat laporan baru
export async function createLaporan(
  laporan: Omit<LaporanPengaduan, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  fotoFile?: File
): Promise<string> {
  try {
    console.log('📝 Creating laporan pengaduan...');
    
    // Tambahkan timestamp dan status default
    const laporanData = {
      ...laporan,
      status: 'menunggu' as StatusLaporan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Simpan ke Firestore dulu untuk dapat ID
    const docRef = await addDoc(collection(db, 'laporan-pengaduan'), laporanData);
    console.log('✅ Laporan created with ID:', docRef.id);
    
    // Upload foto jika ada
    if (fotoFile) {
      try {
        const fotoUrl = await uploadFoto(fotoFile, docRef.id);
        await updateDoc(doc(db, 'laporan-pengaduan', docRef.id), {
          fotoUrl,
          updatedAt: Timestamp.now(),
        });
        console.log('✅ Foto uploaded and laporan updated');
      } catch (error) {
        console.error('⚠️ Error uploading foto, but laporan is created:', error);
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating laporan:', error);
    throw error;
  }
}

// Get semua laporan berdasarkan userId
export async function getLaporanByUser(userId: string): Promise<LaporanPengaduan[]> {
  try {
    const q = query(
      collection(db, 'laporan-pengaduan'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const laporan: LaporanPengaduan[] = [];
    
    querySnapshot.forEach((doc) => {
      laporan.push({
        id: doc.id,
        ...doc.data(),
      } as LaporanPengaduan);
    });
    
    return laporan;
  } catch (error) {
    console.error('Error fetching laporan:', error);
    throw error;
  }
}

// Real-time listener untuk laporan user
export function subscribeToUserLaporan(
  userId: string, 
  callback: (laporan: LaporanPengaduan[]) => void
) {
  try {
    const q = query(
      collection(db, 'laporan-pengaduan'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const laporan: LaporanPengaduan[] = [];
      
      querySnapshot.forEach((doc) => {
        laporan.push({
          id: doc.id,
          ...doc.data(),
        } as LaporanPengaduan);
      });
      
      callback(laporan);
    }, (error) => {
      console.error('Error listening to laporan changes:', error);
    });
  } catch (error) {
    console.error('Error setting up laporan listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// Real-time listener untuk semua laporan (admin)
export function subscribeToAllLaporan(callback: (laporan: LaporanPengaduan[]) => void) {
  try {
    const q = query(
      collection(db, 'laporan-pengaduan'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const laporan: LaporanPengaduan[] = [];
      
      querySnapshot.forEach((doc) => {
        laporan.push({
          id: doc.id,
          ...doc.data(),
        } as LaporanPengaduan);
      });
      
      callback(laporan);
    }, (error) => {
      console.error('Error listening to all laporan changes:', error);
    });
  } catch (error) {
    console.error('Error setting up all laporan listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// Get semua laporan (untuk admin)
export async function getAllLaporan(): Promise<LaporanPengaduan[]> {
  try {
    const q = query(
      collection(db, 'laporan-pengaduan'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const laporan: LaporanPengaduan[] = [];
    
    querySnapshot.forEach((doc) => {
      laporan.push({
        id: doc.id,
        ...doc.data(),
      } as LaporanPengaduan);
    });
    
    return laporan;
  } catch (error) {
    console.error('Error fetching all laporan:', error);
    throw error;
  }
}

// Update status laporan (untuk admin)
export async function updateStatusLaporan(
  laporanId: string,
  status: StatusLaporan,
  tanggapan?: string
): Promise<void> {
  try {
    // First, get the current laporan data
    const laporanDoc = await getDoc(doc(db, 'laporan-pengaduan', laporanId));
    if (!laporanDoc.exists()) {
      throw new Error('Laporan tidak ditemukan');
    }

    const laporanData = laporanDoc.data() as LaporanPengaduan;
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (tanggapan) {
      updateData.tanggapan = tanggapan;
    }
    
    await updateDoc(doc(db, 'laporan-pengaduan', laporanId), updateData);
    
    // Create notification for status change
    if (laporanData.userId) {
      const notificationData = generatePengaduanMessage(status, laporanData.kategori);
      
      await createPengaduanNotification({
        userId: laporanData.userId,
        pengaduanId: laporanId,
        status,
        title: notificationData.title,
        message: notificationData.message,
        kategori: laporanData.kategori,
        tanggapan: tanggapan,
        priority: notificationData.priority
      });
    }
    
    console.log('✅ Status laporan updated and notification sent');
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Delete laporan
export async function deleteLaporan(laporanId: string): Promise<void> {
  try {
    // Get laporan data untuk hapus foto
    const docRef = doc(db, 'laporan-pengaduan', laporanId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const laporan = docSnap.data() as LaporanPengaduan;
      
      // Hapus foto dari storage jika ada
      if (laporan.fotoUrl) {
        try {
          const fotoRef = ref(storage, laporan.fotoUrl);
          await deleteObject(fotoRef);
          console.log('✅ Foto deleted from storage');
        } catch (error) {
          console.warn('⚠️ Error deleting foto:', error);
        }
      }
    }
    
    // Hapus document dari Firestore
    await deleteDoc(docRef);
    console.log('✅ Laporan deleted');
  } catch (error) {
    console.error('Error deleting laporan:', error);
    throw error;
  }
}

// Save/Bookmark laporan
export async function saveLaporan(laporanId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'laporan-pengaduan', laporanId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Laporan tidak ditemukan');
    }
    
    const laporan = docSnap.data() as LaporanPengaduan;
    const savedBy = laporan.savedBy || [];
    
    // Tambahkan userId ke array savedBy jika belum ada
    if (!savedBy.includes(userId)) {
      await updateDoc(docRef, {
        savedBy: [...savedBy, userId],
        updatedAt: Timestamp.now()
      });
      console.log('✅ Laporan saved');
    }
  } catch (error) {
    console.error('Error saving laporan:', error);
    throw error;
  }
}

// Unsave/Remove bookmark laporan
export async function unsaveLaporan(laporanId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, 'laporan-pengaduan', laporanId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Laporan tidak ditemukan');
    }
    
    const laporan = docSnap.data() as LaporanPengaduan;
    const savedBy = laporan.savedBy || [];
    
    // Hapus userId dari array savedBy
    const updatedSavedBy = savedBy.filter(id => id !== userId);
    
    await updateDoc(docRef, {
      savedBy: updatedSavedBy,
      updatedAt: Timestamp.now()
    });
    console.log('✅ Laporan unsaved');
  } catch (error) {
    console.error('Error unsaving laporan:', error);
    throw error;
  }
}

// Get saved laporan by user
export async function getSavedLaporanByUser(userId: string): Promise<LaporanPengaduan[]> {
  try {
    // Try with index first
    try {
      const q = query(
        collection(db, 'laporan-pengaduan'),
        where('savedBy', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const laporan: LaporanPengaduan[] = [];
      
      querySnapshot.forEach((doc) => {
        laporan.push({
          id: doc.id,
          ...doc.data()
        } as LaporanPengaduan);
      });
      
      return laporan;
    } catch (indexError: any) {
      // If index is not ready, use fallback without orderBy
      console.warn('Index not ready, using fallback query for saved laporan');
      
      const q = query(
        collection(db, 'laporan-pengaduan'),
        where('savedBy', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const laporan: LaporanPengaduan[] = [];
      
      querySnapshot.forEach((doc) => {
        laporan.push({
          id: doc.id,
          ...doc.data()
        } as LaporanPengaduan);
      });
      
      // Sort manually in JavaScript
      return laporan.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    }
  } catch (error) {
    console.error('Error getting saved laporan:', error);
    throw error;
  }
}
