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
    
    // Clear any logout/redirect flags
    sessionStorage.removeItem('auth_redirecting');
    sessionStorage.removeItem('admin_logout_in_progress');
    
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

    try {
      console.log('🔐 ADMIN LOGIN: Attempting login with identifier:', identifier);
      
      // Add timeout to prevent infinite loading
      const loginTimeout = setTimeout(() => {
        console.error('⏱️ Admin login timeout');
        setIsSubmitting(false);
        setError('Login timeout. Silakan coba lagi.');
      }, 15000); // 15 second timeout
      
      await login({
        userId: identifier,
        password: password
      });

      clearTimeout(loginTimeout);

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
          clearTimeout(loginTimeout);
          setIsSubmitting(false);
          return;
        }
        
        // Admin login successful, redirect immediately
        console.log('✅ ADMIN LOGIN: Admin login successful, redirecting to admin home');
        
        // Force immediate redirect to admin home
        setTimeout(() => {
          console.log('🔄 Redirecting to /admin/home');
          window.location.href = '/admin/home';
        }, 500); // Small delay to ensure state is updated
        
        setIsSubmitting(false);
      } else {
        clearTimeout(loginTimeout);
        throw new Error('Session data not found after login');
      }
      
    } catch (error: any) {
      console.error('❌ ADMIN LOGIN: Login failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login gagal. Periksa kembali ID dan password Anda.';
      
      if (error.message?.includes('tidak ditemukan')) {
        errorMessage = 'User tidak ditemukan. Pastikan ID/Username sudah benar.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Periksa koneksi internet dan coba lagi.';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 to-white">
      <div className="bg-white shadow-lg rounded-lg flex w-full max-w-3xl overflow-hidden">
        {/* Left Side */}
        <div className="w-1/2 bg-gradient-to-br from-red-400 to-red-200 flex flex-col items-center justify-center p-8">
          <img src="/logo/LOGO_DPKJ.png" alt="Logo DPKJ" className="w-40 mb-4 object-contain" />
          <h2 className="text-xl font-bold text-white mb-2">Dauh Puri Kaja</h2>
          <p className="text-white text-lg font-semibold">Selamat Datang Di Aplikasi SIGEDE</p>
        </div>
        {/* Right Side */}
        <div className="w-1/2 flex flex-col justify-center items-center p-8">
          <img src="/logo/Logo_BGD1.png" alt="Logo BGD" className="w-32 sm:w-40 mb-6 object-contain" />
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Silakan Login Untuk Masuk Ke Sistem SI GEDE
          </h1>
          <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Masukkan ID User / Email / Username"
              className="px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-gray-800 placeholder-gray-500 placeholder-opacity-100"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              disabled={isSubmitting || loading}
            />
            <input
              type="password"
              placeholder="Masukkan Password"
              className="px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-gray-800 placeholder-gray-500 placeholder-opacity-100"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSubmitting || loading}
            />
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            {user && !isAdmin && (
              <div className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded-md border border-blue-200">
                Anda login sebagai: {user.displayName} ({user.role})
              </div>
            )}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition-colors"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? 'MEMPROSES...' : 'LOGIN'}
            </button>
            
            {/* Link to Masyarakat Login */}
            <div className="text-center">
              <a 
                href="/masyarakat/login" 
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
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
