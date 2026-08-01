import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { convertImageToWebP } from './imageUtils';

/**
 * Upload popup iklan image to Firebase Storage with WebP conversion
 */
export async function uploadPopupIklan(file: File): Promise<string> {
  try {
    console.log('📸 POPUP IKLAN: Starting upload process');
    console.log('📊 Original file:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });

    // Convert to WebP (quality 85%)
    const webpBlob = await convertImageToWebP(file, 0.85);
    
    console.log('✅ Converted to WebP:', {
      size: `${(webpBlob.size / 1024).toFixed(2)} KB`,
      compression: `${((1 - webpBlob.size / file.size) * 100).toFixed(1)}%`
    });

    // Upload to Storage with fixed path: popup_iklan/popup_iklan.webp
    const storagePath = 'popup_iklan/popup_iklan.webp';
    const storageRef = ref(storage, storagePath);

    // Upload with metadata
    await uploadBytes(storageRef, webpBlob, {
      contentType: 'image/webp',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ POPUP IKLAN: Upload successful');
    console.log('📍 Storage path:', storagePath);
    console.log('🔗 Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ POPUP IKLAN: Upload failed:', error);
    throw new Error(`Failed to upload popup iklan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get popup iklan download URL
 */
export async function getPopupIklanURL(): Promise<string | null> {
  try {
    const storagePath = 'popup_iklan/popup_iklan.webp';
    const storageRef = ref(storage, storagePath);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    // File doesn't exist or other error
    console.log('ℹ️ POPUP IKLAN: No popup image found');
    return null;
  }
}

/**
 * Delete popup iklan image
 */
export async function deletePopupIklan(): Promise<void> {
  try {
    const storagePath = 'popup_iklan/popup_iklan.webp';
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('✅ POPUP IKLAN: Image deleted successfully');
  } catch (error) {
    console.error('❌ POPUP IKLAN: Delete failed:', error);
    throw new Error(`Failed to delete popup iklan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
