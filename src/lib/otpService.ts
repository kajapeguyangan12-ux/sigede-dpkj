// Service untuk mengelola OTP di Firestore
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface OTPData {
  email: string;
  otp: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * Generate OTP 6 digit random
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Simpan OTP ke Firestore dengan expiry 5 menit
 */
export async function saveOTPToFirestore(email: string, otp: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit dari sekarang
    
    await addDoc(collection(db, 'email_otps'), {
      email: email.toLowerCase(),
      otp,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt)
    });
    
    console.log('✅ OTP saved to Firestore:', { email, expiresAt });
    return true;
  } catch (error: any) {
    console.error('❌ Failed to save OTP to Firestore:', error);
    throw new Error(`Gagal menyimpan OTP: ${error.message}`);
  }
}

/**
 * Verify OTP dari Firestore
 */
export async function verifyOTPFromFirestore(email: string, inputOTP: string): Promise<{
  valid: boolean;
  message: string;
}> {
  try {
    const emailLower = email.toLowerCase();
    
    // Query OTP yang cocok dengan email dan OTP
    const q = query(
      collection(db, 'email_otps'),
      where('email', '==', emailLower),
      where('otp', '==', inputOTP)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ OTP not found for email:', emailLower);
      return {
        valid: false,
        message: 'Kode OTP salah atau tidak ditemukan'
      };
    }
    
    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data() as OTPData;
    
    // Cek apakah OTP sudah expired
    const now = new Date();
    const expiryDate = data.expiresAt.toDate();
    
    if (now > expiryDate) {
      console.log('❌ OTP expired:', { email: emailLower, expired: expiryDate });
      
      // Hapus OTP yang expired
      await deleteDoc(doc(db, 'email_otps', otpDoc.id));
      
      return {
        valid: false,
        message: 'Kode OTP sudah kadaluarsa. Silakan kirim ulang.'
      };
    }
    
    // OTP valid - hapus dari Firestore
    console.log('✅ OTP verified successfully for:', emailLower);
    await deleteDoc(doc(db, 'email_otps', otpDoc.id));
    
    return {
      valid: true,
      message: 'Email berhasil diverifikasi!'
    };
    
  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error);
    return {
      valid: false,
      message: `Terjadi kesalahan: ${error.message}`
    };
  }
}

/**
 * Hapus semua OTP yang expired (cleanup function)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const q = query(
      collection(db, 'email_otps'),
      where('expiresAt', '<', Timestamp.now())
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Cleaned up ${snapshot.size} expired OTPs`);
    return snapshot.size;
  } catch (error: any) {
    console.error('❌ Error cleaning up expired OTPs:', error);
    return 0;
  }
}

/**
 * Hapus OTP untuk email tertentu
 */
export async function deleteOTPForEmail(email: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'email_otps'),
      where('email', '==', email.toLowerCase())
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${snapshot.size} OTP(s) for email:`, email);
  } catch (error: any) {
    console.error('❌ Error deleting OTP:', error);
  }
}
