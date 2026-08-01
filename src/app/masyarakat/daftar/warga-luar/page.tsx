"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import userManagementService from '../../../../lib/userManagementService';

// Custom SVG icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Logo paths
const DesaLogo = "/logo/LOGO_DPKJ.png";

export default function WargaLuarRegisterPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    noTelp: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  // Validate form
  const validateForm = (): boolean => {
    // Required fields
    const requiredFields = ['username', 'noTelp', 'email', 'password'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setError('Harap isi semua field yang wajib');
        return false;
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }

    // Phone number validation
    if (!/^08[0-9]{8,11}$/.test(formData.noTelp)) {
      setError('Nomor telepon harus dimulai dengan 08 dan memiliki 10-13 digit');
      return false;
    }

    // Username validation
    if (formData.username.length < 3) {
      setError('Username minimal 3 karakter');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await userManagementService.registerWargaLuar({
        username: formData.username,
        phoneNumber: formData.noTelp,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push('/masyarakat/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Image
                src={DesaLogo}
                alt="Logo Desa"
                width={80}
                height={80}
                className="rounded-2xl shadow-xl border-4 border-white"
                priority
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">🌍</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 bg-clip-text text-transparent mb-4">
            Daftar Warga Luar DPKJ
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Daftar untuk mendapatkan akses ke informasi E-News, UMKM, dan Wisata Budaya Desa Dauh Puri Kaja
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-8 mx-auto max-w-2xl">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-lg mb-2">Berhasil!</h4>
                  <div className="text-sm text-green-800">{success}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 mx-auto max-w-2xl">
            <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-lg mb-2">Terjadi Kesalahan</h4>
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Formulir Registrasi Warga Luar</h2>
              <p className="text-emerald-100 mt-2">Isi data berikut untuk mendaftar sebagai warga luar DPKJ</p>
            </div>

            <div className="px-8 py-10">
              <div className="space-y-6">
                
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
                      placeholder="Username unik untuk login"
                      required
                      minLength={3}
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* No Telepon */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="noTelp"
                      value={formData.noTelp}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
                      placeholder="08xxxxxxxxxx"
                      pattern="08[0-9]{8,11}"
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
                      placeholder="user@example.com"
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
                      placeholder="Ulangi password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Access Information */}
              <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Akses yang Akan Anda Dapatkan
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm text-emerald-800">📰 <strong>E-News</strong> - Berita terkini dari desa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm text-emerald-800">🏪 <strong>E-UMKM</strong> - Informasi UMKM lokal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm text-emerald-800">🏛️ <strong>Wisata Budaya</strong> - Destinasi wisata dan budaya</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm text-emerald-800">ℹ️ <strong>Profil Desa</strong> - Informasi umum desa</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-12 flex flex-col items-center space-y-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Mendaftar...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Sekarang</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="text-center space-y-4">
                  <Link 
                    href="/masyarakat/daftar" 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium transition-all duration-300 group"
                  >
                    <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span>Kembali ke Pilihan Pendaftaran</span>
                  </Link>
                  
                  <div className="text-sm text-gray-500">
                    Sudah punya akun? 
                    <Link href="/masyarakat/login" className="text-emerald-600 hover:text-emerald-700 font-medium ml-1">
                      Login di sini
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            ©Copyright BaliGerbangDigital 2024
          </p>
        </div>
      </div>
    </main>
  );
}