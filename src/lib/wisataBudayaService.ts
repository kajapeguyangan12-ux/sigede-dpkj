import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

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
              // Log compression info
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
          0.85 // Quality 85% - balance between quality and file size
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Helper function to upload single image to Firebase Storage (wisata_budaya folder)
async function uploadImageToStorage(file: File, folder: 'wisata' | 'budaya', subfolder?: string): Promise<string> {
  try {
    // Convert to WebP
    const webpBlob = await convertToWebP(file);
    
    // Generate filename with timestamp and type
    const timestamp = Date.now();
    const fileName = `${timestamp}_${folder}.webp`;
    
    // Path: wisata_budaya/{folder}/{subfolder}/{filename}
    const path = subfolder 
      ? `wisata_budaya/${folder}/${subfolder}/${fileName}` 
      : `wisata_budaya/${folder}/${fileName}`;
    
    console.log(`📤 Uploading to: ${path}`);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, webpBlob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`✅ Upload success: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
}

// Helper function to upload multiple images (gallery)
async function uploadGalleryImages(files: File[], folder: 'wisata' | 'budaya', itemId: string): Promise<string[]> {
  try {
    console.log(`📸 Uploading ${files.length} gallery images for ${folder}/${itemId}`);
    const uploadPromises = files.map(file => 
      uploadImageToStorage(file, folder, `${itemId}/galeri`)
    );
    const urls = await Promise.all(uploadPromises);
    console.log(`✅ All gallery images uploaded successfully`);
    return urls;
  } catch (error) {
    console.error('❌ Error uploading gallery images:', error);
    throw error;
  }
}

// Helper function to delete image from storage
async function deleteImageFromStorage(url: string): Promise<void> {
  try {
    const photoRef = ref(storage, url);
    await deleteObject(photoRef);
  } catch (err) {
    console.log('Photo not found or already deleted:', err);
  }
}

export interface WisataItem {
  id?: string;
  judul: string;
  kategori: 'Alam' | 'Budaya' | 'Kuliner' | 'Religi';
  alamat: string;
  lokasi: string;
  deskripsi: string;
  fotoUrl?: string;
  galeri?: string[]; // Multiple gallery images
  rating?: number;
  jarak?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface BudayaItem {
  id?: string;
  judul: string;
  kategori: 'Tari' | 'Upacara' | 'Kerajinan' | 'Musik' | 'Tradisi';
  alamat?: string;
  lokasi?: string;
  deskripsi: string;
  sejarah?: string;
  fotoUrl?: string;
  galeri?: string[]; // Multiple gallery images
  createdAt?: any;
  updatedAt?: any;
}

// ============ WISATA FUNCTIONS ============

export async function getAllWisata(): Promise<WisataItem[]> {
  try {
    const q = query(collection(db, 'wisata'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WisataItem[];
  } catch (error) {
    console.error('Error getting wisata:', error);
    throw error;
  }
}

export async function getWisataById(id: string): Promise<WisataItem | null> {
  try {
    const docRef = doc(db, 'wisata', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as WisataItem;
    }
    return null;
  } catch (error) {
    console.error('Error getting wisata by id:', error);
    throw error;
  }
}

export async function createWisata(data: WisataItem, foto?: File, galeriFiles?: File[]): Promise<string> {
  try {
    let fotoUrl = '';
    let galeri: string[] = [];
    
    // First, create the document to get the ID
    const wisataData = {
      ...data,
      fotoUrl: '',
      galeri: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'wisata'), wisataData);
    const docId = docRef.id;

    // Upload main photo if provided
    if (foto) {
      fotoUrl = await uploadImageToStorage(foto, 'wisata', docId);
    }

    // Upload gallery images if provided
    if (galeriFiles && galeriFiles.length > 0) {
      galeri = await uploadGalleryImages(galeriFiles, 'wisata', docId);
    }

    // Update document with image URLs
    await updateDoc(docRef, {
      fotoUrl,
      galeri,
      updatedAt: Timestamp.now()
    });

    return docId;
  } catch (error) {
    console.error('Error creating wisata:', error);
    throw error;
  }
}

export async function updateWisata(id: string, data: Partial<WisataItem>, foto?: File, galeriFiles?: File[], deleteGaleriUrls?: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'wisata', id);
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Get existing data
    const oldDoc = await getDoc(docRef);
    const existingData = oldDoc.data();

    // Handle main photo update
    if (foto) {
      // Delete old photo if exists
      if (existingData?.fotoUrl) {
        await deleteImageFromStorage(existingData.fotoUrl);
      }

      // Upload new photo
      updateData.fotoUrl = await uploadImageToStorage(foto, 'wisata', id);
    }

    // Handle gallery deletion
    if (deleteGaleriUrls && deleteGaleriUrls.length > 0) {
      for (const url of deleteGaleriUrls) {
        await deleteImageFromStorage(url);
      }
      
      // Remove deleted URLs from galeri array
      const currentGaleri = existingData?.galeri || [];
      updateData.galeri = currentGaleri.filter((url: string) => !deleteGaleriUrls.includes(url));
    }

    // Handle new gallery images
    if (galeriFiles && galeriFiles.length > 0) {
      const newGaleriUrls = await uploadGalleryImages(galeriFiles, 'wisata', id);
      const currentGaleri = updateData.galeri || existingData?.galeri || [];
      updateData.galeri = [...currentGaleri, ...newGaleriUrls];
    }

    await updateDoc(docRef, updateData);
  } catch (err) {
    console.error('Error updating wisata:', err);
    throw err;
  }
}

export async function deleteWisata(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'wisata', id);
    
    // Get document data
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Delete main photo if exists
      if (data.fotoUrl) {
        await deleteImageFromStorage(data.fotoUrl);
      }
      
      // Delete all gallery images if exist
      if (data.galeri && Array.isArray(data.galeri)) {
        for (const url of data.galeri) {
          await deleteImageFromStorage(url);
        }
      }
    }

    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting wisata:', err);
    throw err;
  }
}

// ============ BUDAYA FUNCTIONS ============

export async function getAllBudaya(): Promise<BudayaItem[]> {
  try {
    const q = query(collection(db, 'budaya'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudayaItem[];
  } catch (error) {
    console.error('Error getting budaya:', error);
    throw error;
  }
}

export async function getBudayaById(id: string): Promise<BudayaItem | null> {
  try {
    const docRef = doc(db, 'budaya', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as BudayaItem;
    }
    return null;
  } catch (error) {
    console.error('Error getting budaya by id:', error);
    throw error;
  }
}

export async function createBudaya(data: BudayaItem, foto?: File, galeriFiles?: File[]): Promise<string> {
  try {
    let fotoUrl = '';
    let galeri: string[] = [];
    
    // First, create the document to get the ID
    const budayaData = {
      ...data,
      fotoUrl: '',
      galeri: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'budaya'), budayaData);
    const docId = docRef.id;

    // Upload main photo if provided
    if (foto) {
      fotoUrl = await uploadImageToStorage(foto, 'budaya', docId);
    }

    // Upload gallery images if provided
    if (galeriFiles && galeriFiles.length > 0) {
      galeri = await uploadGalleryImages(galeriFiles, 'budaya', docId);
    }

    // Update document with image URLs
    await updateDoc(docRef, {
      fotoUrl,
      galeri,
      updatedAt: Timestamp.now()
    });

    return docId;
  } catch (error) {
    console.error('Error creating budaya:', error);
    throw error;
  }
}

export async function updateBudaya(id: string, data: Partial<BudayaItem>, foto?: File, galeriFiles?: File[], deleteGaleriUrls?: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'budaya', id);
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Get existing data
    const oldDoc = await getDoc(docRef);
    const existingData = oldDoc.data();

    // Handle main photo update
    if (foto) {
      // Delete old photo if exists
      if (existingData?.fotoUrl) {
        await deleteImageFromStorage(existingData.fotoUrl);
      }

      // Upload new photo
      updateData.fotoUrl = await uploadImageToStorage(foto, 'budaya', id);
    }

    // Handle gallery deletion
    if (deleteGaleriUrls && deleteGaleriUrls.length > 0) {
      for (const url of deleteGaleriUrls) {
        await deleteImageFromStorage(url);
      }
      
      // Remove deleted URLs from galeri array
      const currentGaleri = existingData?.galeri || [];
      updateData.galeri = currentGaleri.filter((url: string) => !deleteGaleriUrls.includes(url));
    }

    // Handle new gallery images
    if (galeriFiles && galeriFiles.length > 0) {
      const newGaleriUrls = await uploadGalleryImages(galeriFiles, 'budaya', id);
      const currentGaleri = updateData.galeri || existingData?.galeri || [];
      updateData.galeri = [...currentGaleri, ...newGaleriUrls];
    }

    await updateDoc(docRef, updateData);
  } catch (err) {
    console.error('Error updating budaya:', err);
    throw err;
  }
}

export async function deleteBudaya(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'budaya', id);
    
    // Get document data
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Delete main photo if exists
      if (data.fotoUrl) {
        await deleteImageFromStorage(data.fotoUrl);
      }
      
      // Delete all gallery images if exist
      if (data.galeri && Array.isArray(data.galeri)) {
        for (const url of data.galeri) {
          await deleteImageFromStorage(url);
        }
      }
    }

    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting budaya:', err);
    throw err;
  }
}
