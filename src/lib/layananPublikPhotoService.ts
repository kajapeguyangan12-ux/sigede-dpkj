import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { storage } from './firebase';
import { convertImageToWebP, validateImageFile } from './imageUtils';

export interface UploadResult {
  success: boolean;
  downloadURL?: string;
  error?: string;
  path?: string;
}

/**
 * Upload foto KK atau KTP untuk layanan publik ke Firebase Storage
 * @param file - File gambar yang akan diupload
 * @param userId - ID user (untuk folder path)
 * @param layananId - ID layanan publik
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ktp'
 * @returns Promise<UploadResult>
 */
export const uploadLayananPublikPhoto = async (
  file: File,
  userId: string,
  layananId: string,
  fileType: 'foto_kk' | 'foto_ktp'
): Promise<UploadResult> => {
  try {
    console.log('🚀 UPLOAD LAYANAN: Starting upload process...');
    console.log('📁 File type:', fileType);
    console.log('👤 User ID:', userId);
    console.log('📋 Layanan ID:', layananId);
    console.log('📄 Original file:', file.name, '-', (file.size / 1024).toFixed(2), 'KB');

    // Validate file
    const validation = validateImageFile(file, 5); // Max 5MB
    if (!validation.isValid) {
      console.log('❌ UPLOAD LAYANAN: Validation failed -', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }
    console.log('✅ UPLOAD LAYANAN: File validation passed');

    // Convert to WebP
    console.log('🔄 UPLOAD LAYANAN: Converting to WebP...');
    const webpBlob = await convertImageToWebP(file, 0.85); // 85% quality
    
    // Create storage path: layanan-publik/{userId}/{layananId}/{fileType}.webp
    const storagePath = `layanan-publik/${userId}/${layananId}/${fileType}.webp`;
    console.log('📍 UPLOAD LAYANAN: Storage path:', storagePath);
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    console.log('⬆️ UPLOAD LAYANAN: Uploading to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, webpBlob, {
      contentType: 'image/webp',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId,
        layananId: layananId,
        fileType: fileType
      }
    });
    
    console.log('✅ UPLOAD LAYANAN: Upload successful!');
    
    // Get download URL
    console.log('🔗 UPLOAD LAYANAN: Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ UPLOAD LAYANAN: Download URL obtained');
    console.log('🌐 URL:', downloadURL);
    
    return {
      success: true,
      downloadURL: downloadURL,
      path: storagePath
    };
  } catch (error: any) {
    console.error('💥 UPLOAD LAYANAN ERROR:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengupload foto. Silakan coba lagi.'
    };
  }
};

/**
 * Delete foto KK atau KTP dari Firebase Storage
 * @param userId - ID user
 * @param layananId - ID layanan publik
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ktp'
 * @returns Promise<boolean>
 */
export const deleteLayananPublikPhoto = async (
  userId: string,
  layananId: string,
  fileType: 'foto_kk' | 'foto_ktp'
): Promise<boolean> => {
  try {
    const storagePath = `layanan-publik/${userId}/${layananId}/${fileType}.webp`;
    const storageRef = ref(storage, storagePath);
    
    await deleteObject(storageRef);
    console.log('✅ UPLOAD LAYANAN: Photo deleted successfully');
    return true;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log('ℹ️ UPLOAD LAYANAN: Photo not found (already deleted or never existed)');
      return true;
    }
    console.error('💥 DELETE LAYANAN ERROR:', error);
    return false;
  }
};

/**
 * Get photo URL untuk layanan publik
 * @param userId - ID user
 * @param layananId - ID layanan publik
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ktp'
 * @returns Promise<string | null>
 */
export const getLayananPublikPhotoURL = async (
  userId: string,
  layananId: string,
  fileType: 'foto_kk' | 'foto_ktp'
): Promise<string | null> => {
  try {
    const storagePath = `layanan-publik/${userId}/${layananId}/${fileType}.webp`;
    const storageRef = ref(storage, storagePath);
    
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log('ℹ️ Photo not found:', fileType);
      return null;
    }
    console.error('💥 GET LAYANAN URL ERROR:', error);
    return null;
  }
};
