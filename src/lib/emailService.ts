// Email service untuk mengirim OTP
// Menggunakan API endpoint untuk mengirim email

interface OTPData {
  email: string;
  otp: string;
  expiresAt: number;
}

// Generate OTP 6 digit
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simpan OTP ke localStorage dengan expiry (5 menit)
export function storeOTP(email: string, otp: string): void {
  const otpData: OTPData = {
    email,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 menit
  };
  localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
}

// Verifikasi OTP
export function verifyOTP(email: string, inputOTP: string): { success: boolean; message: string } {
  const storedData = localStorage.getItem(`otp_${email}`);
  
  if (!storedData) {
    return { success: false, message: 'OTP tidak ditemukan atau sudah expired' };
  }
  
  const otpData: OTPData = JSON.parse(storedData);
  
  // Cek apakah OTP expired
  if (Date.now() > otpData.expiresAt) {
    localStorage.removeItem(`otp_${email}`);
    return { success: false, message: 'OTP sudah expired. Silakan request OTP baru' };
  }
  
  // Cek apakah OTP cocok
  if (otpData.otp !== inputOTP) {
    return { success: false, message: 'OTP tidak valid' };
  }
  
  // OTP valid
  localStorage.removeItem(`otp_${email}`);
  return { success: true, message: 'Email berhasil diverifikasi' };
}

// Kirim OTP ke email menggunakan API
export async function sendOTPEmail(email: string, name: string): Promise<{ success: boolean; message: string; devMode?: boolean }> {
  try {
    const otp = generateOTP();
    
    console.log('========================================');
    console.log('📧 CLIENT: Requesting OTP email');
    console.log('========================================');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('========================================');
    
    // Call API endpoint untuk kirim email
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        otp
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send OTP email');
    }
    
    // Simpan OTP ke localStorage
    storeOTP(email, otp);
    
    console.log('✅ OTP request completed');
    
    // Check if it's development mode
    if (result.dev_mode) {
      console.log('========================================');
      console.log('🔧 DEVELOPMENT MODE');
      console.log('========================================');
      console.log('⚠️ Email credentials not configured');
      console.log('📝 Check SERVER TERMINAL for OTP code');
      console.log('📝 Or check Network tab in DevTools');
      console.log('🔑 OTP Code:', otp);
      console.log('========================================');
      
      return {
        success: true,
        message: result.message,
        devMode: true
      };
    }
    
    return {
      success: true,
      message: result.message || 'OTP telah dikirim ke email Anda'
    };
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error);
    return {
      success: false,
      message: error.message || 'Gagal mengirim OTP. Silakan coba lagi.'
    };
  }
}

// Cek apakah email sudah terverifikasi (untuk dev purposes)
export function isEmailVerified(email: string): boolean {
  const verifiedKey = `email_verified_${email}`;
  return localStorage.getItem(verifiedKey) === 'true';
}

// Tandai email sebagai terverifikasi
export function markEmailAsVerified(email: string): void {
  const verifiedKey = `email_verified_${email}`;
  localStorage.setItem(verifiedKey, 'true');
}

// Hapus status verifikasi email
export function clearEmailVerification(email: string): void {
  const verifiedKey = `email_verified_${email}`;
  localStorage.removeItem(verifiedKey);
  localStorage.removeItem(`otp_${email}`);
}
