"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrentUser } from '../../masyarakat/lib/useCurrentUser';
import { handleAdminLogout } from '../../../lib/logoutHelper';

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-scaleIn {
    animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
`;

export default function SuperAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const [formData, setFormData] = useState({
    namaLengkap: '',
    roleUser: 'super_administrator',
    username: '',
    email: '',
    noTelepon: '',
    kataSandi: '',
    konfirmasiKataSandi: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Access Control: Hanya Super Admin dan Administrator yang boleh akses halaman ini
  useEffect(() => {
    if (currentUser && ['admin_desa', 'kepala_desa', 'kepala_dusun'].includes(currentUser.role)) {
      console.log('🚫 ACCESS DENIED: Role tidak dapat mengakses Super Admin panel:', currentUser.role);
      router.push('/admin/home');
      return;
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    await handleAdminLogout(logout);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createAdmin = async () => {
    // Validasi form
    if (!formData.namaLengkap || !formData.username || !formData.email || !formData.kataSandi) {
      setResult('❌ Semua field wajib harus diisi');
      return;
    }

    if (formData.kataSandi !== formData.konfirmasiKataSandi) {
      setResult('❌ Password dan konfirmasi password tidak sama');
      return;
    }

    if (formData.kataSandi.length < 6) {
      setResult('❌ Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      // Generate ID berdasarkan role
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      let adminId: string = '';
      let collection: string = '';
      let roleDisplay: string = '';
      let permissions: any = {};

      if (formData.roleUser === 'super_administrator') {
        adminId = `SUPER_${timestamp}_${randomNum}`;
        collection = 'Super_Admin';
        roleDisplay = 'Super Administrator';
        permissions = {
          fullAccess: true,
          canCreateAdmin: true,
          canDeleteData: true,
          canModifySystem: true,
          canAccessAllModules: true
        };
      } else if (formData.roleUser === 'administrator') {
        adminId = `ADMIN_${timestamp}_${randomNum}`;
        collection = 'Super_Admin';
        roleDisplay = 'Administrator';
        permissions = {
          fullAccess: true,
          canCreateAdmin: false,
          canDeleteData: true,
          canModifySystem: true,
          canAccessAllModules: true
        };
      } else if (formData.roleUser === 'admin_desa') {
        adminId = `ADMIN_DESA_${timestamp}_${randomNum}`;
        collection = 'Admin_Desa';
        roleDisplay = 'Admin Desa';
        permissions = {
          fullAccess: false,
          canCreateAdmin: false,
          canDeleteData: true,
          canModifySystem: false,
          canAccessAllModules: false,
          canAccessKelolapengguna: false,
          canAccessDataDesa: false
        };
      } else if (formData.roleUser === 'kepala_desa') {
        adminId = `KEPALA_DESA_${timestamp}_${randomNum}`;
        collection = 'Super_Admin';
        roleDisplay = 'Kepala Desa';
        permissions = {
          fullAccess: false,
          canCreateAdmin: false,
          canDeleteData: false,
          canModifySystem: false,
          canAccessAllModules: false,
          canAccessLayananPublik: true
        };
      } else if (formData.roleUser === 'kepala_dusun') {
        adminId = `KEPALA_DUSUN_${timestamp}_${randomNum}`;
        collection = 'Super_Admin';
        roleDisplay = 'Kepala Dusun';
        permissions = {
          fullAccess: false,
          canCreateAdmin: false,
          canDeleteData: false,
          canModifySystem: false,
          canAccessAllModules: false,
          canAccessLayananPublik: true,
          canAccessPengaduan: true
        };
      } else if (formData.roleUser === 'warga_dpkj') {
        adminId = `WARGA_DPKJ_${timestamp}_${randomNum}`;
        collection = 'masyarakat';
        roleDisplay = 'Warga DPKJ';
        permissions = {
          fullAccess: false,
          canAccessMasyarakatPanel: true,
          canAccessAllMasyarakatModules: true
        };
      } else if (formData.roleUser === 'warga_luar_dpkj') {
        adminId = `WARGA_LUAR_${timestamp}_${randomNum}`;
        collection = 'Warga_LuarDPKJ';
        roleDisplay = 'Warga Luar DPKJ';
        permissions = {
          fullAccess: false,
          canAccessMasyarakatPanel: true,
          canAccessLimitedMasyarakatModules: true
        };
      }

      // Save to appropriate Firestore collection
      await setDoc(doc(db, collection, adminId), {
        id: adminId,
        namaLengkap: formData.namaLengkap,
        roleUser: formData.roleUser,
        username: formData.username,
        email: formData.email,
        noTelepon: formData.noTelepon || '',
        kataSandi: formData.kataSandi, // In production, hash this
        role: formData.roleUser, // Use the exact role value for system consistency
        displayName: formData.namaLengkap,
        uid: adminId,
        permissions: permissions,
        createdAt: new Date(),
        status: 'active',
        createdBy: 'system'
      });

      setResult(`✅ ${roleDisplay} berhasil dibuat!\n\nID: ${adminId}\nNama: ${formData.namaLengkap}\nUsername: ${formData.username}\nEmail: ${formData.email}\nRole: ${roleDisplay}\n\nData berhasil disimpan di collection "${collection}"`);
      
      // Reset form
      setFormData({
        namaLengkap: '',
        roleUser: 'super_administrator',
        username: '',
        email: '',
        noTelepon: '',
        kataSandi: '',
        konfirmasiKataSandi: ''
      });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      setResult(`❌ Gagal membuat admin: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <style>{styles}</style>
      
      {/* Modern Background with Geometric Patterns */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 via-pink-400/15 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-red-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl"></div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Enhanced Header dengan Breadcrumb */}
          <div className="glass-effect rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 mb-8 sm:mb-10 animate-fadeInUp relative z-40">
            {/* Breadcrumb di dalam header */}
            <div className="mb-4 animate-fadeInUp">
              <nav className="flex items-center gap-2" aria-label="Breadcrumb">
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </button>
                
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  Super Administrator
                </span>
              </nav>
            </div>

            <AdminHeaderCard title="Super Administrator">
              <AdminHeaderSearchBar />
              <AdminHeaderAccount onLogout={handleLogout} />
            </AdminHeaderCard>
          </div>

          {/* Main Content Container */}
          <div className="max-w-4xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            
            {/* Premium Header Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-pink-600 to-purple-700 rounded-3xl p-8 mb-0 shadow-2xl">
              {/* Floating Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full blur-3xl -ml-14 -mb-14"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create Administrator</h2>
                  <p className="text-white/90 text-lg font-medium">Build new user profiles with appropriate roles and permissions</p>
                </div>
              </div>
              
              {/* Decorative Line */}
              <div className="absolute top-6 right-6 w-20 h-1.5 bg-white/40 rounded-full"></div>
            </div>

            {/* Premium Form Container */}
            <div className="glass-effect rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10 -mt-6 relative z-20">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Nama Lengkap */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Full Name
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Username */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    Username
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="Unique username"
                  />
                </div>

                {/* Role User */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    User Role
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <select
                    name="roleUser"
                    value={formData.roleUser}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300 group-hover:border-gray-300"
                  >
                    <option value="super_administrator">Super Administrator</option>
                    <option value="administrator">Administrator</option>
                    <option value="admin_desa">Admin Desa</option>
                    <option value="kepala_desa">Kepala Desa</option>
                    <option value="kepala_dusun">Kepala Dusun</option>
                    <option value="warga_dpkj">Warga DPKJ</option>
                    <option value="warga_luar_dpkj">Warga Luar DPKJ</option>
                  </select>
                </div>

                {/* No Telepon */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="noTelepon"
                    value={formData.noTelepon}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="08xxxxxxxxxx (e.g., 081234567890)"
                  />
                </div>

                {/* Email */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Email Address
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="user@example.com"
                  />
                </div>

                {/* Kata Sandi */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    Password
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="password"
                    name="kataSandi"
                    value={formData.kataSandi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-yellow-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                {/* Konfirmasi Kata Sandi */}
                <div className="group">
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Confirm Password
                    <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    type="password"
                    name="konfirmasiKataSandi"
                    value={formData.konfirmasiKataSandi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-gray-50/80 text-gray-800 font-medium placeholder-gray-400 focus:border-pink-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all duration-300 group-hover:border-gray-300"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {/* Premium Info Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Role Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-blue-900 mb-2 text-lg">Role Information</h4>
                      <p className="text-blue-700 font-medium leading-relaxed">Full access to all system features with complete permissions</p>
                    </div>
                  </div>
                </div>

                {/* Security Info Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-100 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-amber-900 mb-2 text-lg">Security Notice</h4>
                      <p className="text-amber-700 font-medium leading-relaxed">
                        {formData.roleUser === 'super_administrator' 
                          ? 'This will create a Super Administrator profile with full system access' 
                          : 'This will create an Admin Desa profile with limited access (excludes Kelola Pengguna and Data Desa)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Submit Button */}
              <div className="mt-10">
                <button
                  onClick={createAdmin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 via-pink-600 to-purple-700 hover:from-red-600 hover:via-pink-700 hover:to-purple-800 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 text-white py-5 px-8 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl disabled:shadow-lg transition-all duration-500 flex items-center justify-center gap-4 transform hover:scale-[1.02] hover:-translate-y-1 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating User...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Create New User
                    </>
                  )}
                </button>
              </div>

              {/* Enhanced Result Display */}
              {result && (
                <div className="mt-8 animate-scaleIn">
                  {result.includes('✅') ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <pre className="text-green-800 font-mono text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {result}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <pre className="text-red-800 font-mono text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {result}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}