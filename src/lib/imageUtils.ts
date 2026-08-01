/**
 * Image Utilities
 * Fungsi untuk konversi dan kompresi gambar ke format WebP
 */

/**
 * Convert image file to WebP format
 * @param file - File gambar original
 * @param quality - Kualitas kompresi (0-1), default 0.8
 * @returns Promise<Blob> - Blob WebP yang sudah dikompress
 */
export const convertImageToWebP = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Set canvas size (max width/height 1920px untuk menghemat storage)
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('✅ Image converted to WebP');
              console.log('📊 Original size:', (file.size / 1024).toFixed(2), 'KB');
              console.log('📊 WebP size:', (blob.size / 1024).toFixed(2), 'KB');
              console.log('💾 Compression ratio:', ((1 - blob.size / file.size) * 100).toFixed(1), '%');
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB, default 5MB
 * @returns Object with isValid and error message
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'
    };
  }
  
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.`
    };
  }
  
  return { isValid: true };
};

/**
 * Create preview URL from file
 * @param file - File to create preview
 * @returns Preview URL
 */
export const createPreviewURL = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke preview URL to free memory
 * @param url - URL to revoke
 */
export const revokePreviewURL = (url: string): void => {
  URL.revokeObjectURL(url);
};
