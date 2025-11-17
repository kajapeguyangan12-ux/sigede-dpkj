import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
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
 * Upload foto KK, Ijazah, atau Foto Profil ke Firebase Storage
 * @param file - File gambar yang akan diupload
 * @param userId - ID user (untuk folder path)
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
 * @returns Promise<UploadResult>
 */
export const uploadKependudukanPhoto = async (
  file: File,
  userId: string,
  fileType: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
): Promise<UploadResult> => {
  try {
    console.log('🚀 UPLOAD: Starting upload process...');
    console.log('📁 File type:', fileType);
    console.log('👤 User ID:', userId);
    console.log('📄 Original file:', file.name, '-', (file.size / 1024).toFixed(2), 'KB');

    // Validate file
    const validation = validateImageFile(file, 5); // Max 5MB
    if (!validation.isValid) {
      console.log('❌ UPLOAD: Validation failed -', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }
    console.log('✅ UPLOAD: File validation passed');

    // Convert to WebP
    console.log('🔄 UPLOAD: Converting to WebP...');
    const webpBlob = await convertImageToWebP(file, 0.85); // 85% quality
    
    // Create storage path: Data_Diri_Kependudukan/{userId}/{fileType}.webp
    const storagePath = `Data_Diri_Kependudukan/${userId}/${fileType}.webp`;
    console.log('📍 UPLOAD: Storage path:', storagePath);
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    console.log('⬆️ UPLOAD: Uploading to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, webpBlob, {
      contentType: 'image/webp',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId,
        fileType: fileType
      }
    });
    
    console.log('✅ UPLOAD: Upload successful!');
    
    // Get download URL
    console.log('🔗 UPLOAD: Getting download URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ UPLOAD: Download URL obtained');
    console.log('🌐 URL:', downloadURL);
    
    return {
      success: true,
      downloadURL: downloadURL,
      path: storagePath
    };
  } catch (error: any) {
    console.error('💥 UPLOAD ERROR:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengupload foto. Silakan coba lagi.'
    };
  }
};

/**
 * Delete foto KK, Ijazah, atau Foto Profil dari Firebase Storage
 * @param userId - ID user
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
 * @returns Promise<boolean>
 */
export const deleteKependudukanPhoto = async (
  userId: string,
  fileType: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
): Promise<boolean> => {
  try {
    console.log('🗑️ DELETE: Deleting photo...');
    console.log('📁 File type:', fileType);
    console.log('👤 User ID:', userId);
    
    const storagePath = `Data_Diri_Kependudukan/${userId}/${fileType}.webp`;
    const storageRef = ref(storage, storagePath);
    
    await deleteObject(storageRef);
    console.log('✅ DELETE: Photo deleted successfully');
    
    return true;
  } catch (error: any) {
    console.error('💥 DELETE ERROR:', error);
    // If file doesn't exist, consider it a success
    if (error.code === 'storage/object-not-found') {
      console.log('ℹ️ DELETE: File not found (already deleted)');
      return true;
    }
    return false;
  }
};

/**
 * Get download URL untuk foto yang sudah diupload
 * @param userId - ID user
 * @param fileType - Tipe file: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
 * @returns Promise<string | null>
 */
export const getKependudukanPhotoURL = async (
  userId: string,
  fileType: 'foto_kk' | 'foto_ijazah' | 'foto_profil'
): Promise<string | null> => {
  try {
    const storagePath = `Data_Diri_Kependudukan/${userId}/${fileType}.webp`;
    const storageRef = ref(storage, storagePath);
    
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log('ℹ️ Photo not found:', fileType);
      return null;
    }
    console.error('💥 GET URL ERROR:', error);
    return null;
  }
};

/**
 * List all photos untuk user tertentu
 * @param userId - ID user
 * @returns Promise<string[]> - Array of file names
 */
export const listUserKependudukanPhotos = async (userId: string): Promise<string[]> => {
  try {
    const folderPath = `Data_Diri_Kependudukan/${userId}`;
    const folderRef = ref(storage, folderPath);
    
    const result = await listAll(folderRef);
    const fileNames = result.items.map(item => item.name);
    
    console.log('📂 User photos:', fileNames);
    return fileNames;
  } catch (error: any) {
    console.error('💥 LIST ERROR:', error);
    return [];
  }
};
