"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import { RoleCardType } from './components/RoleCard';
import UserListNew from './components/UserListNew';
import AdminLayout from '../components/AdminLayout';
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";
import { UserRole } from '../../masyarakat/lib/useCurrentUser';
import { roleDescriptions } from '../../../lib/rolePermissions';
import { useCurrentUser } from '../../masyarakat/lib/useCurrentUser';
import { userManagementService } from '../../../lib/userManagementService';

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
      transform: scale(0.95);
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

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-scaleIn {
    animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2.5s infinite;
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  .animate-gradient {
    background-size: 400% 400%;
    animation: gradient-shift 6s ease infinite;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .glass-effect-dark {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tooltip-container {
    position: relative;
    z-index: 9999 !important;
  }

  .tooltip-content {
    position: absolute !important;
    z-index: 9999 !important;
    top: calc(100% + 12px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
    width: 300px;
    max-width: 320px;
  }

  .tooltip-container {
    position: relative !important;
    z-index: 9999 !important;
  }

  .tooltip-container:hover .tooltip-content {
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto;
  }

  .tooltip-box {
    background: white;
    border-radius: 12px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(229, 231, 235, 1);
    padding: 16px;
    min-width: 280px;
    max-width: 320px;
    position: relative;
    z-index: 9999 !important;
  }

  .tooltip-arrow {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid white;
    filter: drop-shadow(0 -1px 2px rgba(0, 0, 0, 0.1));
    z-index: 10000;
  }

  .card-hover-effect {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .card-hover-effect:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }

  .text-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .btn-modern {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-modern::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .btn-modern:hover::before {
    left: 100%;
  }

  .pattern-dots {
    background-image: radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .pattern-grid {
    background-image: 
      linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
    background-size: 30px 30px;
  }
`;

const roleCards: RoleCardType[] = [
  { 
    id: 'super_admin', 
    title: 'Super Administrator', 
    description: 'Akses penuh sistem dengan wewenang tertinggi untuk mengelola seluruh aspek aplikasi', 
    icon: '👑'
  },
  { 
    id: 'admin_desa', 
    title: 'Admin Desa', 
    description: 'Akses administratif meliputi manajemen konten dan layanan publik kecuali manajemen pengguna', 
    icon: '🏛️'
  },
  { 
    id: 'kepala_desa', 
    title: 'Kepala Desa', 
    description: 'Akses data desa, layanan publik, dan halaman komunitas dengan wewenang kepala desa', 
    icon: '👔'
  },
  { 
    id: 'kepala_dusun', 
    title: 'Kepala Dusun', 
    description: 'Akses pengaduan, layanan publik, dan halaman komunitas tingkat dusun', 
    icon: '🏘️'
  },
  { 
    id: 'masyarakat_dpkj', 
    title: 'Data Masyarakat DPKJ', 
    description: 'Lihat data lengkap masyarakat DPKJ dari koleksi masyarakat', 
    icon: '👥'
  },
  { 
    id: 'masyarakat_luar_dpkj', 
    title: 'Data Masyarakat Luar DPKJ', 
    description: 'Lihat data lengkap masyarakat luar DPKJ dari koleksi Warga_LuarDPKJ', 
    icon: '🌐'
  },
];

export default function KelolapengggunaAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const [listRole, setListRole] = useState<RoleCardType | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false); // Faster initial render
  const [userBreakdown, setUserBreakdown] = useState<{[key: string]: number}>({});

  // Access Control: Admin Desa tidak boleh akses halaman ini
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin_desa') {
      console.log('🚫 ACCESS DENIED: Admin Desa tidak dapat mengakses Kelola Pengguna');
      router.push('/admin/home');
      return;
    }
  }, [currentUser, router]);

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setIsLoadingStats(true);
        let total = 0;
        const breakdown: {[key: string]: number} = {};
        
        // Count users from each collection
        const masyarakatUsers = await userManagementService.getUsersByCollection('masyarakat');
        const wargaLuarUsers = await userManagementService.getUsersByCollection('Warga_LuarDPKJ');
        const superAdminUsers = await userManagementService.getUsersByCollection('Super_Admin');
        
        // Count users by roles
        const adminUsers = await userManagementService.getUsersByRole('admin_desa');
        const kepalaDesaUsers = await userManagementService.getUsersByRole('kepala_desa');
        const kepalaDusunUsers = await userManagementService.getUsersByRole('kepala_dusun');
        
        // Set breakdown data
        breakdown['Super Administrator'] = superAdminUsers.length;
        breakdown['Admin Desa'] = adminUsers.length;
        breakdown['Kepala Desa'] = kepalaDesaUsers.length;
        breakdown['Kepala Dusun'] = kepalaDusunUsers.length;
        breakdown['Data Masyarakat DPKJ'] = masyarakatUsers.length;
        breakdown['Data Masyarakat Luar DPKJ'] = wargaLuarUsers.length;
        
        total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
        
        setTotalUsers(total);
        setUserBreakdown(breakdown);
      } catch (error) {
        console.error('Error loading user statistics:', error);
        setTotalUsers(0);
        setUserBreakdown({});
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadUserStats();
  }, []);

  return (
    <AdminLayout>
      <style>{styles}</style>
      
      {/* Modern Background with Enhanced Geometric Patterns */}
      <div className="min-h-screen relative overflow-hidden">
        {/* Primary Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60"></div>
        
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute -top-48 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-48 w-[700px] h-[700px] bg-gradient-to-br from-blue-400/15 via-indigo-400/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/12 via-green-400/8 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          
          {/* Enhanced Grid Pattern */}
          <div className="absolute inset-0 pattern-grid opacity-30"></div>
          
          {/* Dots Pattern Overlay */}
          <div className="absolute inset-0 pattern-dots opacity-20"></div>
          
          {/* Gradient Mesh */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Enhanced Header */}
          <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 mb-8 sm:mb-10 animate-fadeInUp relative z-40 overflow-visible">
            {/* Header Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-t-3xl"></div>
            
            {/* Floating Background Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-indigo-400/5 to-cyan-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

            {/* Enhanced AdminHeaderCard with better styling */}
            <div className="w-full bg-gradient-to-r from-white via-purple-50/30 to-blue-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
              {/* Enhanced Title Section */}
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-purple-800 to-blue-800 bg-clip-text text-transparent mb-2">
                    Kelola Pengguna
                  </h1>
                  <p className="text-slate-600 font-medium text-lg">
                    Manajemen pengguna dan role sistem
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      {roleCards.length} Total Pengguna
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Role Aktif
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Controls Section */}
              <div className="flex items-center gap-6 relative z-10">
                {/* Enhanced Search Bar */}
                <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-purple-400 hover:shadow-lg transition-all duration-300 group">
                  <input
                    type="text"
                    placeholder="Cari pengguna berdasarkan nama atau email..."
                    className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
                  />
                  <svg
                    className="ml-3 text-gray-400 group-hover:text-purple-500 transition-colors duration-300"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                
                {/* Enhanced Account Section */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-purple-50 hover:to-purple-100 transition-all duration-300 cursor-pointer shadow-md">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className="text-gray-600"
                    >
                      <path d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5h2A5.5 5.5 0 0110 10z"/>
                    </svg>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg group"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      className="text-red-600 group-hover:text-red-700"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Statistics Bar in Header */}
            <div className="mt-6 pt-6 pb-6 border-t border-gray-200/50 relative z-30 overflow-visible">
              <div className="flex items-center justify-center gap-6 sm:gap-8 relative overflow-visible">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {roleCards.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Jenis Peran</div>
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                <div className="text-center tooltip-container">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-help">
                    {isLoadingStats ? (
                      <div className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ...
                      </div>
                    ) : totalUsers.toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Pengguna</div>
                  
                  {/* Tooltip */}
                  {!isLoadingStats && Object.keys(userBreakdown).length > 0 && (
                    <div className="tooltip-content">
                      <div className="tooltip-box">
                        {/* Tooltip Arrow */}
                        <div className="tooltip-arrow"></div>
                        
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Detail Pengguna
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(userBreakdown).map(([role, count]) => {
                              // Define icons for each role
                              const roleIcons: {[key: string]: string} = {
                                'Super Administrator': '👑',
                                'Admin Desa': '🏛️',
                                'Kepala Desa': '👔',
                                'Kepala Dusun': '🏘️',
                                'Data Masyarakat DPKJ': '👥',
                                'Data Masyarakat Luar DPKJ': '🌐'
                              };
                              
                              return (
                                <div key={role} className="flex justify-between items-center text-sm py-1">
                                  <span className="text-gray-600 flex-1 flex items-center gap-2">
                                    <span className="text-base">{roleIcons[role] || '📋'}</span>
                                    {role}
                                  </span>
                                  <span className="font-semibold text-gray-800 ml-2 px-2 py-1 bg-gray-100 rounded-md min-w-[32px] text-center">
                                    {count.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t border-gray-200 mt-3 pt-3">
                            <div className="flex justify-between items-center text-sm font-semibold bg-blue-50 rounded-lg p-2">
                              <span className="text-gray-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                Total Keseluruhan
                              </span>
                              <span className="text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-bold">
                                {totalUsers.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-px h-10 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    24/7
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Akses Sistem</div>
                </div>
              </div>
            </div>
          </div>

        {/* Role Selection View */}
        {!listRole && (
          <div className="animate-fadeInUp relative z-10" style={{ animationDelay: '0.3s' }}>
            {/* Enhanced Header Section */}
            <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-8 mb-10 text-center animate-scaleIn relative z-20 overflow-hidden" style={{ animationDelay: '0.4s' }}>
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-sm rounded-full border border-white/40 mb-8 shadow-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-gradient">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-pink-700 bg-clip-text text-transparent">Manajemen Peran Lanjutan</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-6 leading-tight">
                  Pilih Peran Pengguna
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Kelola pengguna berdasarkan peran dan hak akses mereka dalam sistem SiGede DPKJ dengan <span className="font-semibold text-gradient">keamanan tinggi</span> dan <span className="font-semibold text-gradient">administrasi yang efisien</span>
                </p>
              </div>
            </div>

            {/* Enhanced Role Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative z-10">
              {roleCards.map((role, index) => {
                const gradients = [
                  'from-violet-600 to-purple-700',
                  'from-blue-600 to-indigo-700', 
                  'from-emerald-600 to-green-700',
                  'from-orange-600 to-red-700',
                  'from-pink-600 to-rose-700',
                  'from-cyan-600 to-blue-700',
                  'from-amber-600 to-orange-700'
                ];
                
                const cardGradient = gradients[index % gradients.length];
                
                return (
                  <button
                    key={role.id}
                    onClick={() => setListRole(role)}
                    className="group text-left relative overflow-hidden rounded-3xl shadow-xl border border-white/60 hover:shadow-2xl transform transition-all duration-500 cursor-pointer hover:-translate-y-3 card-hover-effect glass-effect animate-scaleIn relative z-5"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    {/* Enhanced Background Effects */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient} opacity-8`}></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cardGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    
                    {/* Card Content */}
                    <div className="relative z-10 p-8">
                      <div className="flex items-start gap-6">
                        {/* Enhanced Icon */}
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cardGradient} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl group-hover:shadow-2xl flex-shrink-0 relative overflow-hidden`}>
                          {/* Icon Background Pattern */}
                          <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                          <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300 relative z-10">
                            {role.icon}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xl sm:text-2xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:${cardGradient} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 mb-3 leading-tight`}>
                            {role.title}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 mb-4">
                            {role.description}
                          </p>
                          
                          {/* Role Features */}
                          <div className="flex flex-wrap gap-2 mb-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <span className="px-3 py-1 bg-white/80 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                              Akses Aman
                            </span>
                            <span className="px-3 py-1 bg-white/80 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                              Berbasis Peran
                            </span>
                          </div>
                          
                          {/* Hover Arrow */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            <span className={`text-sm font-semibold bg-gradient-to-r ${cardGradient} bg-clip-text text-transparent`}>
                              Kelola Pengguna
                            </span>
                            <svg className={`w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Corner Accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${cardGradient} opacity-5 group-hover:opacity-15 transition-opacity duration-300`}></div>
                    
                    {/* Bottom Shine Effect */}
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* User Management View */}
        {listRole && (
          <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            {/* Enhanced Back Navigation */}
            <div className="glass-effect rounded-2xl shadow-lg border border-white/50 p-6 mb-8 animate-scaleIn relative z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setListRole(null)}
                    className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 border border-gray-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Peran
                  </button>
                  
                  <div className="h-8 w-px bg-gray-300"></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-xl">{listRole.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{listRole.title}</h3>
                      <p className="text-sm text-gray-600">Manajemen Pengguna</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced User List Component */}
            <div className="glass-effect rounded-3xl shadow-xl border border-white/50 p-8 animate-scaleIn relative z-20" style={{ animationDelay: '0.3s' }}>
              <UserListNew 
                roleId={listRole.id as UserRole | 'masyarakat_dpkj' | 'masyarakat_luar_dpkj'} 
                roleLabel={listRole.title}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
