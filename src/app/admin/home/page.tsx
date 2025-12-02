"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';
import { FIREBASE_COLLECTIONS } from '../../../lib/rolePermissions';
import { handleAdminLogout } from '../../../lib/logoutHelper';

// Custom Hook untuk Counter Animation
function useCountAnimation(end: number, duration: number = 2000, shouldStart: boolean = false) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!shouldStart || end === 0) {
      setCount(0);
      return;
    }
    
    let startTime: number | null = null;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation (easeOutExpo)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeOutExpo * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, shouldStart]);
  
  return count;
}

const styles = `
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
  }
`;

const RenderIcon = React.memo(({ name, className = '' }: { name: string; className?: string }) => {
  const baseProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, className } as const;
  switch (name) {
    case 'home': return (<svg {...baseProps}><path d="M3 11.5L12 5l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z"/></svg>);
    case 'users': return (<svg {...baseProps}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>);
    case 'newspaper': return (<svg {...baseProps}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M8 10h8M8 14h6"/></svg>);
    case 'file': return (<svg {...baseProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>);
    case 'wallet': return (<svg {...baseProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>);
    case 'briefcase': return (<svg {...baseProps}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>);
    case 'star': return (<svg {...baseProps}><polygon points="12 2 15.09 10.26 23.77 10.5 17.39 16.62 19.54 25.29 12 20.88 4.46 25.29 6.61 16.62 0.23 10.5 8.91 10.26 12 2"/></svg>);
    case 'layers': return (<svg {...baseProps}><path d="M12 2L2 7l10 5 10-5L12 2z"/><path d="M2 17l10 5 10-5"/></svg>);
    case 'message-circle': return (<svg {...baseProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
    case 'shopping-bag': return (<svg {...baseProps}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
    case 'map': return (<svg {...baseProps}><polygon points="1 6 1 22 8 18 16 22 23 18 23 6 16 10 8 6 1 10 1 6"/></svg>);
    case 'database': return (<svg {...baseProps}><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/><path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"/></svg>);
    case 'gift': return (<svg {...baseProps}><polyline points="20.42 4.58 16.5 2.5 12 6.92 7.5 2.5 3.58 4.58"/><path d="M3.75 13v5a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-2v-5"/><line x1="12" y1="6.92" x2="12" y2="21"/><line x1="3.75" y1="9" x2="20.25" y2="9"/></svg>);
    case 'home-alt': return (<svg {...baseProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
    case 'settings': return (<svg {...baseProps}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/></svg>);
    default: return (<svg {...baseProps}><circle cx="12" cy="12" r="10"/></svg>);
  }
});



function getEnhancedIcon(iconName: string, index: number) {
  const colors = useMemo(() => [
    { from: 'from-red-500', to: 'to-pink-600' },
    { from: 'from-blue-500', to: 'to-indigo-600' }, 
    { from: 'from-green-500', to: 'to-emerald-600' },
    { from: 'from-purple-500', to: 'to-violet-600' },
    { from: 'from-orange-500', to: 'to-red-600' },
    { from: 'from-cyan-500', to: 'to-blue-600' },
    { from: 'from-pink-500', to: 'to-rose-600' },
    { from: 'from-indigo-500', to: 'to-purple-600' },
    { from: 'from-teal-500', to: 'to-green-600' },
    { from: 'from-yellow-500', to: 'to-orange-600' },
    { from: 'from-violet-500', to: 'to-purple-600' },
    { from: 'from-rose-500', to: 'to-pink-600' }
  ], []);
  
  const color = colors[index % colors.length];
  
  return (
    <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${color.from} ${color.to} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
      <RenderIcon name={iconName} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
    </div>
  );
}

function getModuleDescription(label: string): string {
  const descriptions: { [key: string]: string } = {
    'E-News': 'Berita dan pengumuman terkini untuk masyarakat',
    'Profil Desa': 'Informasi umum dan sejarah desa',
    'Regulasi Desa': 'Peraturan dan kebijakan pemerintahan desa',
    'Keuangan': 'Transparansi anggaran dan laporan keuangan',
    'Layanan Publik': 'Administrasi pelayanan masyarakat digital',
    'IKM': 'Indeks kepuasan masyarakat terhadap layanan',
    'Wisata & Budaya': 'Promosi destinasi dan kebudayaan lokal',
    'Pengaduan': 'Sistem pelaporan dan penanganan keluhan',
    'E-UMKM': 'Pendataan dan promosi usaha mikro desa',
    'Kelola Data Pengguna': 'Manajemen akun dan hak akses pengguna sistem',
    'Data Desa': 'Informasi lengkap profil dan statistik desa',
    'Pengaturan': 'Kelola tampilan home page dan popup iklan'
  };
  
  return descriptions[label] || 'Modul administrasi desa';
}

export default function AdminHomePage() {
  const gridItems = [
    { label: "E-News", icon: 'newspaper', href: '/admin/e-news' },
    { label: "Profil Desa", icon: 'home', href: '/admin/profil-desa' },
    { label: "Regulasi Desa", icon: 'file', href: '/admin/regulasi' },
    { label: "Keuangan", icon: 'wallet', href: '/admin/keuangan' },
    { label: "Layanan Publik", icon: 'briefcase', href: '/admin/layanan-publik' },
    { label: "IKM", icon: 'star', href: '/admin/ikm' },
    { label: "Wisata & Budaya", icon: 'layers', href: '/admin/wisata-budaya' },
    { label: "Pengaduan", icon: 'message-circle', href: '/admin/pengaduan' },
    { label: "E-UMKM", icon: 'shopping-bag', href: '/admin/e-umkm' },
    { label: "Kelola Data Pengguna", icon: 'users', href: '/admin/kelola-pengguna' },
    { label: "Data Desa", icon: 'database', href: '/admin/data-desa' },
    { label: "Pengaturan", icon: 'settings', href: '/admin/pengaturan' },
  ];

  const router = useRouter();
  const { logout, user } = useAuth();
  
  // Filter gridItems berdasarkan role
  const filteredGridItems = React.useMemo(() => {
    if (!user?.role) return gridItems;
    
    // Kepala Dusun: hanya Layanan Publik dan Pengaduan
    if (user.role === 'kepala_dusun') {
      return gridItems.filter(item => 
        item.label === 'Layanan Publik' || 
        item.label === 'Pengaduan'
      );
    }
    
    // Kepala Desa: Layanan Publik, Pengaduan, Data Desa, Profil Desa
    if (user.role === 'kepala_desa') {
      return gridItems.filter(item => 
        item.label === 'Layanan Publik' || 
        item.label === 'Pengaduan' ||
        item.label === 'Data Desa' ||
        item.label === 'Profil Desa'
      );
    }
    
    // Admin Desa: Semua kecuali Kelola Data Pengguna
    if (user.role === 'admin_desa') {
      return gridItems.filter(item => item.label !== 'Kelola Data Pengguna');
    }
    
    // Administrator/Super Admin: Semua menu
    return gridItems;
  }, [user?.role]);
  
  // State untuk statistik
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeServices: 0,
    dataRecords: 0,
    loading: false // Start without loading for faster navigation
  });

  // State untuk trigger animasi
  const [startAnimation, setStartAnimation] = useState(false);

  // Animated counters
  const animatedUsers = useCountAnimation(stats.totalUsers, 2000, startAnimation);
  const animatedServices = useCountAnimation(stats.activeServices, 2000, startAnimation);
  const animatedRecords = useCountAnimation(stats.dataRecords, 2500, startAnimation);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState('data_username');
  const [profileEmail, setProfileEmail] = useState('admin@example.com');
  const [profileName, setProfileName] = useState('Data Nama');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');

  // Fetch real data dari Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('📊 Fetching dashboard statistics...');
        
        // Set loading true only after component is mounted (no initial loading state)
        setStats(prev => ({ ...prev, loading: true }));
        
        // 1. Total Users
        const usersCollection = collection(firestore, FIREBASE_COLLECTIONS.USERS);
        const usersSnapshot = await getDocs(usersCollection);
        const totalUsers = usersSnapshot.size;
        console.log('👥 Total Users:', totalUsers);

        // 2. Active Services (Layanan Publik dengan status aktif)
        const layananCollection = collection(firestore, 'layanan-publik');
        const activeLayananQuery = query(layananCollection, where('status', '==', 'aktif'));
        const activeLayananSnapshot = await getDocs(activeLayananQuery);
        const activeServices = activeLayananSnapshot.size;
        console.log('✅ Active Services:', activeServices);

        // 3. Data Records (Data Desa / KK)
        const dataDesaCollection = collection(firestore, 'data-desa');
        const dataDesaSnapshot = await getDocs(dataDesaCollection);
        const dataRecords = dataDesaSnapshot.size;
        console.log('📁 Data Records:', dataRecords);

        setStats({
          totalUsers,
          activeServices,
          dataRecords,
          loading: false
        });

        // Trigger animation setelah data loaded
        setTimeout(() => {
          setStartAnimation(true);
        }, 100);

        console.log('✅ Dashboard statistics loaded successfully');
      } catch (error) {
        console.error('❌ Error fetching dashboard statistics:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    // Add small delay to prevent flash of loading state during navigation
    const timeoutId = setTimeout(fetchStats, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <style>{styles}</style>
      {/* Simplified Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Simplified Header */}
          <div className="glass-effect rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8 sm:mb-10 relative">
            {/* AdminHeaderCard with cleaner styling */}
            <div className="w-full bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between mb-4 sm:mb-6">
              {/* Title Section */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl sm:text-2xl md:text-3xl text-slate-800 mb-0.5 sm:mb-1">
                    Dashboard Admin
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm md:text-base">
                    Kelola sistem informasi desa
                  </p>
                </div>
              </div>
              
              {/* Controls Section - Mobile Optimized */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="flex items-center flex-1 sm:max-w-xs md:max-w-md bg-gray-50 rounded-lg shadow-sm border border-gray-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 hover:border-blue-400 transition-colors">
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    className="flex-1 bg-transparent text-gray-700 text-xs sm:text-sm font-medium focus:outline-none placeholder-gray-500 min-w-0"
                  />
                  <svg
                    className="ml-1 sm:ml-2 text-gray-400 flex-shrink-0"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-red-50 hover:bg-red-100 active:bg-red-200 flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-red-600"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Welcome Message - Mobile Optimized */}
            <div className="mt-3 sm:mt-4 md:mt-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
                Selamat Datang di Dashboard Admin! 👋
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                Kelola sistem informasi desa dengan mudah dan profesional
              </p>
            </div>
            
            {/* Statistics Section - Mobile Optimized */}
            <div className="mt-3 sm:mt-4 md:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {/* Total Pengguna - Mobile Optimized */}
                <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="users" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                      {animatedUsers.toLocaleString('id-ID')}
                    </h4>
                    <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium">Total Pengguna Terdaftar</p>
                  </div>
                </div>
                  
                {/* Layanan Aktif - Mobile Optimized */}
                <div className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="briefcase" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                      {animatedServices.toLocaleString('id-ID')}
                    </h4>
                    <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium">Layanan Publik Aktif</p>
                  </div>
                </div>
                  
                {/* Data Records - Mobile Optimized */}
                <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 sm:col-span-2 lg:col-span-1 cursor-pointer">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="database" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                      {animatedRecords.toLocaleString('id-ID')}
                    </h4>
                    <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium">Total Data Tersimpan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Section Title - Mobile optimized */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="w-1 h-4 sm:h-5 md:h-6 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
              Menu Administrasi
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 ml-3 sm:ml-4 md:ml-5">Pilih modul yang ingin Anda kelola</p>
          </div>

          {/* Optimized Grid Layout for Mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredGridItems.map((item, index) => (
              <div
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="group relative bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-red-300 active:scale-95"
              >
                {/* Card Content - Mobile optimized */}
                <div className="relative p-3 sm:p-4 md:p-6 flex flex-col items-center text-center h-full">
                  {/* Icon */}
                  <div className="mb-2 sm:mb-3 md:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {getEnhancedIcon(item.icon, index)}
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-xs sm:text-sm md:text-base text-gray-800 group-hover:text-red-600 transition-colors duration-300 mb-1 sm:mb-2 line-clamp-2">
                    {item.label}
                  </h3>
                  
                  {/* Description - Hidden on mobile for better performance */}
                  <p className="hidden sm:block text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                    {getModuleDescription(item.label)}
                  </p>
                  
                  {/* Hover Arrow - Simplified for mobile */}
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hidden sm:block">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowProfileModal(false)}></div>
            
            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Kelola Profil
                </h3>
                <p className="text-sm text-gray-600">Perbarui informasi akun Anda</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setProfileError(''); if (newPassword || confirmPassword) { if (newPassword !== confirmPassword) { setProfileError('Konfirmasi kata sandi tidak cocok'); return; } } setShowProfileModal(false); alert('Perubahan profil disimpan'); }} className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Username
                  </label>
                  <input 
                    value={profileUsername} 
                    onChange={(e) => setProfileUsername(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none transition-colors" 
                    placeholder="Masukkan username"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input 
                    type="email"
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none transition-colors" 
                    placeholder="Masukkan email"
                  />
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:border-green-400 focus:bg-white focus:outline-none transition-colors" 
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="********" 
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Konfirmasi
                    </label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="********" 
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none transition-colors" 
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">{profileError}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowProfileModal(false)} 
                    className="flex-1 px-5 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-sm text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                  >
                    💾 Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
