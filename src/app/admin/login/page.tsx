"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
// import UserLoginHelp from '../../../components/UserLoginHelp';
// import { FirestoreUser } from '../../../lib/userManagementService';

export default function AdminLogin() {
  const router = useRouter();
  const { login, loading, user, isAdmin } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check existing session once on mount
  React.useEffect(() => {
    console.log('🔍 Admin Login: Component mounted');
    
    // Clear any logout/redirect flags IMMEDIATELY
    sessionStorage.removeItem('auth_redirecting');
    sessionStorage.removeItem('admin_logout_in_progress');
    
    // If user just logged out, clear everything to prevent any error flash
    const isLoggedOut = sessionStorage.getItem('just_logged_out');
    if (isLoggedOut) {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Cleared session after logout');
    }
    
    // Layout will handle redirect if already authenticated
    // No need to check here
    
    // Clear any submission state on mount
    setIsSubmitting(false);
  }, []); // Run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setError('ID User dan Password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setError('');

    let loginTimeout: NodeJS.Timeout | null = null;

    try {
      console.log('🔐 ADMIN LOGIN: Attempting login with identifier:', identifier);
      
      // If there's an existing session, clear it first to allow switching accounts
      if (user) {
        console.log('🔄 Existing session detected, clearing session...');
        localStorage.clear();
        sessionStorage.clear();
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Create abort controller for timeout
      const abortController = new AbortController();
      
      // Add timeout to prevent infinite loading (30 seconds for slow connections)
      loginTimeout = setTimeout(() => {
        console.error('⏱️ Admin login timeout after 30 seconds');
        abortController.abort();
        setIsSubmitting(false);
        setError('Login timeout. Periksa koneksi internet dan coba lagi.');
      }, 30000);
      
      // Attempt login
      await login({
        userId: identifier,
        password: password
      });

      // Clear timeout if login completes
      if (loginTimeout) {
        clearTimeout(loginTimeout);
        loginTimeout = null;
      }

      // Check if user is admin after successful login
      const storedUser = localStorage.getItem('sigede_auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        console.log('👤 Admin user data loaded:', { role: userData.role, uid: userData.uid });
        
        // Validate user role - only admin roles can login here  
        if (!userData.role || !['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun', 'super_admin'].includes(userData.role)) {
          console.log('❌ Non-admin trying to login as admin');
          setError('Akses ditolak. Halaman ini hanya untuk Admin. Silakan login di halaman Masyarakat.');
          
          // Clear the login data
          localStorage.removeItem('sigede_auth_user');
          localStorage.removeItem('userId');
          setIsSubmitting(false);
          return;
        }
        
        // Admin login successful, redirect immediately
        console.log('✅ ADMIN LOGIN: Admin login successful, redirecting to admin home');
        
        // Use router.push instead of window.location for better UX
        router.push('/admin/home');
        
      } else {
        throw new Error('Session data not found after login');
      }
      
    } catch (error: any) {
      // Clear timeout on error
      if (loginTimeout) {
        clearTimeout(loginTimeout);
      }
      
      console.error('❌ ADMIN LOGIN: Login failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login gagal. Periksa kembali ID dan password Anda.';
      
      if (error.message?.includes('tidak ditemukan') || error.message?.includes('not found')) {
        errorMessage = 'User tidak ditemukan. Pastikan ID/Username sudah benar.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Periksa koneksi internet dan coba lagi.';
      } else if (error.message?.includes('Password salah')) {
        errorMessage = 'Password salah. Silakan coba lagi.';
      } else if (error.message?.includes('ditangguhkan')) {
        errorMessage = 'Akun ditangguhkan. Hubungi administrator.';
      } else if (error.message?.includes('tidak aktif')) {
        errorMessage = 'Akun tidak aktif. Hubungi administrator.';
      } else if (error.message?.includes('ditolak')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 to-white p-3 sm:p-4">
      <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl flex flex-col md:flex-row w-full max-w-3xl overflow-hidden">
        {/* Left Side - Mobile Optimized */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-red-400 to-red-200 flex flex-col items-center justify-center p-6 sm:p-8">
          <img src="/logo/LOGO_DPKJ.png" alt="Logo DPKJ" className="w-24 sm:w-32 md:w-40 mb-3 sm:mb-4 object-contain" />
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Dauh Puri Kaja</h2>
          <p className="text-white text-sm sm:text-base md:text-lg font-semibold text-center">Selamat Datang Di Aplikasi SIGEDE</p>
        </div>
        {/* Right Side - Mobile Optimized */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-8">
          <img src="/logo/Logo_BGD1.png" alt="Logo BGD" className="w-24 sm:w-32 md:w-40 mb-4 sm:mb-6 object-contain" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            Silakan Login Untuk Masuk Ke Sistem SI GEDE
          </h1>
          <form className="w-full flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Masukkan ID User / Email / Username"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white text-sm sm:text-base text-gray-800 placeholder-gray-500 placeholder-opacity-100 transition-all"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              disabled={isSubmitting || loading}
            />
            <input
              type="password"
              placeholder="Masukkan Password"
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white text-sm sm:text-base text-gray-800 placeholder-gray-500 placeholder-opacity-100 transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSubmitting || loading}
            />
            {error && (
              <div className="text-red-600 text-xs sm:text-sm text-center bg-red-50 p-2.5 sm:p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {user && !isAdmin && (
              <div className="text-blue-600 text-xs sm:text-sm text-center bg-blue-50 p-2.5 sm:p-3 rounded-lg border border-blue-200">
                Anda login sebagai: {user.displayName} ({user.role})
              </div>
            )}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all relative text-sm sm:text-base"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  MEMPROSES...
                </span>
              ) : 'LOGIN'}
            </button>
            
            {/* Link to Masyarakat Login */}
            <div className="text-center">
              <a 
                href="/masyarakat/login" 
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Bukan Admin? Login sebagai Masyarakat
              </a>
            </div>
            
            {/* Development Helper - Disabled for production security */}
            {/* <UserLoginHelp 
              onUserSelect={(user: FirestoreUser) => {
                setIdentifier(user.uid);
                setPassword('temp123'); // Placeholder password
              }}
            /> */}
          </form>
        </div>
      </div>
    </div>
  );
}
