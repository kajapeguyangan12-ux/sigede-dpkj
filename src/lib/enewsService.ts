import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from './firebase';

export interface ENewsItem {
  id: string;
  judul: string;
  tanggal: string; // Tanggal kegiatan (eventDate)
  deskripsi: string;
  lokasi?: string;
  gambar: string;
  jenis: 'berita' | 'pengumuman';
  status: 'published' | 'draft';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const ENEWS_COLLECTION = 'e-news_berita';
const PENGUMUMAN_COLLECTION = 'e-news_pengumuman';

// Create new e-news item
export const createENewsItem = async (itemData: Omit<ENewsItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const collectionName = itemData.jenis === 'berita' ? ENEWS_COLLECTION : PENGUMUMAN_COLLECTION;
    const docRef = await addDoc(collection(db, collectionName), {
      ...itemData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating e-news item:', error);
    throw error;
  }
};

// Update existing e-news item
export const updateENewsItem = async (id: string, itemData: Partial<ENewsItem>) => {
  try {
    const collectionName = itemData.jenis === 'berita' ? ENEWS_COLLECTION : PENGUMUMAN_COLLECTION;
    const itemRef = doc(db, collectionName, id);
    await updateDoc(itemRef, {
      ...itemData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating e-news item:', error);
    throw error;
  }
};

// Delete e-news item
export const deleteENewsItem = async (id: string, jenis: 'berita' | 'pengumuman') => {
  try {
    const collectionName = jenis === 'berita' ? ENEWS_COLLECTION : PENGUMUMAN_COLLECTION;
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error('Error deleting e-news item:', error);
    throw error;
  }
};

// Helper function to normalize data from different field names
const normalizeENewsItem = (data: any, id: string, jenis: 'berita' | 'pengumuman'): ENewsItem => {
  // Handle different field name variations
  const judul = data.title || data.judul || '';
  
  // Handle date/tanggal - prioritize eventDate, then fall back to other fields
  let tanggal: any = data.eventDate || data.tanggal || data.createdAt || data.date;
  
  // Convert Firestore Timestamp to ISO string
  if (tanggal && typeof tanggal === 'object' && tanggal.toDate) {
    tanggal = tanggal.toDate().toISOString();
  } else if (tanggal && typeof tanggal === 'object' && tanggal.seconds) {
    // Handle raw Firestore timestamp object
    tanggal = new Date(tanggal.seconds * 1000).toISOString();
  } else if (typeof tanggal === 'string') {
    // If it's already a string (ISO date or date string), keep it
    tanggal = tanggal;
  } else {
    // Fallback to current date
    tanggal = new Date().toISOString();
  }
  
  const deskripsi = data.description || data.deskripsi || '';
  const lokasi = data.lokasi || data.location;
  let gambar = data.imageUrl || data.gambar || data.image;
  
  // Debug: Log all image-related fields
  console.log(`🖼️ Image fields for ${jenis} (${id.substring(0, 8)}):`, {
    imageUrl: data.imageUrl,
    gambar: data.gambar,
    image: data.image,
    finalGambar: gambar
  });
  
  // If gambar is empty string, use fallback
  if (!gambar || gambar.trim() === '') {
    console.log(`⚠️ No image found, using fallback for ${jenis} (${id.substring(0, 8)})`);
    gambar = '/logo/default.png';
  }
  
  // Handle createdAt - could be Timestamp or string
  let createdAt = data.createdAt;
  if (!createdAt || !createdAt.toMillis) {
    // Try to create a timestamp from current time
    createdAt = Timestamp.now();
  }
  
  let updatedAt = data.updatedAt;
  if (!updatedAt || !updatedAt.toMillis) {
    updatedAt = Timestamp.now();
  }

  const normalized = {
    id,
    judul,
    tanggal: String(tanggal),
    deskripsi,
    lokasi,
    gambar,
    jenis,
    status: data.status || 'published', // Default to published if not specified
    createdAt,
    updatedAt,
  };
  
  console.log(`✅ Normalized ${jenis}:`, { 
    id: id.substring(0, 8), 
    judul: normalized.judul.substring(0, 30), 
    tanggal: normalized.tanggal.substring(0, 20),
    hasImage: !!gambar && gambar !== '/logo/default.png'
  });
  
  return normalized as ENewsItem;
};

// Get all published e-news items (berita and pengumuman)
export const getPublishedENewsItems = async () => {
  try {
    const items: ENewsItem[] = [];
    console.log('🔍 Starting getPublishedENewsItems...');

    // Get published berita
    console.log('📚 Fetching from collection:', ENEWS_COLLECTION);
    const qBerita = query(collection(db, ENEWS_COLLECTION));
    const querySnapshotBerita = await getDocs(qBerita);
    console.log('✅ Berita documents found:', querySnapshotBerita.size);
    
    querySnapshotBerita.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 Berita Document ID: ${doc.id}`, {
        title: data.title,
        description: data.description?.substring(0, 50),
        status: data.status,
        hasImageUrl: !!data.imageUrl
      });
      // Include all documents from berita collection
      items.push(normalizeENewsItem(data, doc.id, 'berita'));
    });

    // Get published pengumuman
    console.log('📢 Fetching from collection:', PENGUMUMAN_COLLECTION);
    const qPengumuman = query(collection(db, PENGUMUMAN_COLLECTION));
    const querySnapshotPengumuman = await getDocs(qPengumuman);
    console.log('✅ Pengumuman documents found:', querySnapshotPengumuman.size);
    
    querySnapshotPengumuman.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 Pengumuman Document ID: ${doc.id}`, {
        title: data.title,
        description: data.description?.substring(0, 50),
        status: data.status,
        hasImageUrl: !!data.imageUrl
      });
      // Include all documents from pengumuman collection
      items.push(normalizeENewsItem(data, doc.id, 'pengumuman'));
    });

    const sorted = items.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    
    console.log('🎉 Final items count:', sorted.length);
    console.log('📊 Items breakdown:', {
      berita: sorted.filter(i => i.jenis === 'berita').length,
      pengumuman: sorted.filter(i => i.jenis === 'pengumuman').length
    });
    
    return sorted;
  } catch (error) {
    console.error('❌ Error getting published e-news items:', error);
    throw error;
  }
};

// Get all e-news items (for admin) - berita and pengumuman
export const getAllENewsItems = async () => {
  try {
    const items: ENewsItem[] = [];

    // Get all berita
    const qBerita = query(
      collection(db, ENEWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshotBerita = await getDocs(qBerita);
    querySnapshotBerita.forEach((doc) => {
      items.push(normalizeENewsItem(doc.data(), doc.id, 'berita'));
    });

    // Get all pengumuman
    const qPengumuman = query(
      collection(db, PENGUMUMAN_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshotPengumuman = await getDocs(qPengumuman);
    querySnapshotPengumuman.forEach((doc) => {
      items.push(normalizeENewsItem(doc.data(), doc.id, 'pengumuman'));
    });

    return items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  } catch (error) {
    console.error('Error getting all e-news items:', error);
    throw error;
  }
};

const createENewsSubscription = (
  callback: (items: ENewsItem[]) => void,
  ordered: boolean,
  onError?: (error: Error) => void
) => {
  let beritaItems: ENewsItem[] = [];
  let pengumumanItems: ENewsItem[] = [];
  let beritaReady = false;
  let pengumumanReady = false;

  const emitItems = () => {
    if (!beritaReady || !pengumumanReady) return;

    callback(
      [...beritaItems, ...pengumumanItems].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      })
    );
  };

  const handleError = (error: Error) => {
    console.error('Error in e-news subscription:', error);
    onError?.(error);
  };

  const beritaQuery = ordered
    ? query(collection(db, ENEWS_COLLECTION), orderBy('createdAt', 'desc'))
    : query(collection(db, ENEWS_COLLECTION));
  const pengumumanQuery = ordered
    ? query(collection(db, PENGUMUMAN_COLLECTION), orderBy('createdAt', 'desc'))
    : query(collection(db, PENGUMUMAN_COLLECTION));

  const unsubscribeBerita = onSnapshot(
    beritaQuery,
    (snapshot) => {
      beritaItems = snapshot.docs.map((item) =>
        normalizeENewsItem(item.data(), item.id, 'berita')
      );
      beritaReady = true;
      emitItems();
    },
    handleError
  );

  const unsubscribePengumuman = onSnapshot(
    pengumumanQuery,
    (snapshot) => {
      pengumumanItems = snapshot.docs.map((item) =>
        normalizeENewsItem(item.data(), item.id, 'pengumuman')
      );
      pengumumanReady = true;
      emitItems();
    },
    handleError
  );

  return () => {
    unsubscribeBerita();
    unsubscribePengumuman();
  };
};

// Subscribe to real-time updates for published items (berita and pengumuman)
export const subscribeToPublishedENews = (
  callback: (items: ENewsItem[]) => void,
  onError?: (error: Error) => void
) => {
  return createENewsSubscription(callback, false, onError);
};

// Subscribe to real-time updates for all items (for admin) - berita and pengumuman
export const subscribeToAllENews = (callback: (items: ENewsItem[]) => void) => {
  return createENewsSubscription(callback, true);
};

// Upload image to Firebase Storage
export const uploadImageToStorage = async (file: File, fileName: string): Promise<string> => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `enews-images/${fileName}`);

    // Convert to WebP first
    const webpBlob = await convertToWebP(file);
    const webpFile = new File([webpBlob], fileName.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' });

    const snapshot = await uploadBytes(storageRef, webpFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper function to convert image to WebP
const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img') as HTMLImageElement;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert image to WebP'));
        }
      }, 'image/webp', 0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Fetch single e-news item by id and jenis
export const getENewsItemById = async (id: string, jenis: 'berita' | 'pengumuman') => {
  try {
    const collectionName = jenis === 'berita' ? ENEWS_COLLECTION : PENGUMUMAN_COLLECTION;
    const itemRef = doc(db, collectionName, id);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
      return null;
    }

    return normalizeENewsItem(snapshot.data(), snapshot.id, jenis);
  } catch (error) {
    console.error('Error fetching e-news item:', error);
    throw error;
  }
};
