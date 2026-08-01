"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../../lib/firebase';
import { UserRole } from '../../../masyarakat/lib/useCurrentUser';
import { roleDescriptions, getRoleTitle, getRoleDescription } from '../../../../lib/rolePermissions';
import userManagementService, { CreateUserData } from '../../../../lib/userManagementService';
import superAdminService, { CreateSuperAdminData } from '../../../../lib/superAdminService';
import adminUserService, { CreateAdminUserData } from '../../../../lib/adminUserService';
import { useCurrentUser } from '../../../masyarakat/lib/useCurrentUser';
import AdminRoleManager from './AdminRoleManager';
import { getDataDesa } from '../../../../lib/dataDesaService';

interface UserRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  fixedRole?: UserRole | 'masyarakat_dpkj' | 'masyarakat_luar_dpkj'; // Role yang tidak bisa diubah
}

export default function UserRegistrationForm({ onSuccess, onCancel, fixedRole }: UserRegistrationFormProps) {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  // Form state
  const [formData, setFormData] = useState({
    displayName: '',        // Nama
    role: (fixedRole || 'warga_dpkj') as UserRole,  // Role (locked if fixedRole provided)
    userName: '',           // User Name  
    phoneNumber: '',        // No. Telp
    email: '',             // Email
    password: '',          // Kata Sandi
    confirmPassword: '',   // Konfirmasi Kata Sandi
    idNumber: '',          // NIK untuk kepala desa dan kepala dusun
    daerah: ''             // Daerah (untuk Kepala Dusun)
  });
  
  const [daerahOptions, setDaerahOptions] = useState<string[]>([]);
  const [loadingDaerah, setLoadingDaerah] = useState(false);

  // Fetch daerah options from data-desa
  useEffect(() => {
    const fetchDaerahOptions = async () => {
      if (formData.role === 'kepala_dusun') {
        setLoadingDaerah(true);
        try {
          const dataWarga = await getDataDesa();
          const uniqueDaerah = [...new Set(dataWarga
            .map(item => {
              // Extract name from formats like "6 TARUNA SARI" or just "TARUNA SARI"
              if (item.daerah && item.daerah.includes(' ')) {
                const parts = item.daerah.split(' ');
                return parts.slice(1).join(' '); // Get name part only
              }
              return item.daerah;
            })
            .filter(daerah => daerah && daerah.trim() !== ''))]
            .sort();
          
          setDaerahOptions(uniqueDaerah as string[]);
          console.log('📍 Daerah options loaded:', uniqueDaerah);
        } catch (error) {
          console.error('Error fetching daerah:', error);
        } finally {
          setLoadingDaerah(false);
        }
      }
    };
    
    fetchDaerahOptions();
  }, [formData.role]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phoneNumber') {
      // Only allow numbers and + symbol, remove spaces and dashes
      const cleanValue = value.replace(/[^0-9+]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.displayName || !formData.role) {
      setError('Harap isi semua field yang wajib');
      return false;
    }
    
    // Validate daerah for Kepala Dusun
    if (formData.role === 'kepala_dusun' && !formData.daerah) {
      setError('Harap pilih daerah untuk Kepala Dusun');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }

    // Validate Indonesian phone number
    if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
      const phoneRegex = /^(08|628|\+628)[0-9]{8,12}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError('Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx (10-13 digit) atau +628xxxxxxxxx');
        return false;
      }
      
      // Additional length check
      const phoneLength = formData.phoneNumber.replace(/^\+/, '').length;
      if (phoneLength < 10 || phoneLength > 15) {
        setError('Nomor telepon harus 10-15 digit');
        return false;
      }
    }

    return true;
  };

  // Handle form submission - Simplified like super-admin page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log(' FORM: Submit started');
    console.log(' FORM: Form data:', formData);
    
    const formValid = validateForm();
    if (!formValid) {
      console.log(' FORM: Form validation failed');
      return;
    }
    
    // Set createdBy - use current user if available, otherwise 'system'
    const currentAuthUser = auth.currentUser;
    const createdBy = currentUser?.uid || currentAuthUser?.uid || 'system';
    console.log(' FORM: CreatedBy:', createdBy);

    console.log(' FORM: Setting loading state...');
    setLoading(true);
    setError('');

    try {
      console.log('🚀 FORM: Starting user creation process...');
      
      // Check if creating admin user (administrator, admin_desa, kepala_desa, kepala_dusun)
      const isAdminRole = ['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun'].includes(formData.role);
      
      if (isAdminRole) {
        console.log(`🔐 FORM: Creating admin user with role: ${formData.role}`);
        
        const adminUserData: CreateAdminUserData = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          userName: formData.userName || undefined,
          role: formData.role as 'administrator' | 'admin_desa' | 'kepala_desa' | 'kepala_dusun',
          phoneNumber: formData.phoneNumber || undefined,
          idNumber: formData.idNumber || undefined,
          nik: formData.idNumber || undefined, // Use idNumber as NIK for kepala desa/dusun
          daerah: formData.daerah || undefined, // Daerah untuk kepala dusun
          address: undefined,
          notes: undefined
        };

        console.log('📦 FORM: Admin user data prepared:', adminUserData);
        const result = await adminUserService.createAdminUser(adminUserData, createdBy);
        
        console.log('✅ FORM: Admin user created successfully!');
        console.log('🎉 FORM: Result:', result);
        
        // Determine collection name for display
        let collectionName = '';
        switch (formData.role) {
          case 'administrator':
            collectionName = 'Super_admin';
            break;
          case 'admin_desa':
            collectionName = 'Admin_Desa';
            break;
          case 'kepala_desa':
            collectionName = 'Kepala_Desa';
            break;
          case 'kepala_dusun':
            collectionName = 'Kepala_Dusun';
            break;
        }
        
        setSuccess(`✅ ${getRoleTitle(formData.role)} ${formData.displayName} berhasil dibuat!
        
📧 Email: ${formData.email}
🔑 Password: ${formData.password}
👤 Role: ${getRoleTitle(formData.role)}
${formData.daerah ? `📍 Daerah: ${formData.daerah}` : ''}
💾 Data tersimpan di: Firestore > ${collectionName} & users collection

⚠️ PENTING: Simpan informasi login ini untuk diberikan kepada ${getRoleTitle(formData.role).toLowerCase()} yang bersangkutan. User dapat langsung login dengan kredensial ini.`);
        
      } else {
        console.log('👤 FORM: Creating regular user...');
        
        const userData: CreateUserData = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          userName: formData.userName || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        };

        console.log('📦 FORM: UserData prepared:', userData);
        const result = await userManagementService.createUser(userData, createdBy);
        
        console.log('✅ FORM: User created successfully!');
        console.log('🎉 FORM: Result:', result);
        
        setSuccess(`✅ Profile user ${formData.displayName} berhasil dibuat dengan role ${getRoleTitle(formData.role)}!

⚠️ CATATAN: User ini dibuat sebagai profile saja. User perlu mendaftar sendiri dengan email ini untuk bisa login ke sistem.`);
      }
      
      // Reset form
      setFormData({
        displayName: '',
        role: 'warga_dpkj' as UserRole,
        userName: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        idNumber: '',
        daerah: ''
      });

      // Call success callback after longer delay to let admin read the message
      setTimeout(() => {
        onSuccess?.();
      }, 5000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat user');
    } finally {
      setLoading(false);
    }
  };

  // Available roles for registration (exclude unknown)
  const availableRoles: UserRole[] = [
    'super_admin',
    'administrator',
    'admin_desa', 
    'kepala_desa',
    'kepala_dusun',
    'warga_dpkj',
    'warga_luar_dpkj'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Navigation Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button - Professional Version */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="group flex items-center gap-3 px-4 py-2.5 bg-white/90 hover:bg-white border border-gray-200/80 hover:border-gray-300 rounded-xl text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="w-7 h-7 bg-gray-50 group-hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors duration-200">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Kembali</span>
                </button>
              )}
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Kelola Pengguna</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Registrasi User Baru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-800">Manajemen User</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                Registrasi User Baru
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Buat profile user baru dengan role dan permission yang sesuai untuk sistem SiGede DPKJ
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
                  <div className="text-sm text-green-800 whitespace-pre-line leading-relaxed">{success}</div>
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
                  <p className="text-sm text-red-800 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Quick Create (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-purple-800 mb-2">👑 Quick Super Admin Test (Dev Only)</h4>
            <button
              onClick={() => {
                setFormData({
                  displayName: 'Test Super Admin',
                  role: 'administrator' as UserRole,
                  userName: 'testsuperadmin',
                  phoneNumber: '081234567890',
                  email: 'testsuperadmin@dpkj.com',
                  password: 'admin123456',
                  confirmPassword: 'admin123456',
                  idNumber: '',
                  daerah: ''
                });
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Fill Test Data
            </button>
            <p className="text-xs text-purple-700 mt-2">
              Mengisi form dengan data test untuk Super Admin. Klik untuk auto-fill, lalu submit.
            </p>
          </div>
        )}

        {/* Admin Role Manager for Development */}
        <AdminRoleManager />

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Form Container with Professional Design */}
          <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden border border-gray-200/50 ring-1 ring-gray-900/5">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 px-8 py-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="relative flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Registrasi User Baru</h3>
                  <p className="text-red-100/90 text-sm leading-relaxed">Buat profile user baru dengan role dan permission yang sesuai</p>
                </div>
              </div>
            </div>

            {/* Form Fields Container */}
            <div className="px-8 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Nama - Full Width */}
                <div className="lg:col-span-2">
                  <label htmlFor="displayName" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Nama Lengkap <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    Role User <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={!!fixedRole}
                      className={`w-full px-6 py-4 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all duration-300 text-gray-900 appearance-none shadow-sm font-medium ${
                        fixedRole 
                          ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                          : 'bg-gray-50/80 focus:bg-white cursor-pointer hover:shadow-md'
                      }`}
                      required
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>
                          {getRoleTitle(role)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors pointer-events-none duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Fixed Role Info */}
                  {fixedRole && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-900 text-sm mb-1">
                            🔒 Role Terkunci
                          </h4>
                          <p className="text-xs text-blue-800">
                            Role otomatis disesuaikan dengan komponen <strong>{getRoleTitle(fixedRole as UserRole)}</strong> dan tidak dapat diubah.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Super Admin Info */}
                  {!fixedRole && (formData.role === 'administrator' || formData.role === 'admin_desa') && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-purple-900 text-sm mb-1">
                            👑 Mode Super Admin
                          </h4>
                          <div className="text-xs text-purple-800 space-y-1">
                            <div>✅ Dapat dibuat tanpa login terlebih dahulu</div>
                            <div>✅ Data akan tersimpan di collection Super_admin</div>
                            <div>✅ Langsung dapat login setelah dibuat</div>
                            <div>⚠️ Gunakan email dan password yang aman!</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Daerah - Only for Kepala Dusun */}
                {formData.role === 'kepala_dusun' && (
                  <div>
                    <label htmlFor="daerah" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      Daerah <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="daerah"
                        name="daerah"
                        value={formData.daerah}
                        onChange={handleInputChange}
                        disabled={loadingDaerah}
                        className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white transition-all duration-300 text-gray-900 shadow-sm hover:shadow-md font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                        required
                      >
                        <option value="">
                          {loadingDaerah ? 'Memuat daerah...' : 'Pilih Daerah'}
                        </option>
                        {daerahOptions.map((daerah) => (
                          <option key={daerah} value={daerah}>
                            {daerah}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-orange-400 pointer-events-none">
                        {loadingDaerah ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-orange-800">
                          <strong>Info:</strong> Kepala Dusun bertanggung jawab atas daerah tertentu. Pilih daerah yang sesuai dari data penduduk desa.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Name */}
                <div>
                  <label htmlFor="userName" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Username
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="userName"
                      name="userName"
                      value={formData.userName}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="Username unik"
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    Email <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="user@example.com"
                      required
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* No. Telp */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    No. Telepon
                  </label>
                  <div className="relative group">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      pattern="^(08|628|\+628)[0-9]{8,12}$"
                      minLength={10}
                      maxLength={15}
                      title="Format nomor telepon: 08xxxxxxxxxx (10-13 digit) atau +628xxxxxxxxx"
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="08xxxxxxxxxx (contoh: 081234567890)"
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* NIK/ID Number - Only for Kepala Desa and Kepala Dusun */}
                {(formData.role === 'kepala_desa' || formData.role === 'kepala_dusun') && (
                  <div>
                    <label htmlFor="idNumber" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      NIK <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        id="idNumber"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        pattern="[0-9]{16}"
                        maxLength={16}
                        minLength={16}
                        title="NIK harus 16 digit angka"
                        className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                        placeholder="1234567890123456 (16 digit)"
                        required
                      />
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-indigo-800">
                          <strong>Info:</strong> NIK (Nomor Induk Kependudukan) 16 digit diperlukan untuk {getRoleTitle(formData.role)}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kata Sandi */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    Kata Sandi <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Konfirmasi Kata Sandi <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="password"
                      id="confirmPassword" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="Ulangi kata sandi"
                      required
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Description */}
              {formData.role && (
                <div className="lg:col-span-2 mt-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-3xl shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900 mb-2 text-lg">Informasi Role</h4>
                        <p className="text-blue-800 leading-relaxed font-medium">
                          {getRoleDescription(formData.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-lg">
            <div className="flex justify-center mb-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-pink-600 hover:from-red-600 hover:via-red-700 hover:to-pink-700 text-white py-5 px-12 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl focus:ring-4 focus:ring-red-500/25 transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none min-w-[280px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold">Membuat User...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <span className="font-bold text-xl">Buat User Baru</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            
            {/* Helper Text */}
            <div className="flex items-start gap-3 p-4 bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-200/50">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h5 className="font-bold text-blue-900 mb-1">Informasi Penting</h5>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Ini akan membuat profile user di sistem. User masih perlu mendaftar sendiri dengan email ini untuk bisa login ke sistem.
                </p>
              </div>
            </div>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}