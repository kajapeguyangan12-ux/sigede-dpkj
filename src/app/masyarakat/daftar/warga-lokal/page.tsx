"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import userManagementService from '../../../../lib/userManagementService';
import { getDataDesa, DataDesaItem } from '../../../../lib/dataDesaService';

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

export default function WargaLokalRegisterPage() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    nik: '',
    alamat: '',
    daerah: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    agama: '',
    pekerjaan: '',
    statusKawin: '',
    kewarganegaraan: 'WNI',
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
  const [nikVerified, setNikVerified] = useState(false);
  const [nikChecking, setNikChecking] = useState(false);
  const [nikMessage, setNikMessage] = useState('');
  const [verifiedData, setVerifiedData] = useState<DataDesaItem | null>(null);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields (NIK and No KK)
    if (name === 'nik' || name === 'noKK') {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    
    // Reset NIK verification when NIK changes
    if (name === 'nik') {
      setNikVerified(false);
      setNikMessage('');
      setVerifiedData(null);
    }
  };

  // Check NIK against data-desa
  const handleCheckNIK = async () => {
    console.log('🔍 NIK CHECK: Starting NIK verification...');
    
    // Validate NIK format first
    if (!formData.nik || formData.nik.length !== 16) {
      setNikMessage('❌ NIK harus 16 digit');
      setNikVerified(false);
      return;
    }
    
    setNikChecking(true);
    setNikMessage('');
    setError('');
    
    try {
      console.log('📡 NIK CHECK: Fetching data-desa...');
      const dataWarga = await getDataDesa();
      console.log('📊 NIK CHECK: Total data:', dataWarga.length);
      
      // Find matching NIK
      const matchedData = dataWarga.find(item => item.nik === formData.nik);
      
      if (matchedData) {
        console.log('✅ NIK CHECK: NIK valid and found in data-desa');
        setNikVerified(true);
        setVerifiedData(matchedData);
        setNikMessage(`✅ NIK valid! Anda dapat melanjutkan registrasi.`);
        
        // Auto-fill daerah from matched data
        if (matchedData.daerah) {
          setFormData(prev => ({
            ...prev,
            daerah: matchedData.daerah || ''
          }));
          console.log('📍 Auto-filled daerah:', matchedData.daerah);
        }
      } else {
        console.log('❌ NIK CHECK: NIK not found in data-desa');
        setNikVerified(false);
        setVerifiedData(null);
        setNikMessage('❌ NIK tidak terdaftar di data desa. Silakan hubungi admin desa.');
        setError('NIK tidak ditemukan dalam database penduduk desa.');
      }
    } catch (error: any) {
      console.error('💥 NIK CHECK ERROR:', error);
      setNikMessage('❌ Gagal memeriksa NIK. Silakan coba lagi.');
      setError(`Terjadi kesalahan: ${error.message}`);
      setNikVerified(false);
    } finally {
      setNikChecking(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    console.log('🔍 VALIDATION: Starting form validation...');
    
    // Check NIK verification first
    if (!nikVerified) {
      console.log('❌ VALIDATION: NIK not verified');
      setError('Silakan lakukan verifikasi NIK terlebih dahulu dengan klik tombol "Cek NIK"');
      return false;
    }
    console.log('✅ VALIDATION: NIK verified');
    
    // Required fields (No KK removed)
    const requiredFields = ['namaLengkap', 'username', 'nik', 'alamat', 'tempatLahir', 'tanggalLahir', 
                           'jenisKelamin', 'agama', 'pekerjaan', 'statusKawin', 'noTelp', 'email', 'password'];
    
    for (const field of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (!value) {
        console.log(`❌ VALIDATION: Missing required field: ${field}`);
        setError(`Field ${field} wajib diisi`);
        return false;
      }
    }
    console.log('✅ VALIDATION: All required fields filled');

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log('❌ VALIDATION: Invalid email format:', formData.email);
      setError('Format email tidak valid');
      return false;
    }
    console.log('✅ VALIDATION: Email format valid');

    // NIK validation (16 digits)
    console.log('🔍 VALIDATION: Checking NIK:', formData.nik, 'Length:', formData.nik.length);
    if (formData.nik.length !== 16 || !/^\d+$/.test(formData.nik)) {
      console.log('❌ VALIDATION: NIK invalid - Length:', formData.nik.length, 'Is numeric:', /^\d+$/.test(formData.nik));
      setError('NIK harus terdiri dari 16 digit angka');
      return false;
    }
    console.log('✅ VALIDATION: NIK valid');

    // Password validation
    if (formData.password.length < 6) {
      console.log('❌ VALIDATION: Password too short:', formData.password.length);
      setError('Password minimal 6 karakter');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      console.log('❌ VALIDATION: Password mismatch');
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    console.log('✅ VALIDATION: Password valid');

    console.log('🎉 VALIDATION: All validations passed!');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 FORM: Submit button clicked');
    console.log('📝 FORM: Form data:', { ...formData, password: '***', confirmPassword: '***' });
    
    if (!validateForm()) {
      console.log('❌ FORM: Validation failed');
      return;
    }
    
    console.log('✅ FORM: Validation passed, starting registration...');
    setLoading(true);
    setError('');
    
    try {
      console.log('📡 FORM: Calling registerMasyarakat service...');
      const result = await userManagementService.registerMasyarakat({
        username: formData.username,
        displayName: formData.namaLengkap,
        nik: formData.nik,
        alamat: formData.alamat,
        daerah: formData.daerah,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        jenisKelamin: formData.jenisKelamin,
        agama: formData.agama,
        pekerjaan: formData.pekerjaan,
        statusKawin: formData.statusKawin,
        kewarganegaraan: formData.kewarganegaraan,
        email: formData.email,
        phoneNumber: formData.noTelp,
        password: formData.password
      });
      
      console.log('📋 FORM: Registration result:', result);
      
      if (result.success) {
        console.log('🎉 FORM: Registration successful!');
        setSuccess(result.message);
        setTimeout(() => {
          console.log('🔄 FORM: Redirecting to login page...');
          router.push('/masyarakat/login');
        }, 2000);
      } else {
        console.log('❌ FORM: Registration failed:', result.message);
        setError(result.message);
      }
    } catch (error: any) {
      console.error('💥 FORM ERROR:', error);
      setError(`Terjadi kesalahan saat mendaftar: ${error.message || 'Silakan coba lagi.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
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
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">🏠</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent mb-4">
            Daftar Warga Lokal DPKJ
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Lengkapi data diri Anda sebagai warga Desa Dauh Puri Kaja untuk mendapatkan akses penuh ke layanan desa
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
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Formulir Registrasi Warga Lokal</h2>
              <p className="text-red-100 mt-2">Silakan lengkapi semua field berikut dengan benar</p>
            </div>

            <div className="px-8 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* NIK with Verification - PALING ATAS */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nik"
                    value={formData.nik}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-gray-900 placeholder-gray-500 ${
                      nikVerified
                        ? 'border-green-400 bg-green-50' 
                        : formData.nik && formData.nik.length === 16 
                        ? 'border-blue-400 focus:border-blue-400' 
                        : formData.nik && formData.nik.length > 0
                        ? 'border-orange-400 focus:border-orange-400'
                        : 'border-gray-200 focus:border-blue-400'
                    }`}
                    placeholder="Masukkan NIK 16 digit"
                    maxLength={16}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`${
                      nikVerified ? 'text-green-600 font-semibold' :
                      formData.nik.length === 16 ? 'text-red-600' : 
                      formData.nik.length > 0 ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {nikVerified ? '✓ NIK Valid & Terverifikasi' : `${formData.nik.length}/16 digit`}
                    </span>
                    {formData.nik.length === 16 && !nikVerified && (
                      <span className="text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Siap dicek
                      </span>
                    )}
                  </div>
                  
                  {/* Check NIK Button */}
                  <button
                    type="button"
                    onClick={handleCheckNIK}
                    disabled={!formData.nik || formData.nik.length !== 16 || nikChecking || nikVerified}
                    className={`mt-3 w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      nikVerified
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : formData.nik.length === 16
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {nikChecking ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memeriksa NIK...
                      </>
                    ) : nikVerified ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        NIK Terverifikasi
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cek NIK
                      </>
                    )}
                  </button>
                  
                  {/* NIK Message */}
                  {nikMessage && (
                    <div className={`mt-3 p-4 rounded-xl border ${
                      nikVerified 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}>
                      <div className="flex items-start gap-2">
                        {nikVerified ? (
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        <p className="text-sm font-medium">{nikMessage}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Nama lengkap sesuai KTP"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Username untuk login"
                    required
                  />
                </div>

                {/* Alamat */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Alamat lengkap sesuai KTP"
                    required
                  />
                </div>

                {/* Daerah (Auto-filled from NIK verification) */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Daerah/Banjar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="daerah"
                    value={formData.daerah}
                    disabled
                    className="w-full px-6 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-600 cursor-not-allowed"
                    placeholder="Otomatis terisi setelah cek NIK"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    * Daerah akan terisi otomatis setelah verifikasi NIK
                  </p>
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Tempat Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    value={formData.tempatLahir}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Tempat lahir"
                    required
                  />
                </div>

                {/* Tanggal Lahir - Auto-filled from NIK verification */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggalLahir"
                    value={formData.tanggalLahir}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 border bg-gray-50 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900"
                    required
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Agama */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Agama <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="agama"
                    value={formData.agama}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900"
                    required
                  >
                    <option value="">Pilih Agama</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Khonghucu">Khonghucu</option>
                    <option value="Katolik">Katolik</option>
                  </select>
                </div>

                {/* Pekerjaan */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Pekerjaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="Pekerjaan/profesi"
                    required
                  />
                </div>

                {/* Status Perkawinan */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Status Perkawinan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="statusKawin"
                    value={formData.statusKawin}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900"
                    required
                  >
                    <option value="">Pilih Status Perkawinan</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>

                {/* No Telepon */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    No. Telepon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="noTelp"
                    value={formData.noTelp}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="user@example.com"
                    required
                  />
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
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
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
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder-gray-500 pr-12"
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

              {/* Submit Button */}
              <div className="mt-12 flex flex-col items-center space-y-6">
                <button
                  type="submit"
                  disabled={loading || !nikVerified}
                  className={`w-full max-w-md px-8 py-4 font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 transform flex items-center justify-center gap-3 ${
                    nikVerified && !loading
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Mendaftar...</span>
                    </>
                  ) : !nikVerified ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Verifikasi NIK Terlebih Dahulu</span>
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
                
                {/* Info message when NIK not verified */}
                {!nikVerified && (
                  <div className="w-full max-w-md p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        <strong>Perhatian:</strong> Silakan verifikasi NIK Anda terlebih dahulu dengan mengklik tombol "Cek NIK" di atas. Pendaftaran hanya dapat dilakukan setelah NIK terverifikasi.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-4">
                  <Link 
                    href="/masyarakat/daftar" 
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-all duration-300 group"
                  >
                    <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span>Kembali ke Pilihan Pendaftaran</span>
                  </Link>
                  
                  <div className="text-sm text-gray-500">
                    Sudah punya akun? 
                    <Link href="/masyarakat/login" className="text-red-600 hover:text-red-700 font-medium ml-1">
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