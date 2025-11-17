"use client";
import React, { useState, useEffect } from "react";
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

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
    }
    50% {
      box-shadow: 0 0 40px rgba(239, 68, 68, 0.6);
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

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .card-gradient-border {
    position: relative;
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95));
  }

  .card-gradient-border::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, #ef4444, #ec4899, #8b5cf6);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card-gradient-border:hover::before {
    opacity: 1;
  }
`;

function RenderIcon({ name, className = '' }: { name: string; className?: string }) {
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
}



function getEnhancedIcon(iconName: string, index: number) {
  const colors = [
    { from: 'from-red-500', to: 'to-pink-600', shadow: 'shadow-red-500/50' },
    { from: 'from-blue-500', to: 'to-indigo-600', shadow: 'shadow-blue-500/50' }, 
    { from: 'from-green-500', to: 'to-emerald-600', shadow: 'shadow-green-500/50' },
    { from: 'from-purple-500', to: 'to-violet-600', shadow: 'shadow-purple-500/50' },
    { from: 'from-orange-500', to: 'to-red-600', shadow: 'shadow-orange-500/50' },
    { from: 'from-cyan-500', to: 'to-blue-600', shadow: 'shadow-cyan-500/50' },
    { from: 'from-pink-500', to: 'to-rose-600', shadow: 'shadow-pink-500/50' },
    { from: 'from-indigo-500', to: 'to-purple-600', shadow: 'shadow-indigo-500/50' },
    { from: 'from-teal-500', to: 'to-green-600', shadow: 'shadow-teal-500/50' },
    { from: 'from-yellow-500', to: 'to-orange-600', shadow: 'shadow-yellow-500/50' },
    { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/50' },
    { from: 'from-rose-500', to: 'to-pink-600', shadow: 'shadow-rose-500/50' }
  ];
  
  const color = colors[index % colors.length];
  
  return (
    <div className={`relative w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-br ${color.from} ${color.to} rounded-2xl flex items-center justify-center shadow-xl ${color.shadow} transform rotate-3 group-hover:rotate-0 group-hover:shadow-2xl transition-all duration-500`}>
      {/* Icon Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color.from} ${color.to} rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`}></div>
      
      {/* Icon */}
      <div className="relative">
        <RenderIcon name={iconName} className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
      </div>
      
      {/* Sparkle Effect */}
      <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60 group-hover:opacity-100 group-hover:scale-150 transition-all duration-300"></div>
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
  const { logout } = useAuth();
  
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
      {/* Modern Background with Geometric Patterns */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-red-400/20 via-pink-400/15 to-transparent rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-32 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-transparent rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Enhanced Header with Glass Effect */}
          <div className="glass-effect rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 mb-8 sm:mb-10 animate-fadeInUp relative z-40 overflow-hidden">
            {/* Floating Background Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

            {/* Enhanced AdminHeaderCard with better styling */}
            <div className="w-full bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
              {/* Enhanced Title Section */}
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                    Dashboard Admin
                  </h1>
                  <p className="text-slate-600 font-medium text-lg">
                    Kelola sistem informasi desa
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Dashboard Aktif
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Sistem Online
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Controls Section */}
              <div className="flex items-center gap-6 relative z-10">
                {/* Enhanced Search Bar */}
                <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
                  <input
                    type="text"
                    placeholder="Cari menu atau fitur..."
                    className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
                  />
                  <svg
                    className="ml-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer shadow-md">
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
            
            {/* Enhanced Welcome Message */}
            <div className="mt-6 mb-8 animate-scaleIn" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                Selamat Datang di Dashboard Admin! 👋
              </h2>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Kelola sistem informasi desa dengan mudah dan profesional
              </p>
            </div>
            
            {/* Statistics Section with Premium SaaS Design */}
            <div className="mt-6 sm:mt-8 relative z-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {/* Total Pengguna - Premium Design */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_20px_60px_rgb(59,130,246,0.4)] transform hover:scale-[1.04] hover:-translate-y-2 transition-all duration-500 animate-fadeInUp cursor-pointer border border-blue-400/20" style={{ animationDelay: '0.2s' }}>
                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 group-hover:blur-2xl transition-all duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full blur-3xl -ml-14 -mb-14 group-hover:scale-125 transition-all duration-700"></div>
                      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-all duration-700"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon Container with Glow */}
                      <div className="mb-5 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[20px] blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] bg-white/30 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-2xl group-hover:bg-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/20">
                          <RenderIcon name="users" className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-2xl" />
                        </div>
                      </div>
                      
                      {/* Stats with Better Spacing */}
                      <div className="space-y-2">
                        <h4 className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                          {animatedUsers.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-base sm:text-lg text-white/95 font-bold tracking-wide">Total Pengguna Terdaftar</p>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-4 right-4 w-20 h-1.5 bg-white/40 rounded-full shadow-lg"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-1.5 bg-white/30 rounded-full"></div>
                    </div>
                    
                    {/* Premium Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    </div>
                    
                    {/* Border Glow */}
                    <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20 group-hover:ring-white/40 transition-all duration-500"></div>
                  </div>
                  
                  {/* Layanan Aktif - Premium Design */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_20px_60px_rgb(16,185,129,0.4)] transform hover:scale-[1.04] hover:-translate-y-2 transition-all duration-500 animate-fadeInUp cursor-pointer border border-emerald-400/20" style={{ animationDelay: '0.3s' }}>
                    {/* Glass Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 group-hover:blur-2xl transition-all duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full blur-3xl -ml-14 -mb-14 group-hover:scale-125 transition-all duration-700"></div>
                      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-all duration-700"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon Container with Glow */}
                      <div className="mb-5 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[20px] blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] bg-white/30 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-2xl group-hover:bg-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/20">
                          <RenderIcon name="briefcase" className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-2xl" />
                        </div>
                      </div>
                      
                      {/* Stats with Better Spacing */}
                      <div className="space-y-2">
                        <h4 className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                          {animatedServices.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-base sm:text-lg text-white/95 font-bold tracking-wide">Layanan Publik Aktif</p>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-4 right-4 w-20 h-1.5 bg-white/40 rounded-full shadow-lg"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-1.5 bg-white/30 rounded-full"></div>
                    </div>
                    
                    {/* Premium Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    </div>
                    
                    {/* Border Glow */}
                    <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20 group-hover:ring-white/40 transition-all duration-500"></div>
                  </div>
                  
                  {/* Data Records - Premium Design */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-[28px] p-7 sm:p-8 shadow-[0_8px_30px_rgb(168,85,247,0.3)] hover:shadow-[0_20px_60px_rgb(168,85,247,0.4)] transform hover:scale-[1.04] hover:-translate-y-2 transition-all duration-500 animate-fadeInUp sm:col-span-2 lg:col-span-1 cursor-pointer border border-purple-400/20" style={{ animationDelay: '0.4s' }}>
                    {/* Glass Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 group-hover:blur-2xl transition-all duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full blur-3xl -ml-14 -mb-14 group-hover:scale-125 transition-all duration-700"></div>
                      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-all duration-700"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon Container with Glow */}
                      <div className="mb-5 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[20px] blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] bg-white/30 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-2xl group-hover:bg-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/20">
                          <RenderIcon name="database" className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-2xl" />
                        </div>
                      </div>
                      
                      {/* Stats with Better Spacing */}
                      <div className="space-y-2">
                        <h4 className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                          {animatedRecords.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-base sm:text-lg text-white/95 font-bold tracking-wide">Total Data Tersimpan</p>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-4 right-4 w-20 h-1.5 bg-white/40 rounded-full shadow-lg"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-1.5 bg-white/30 rounded-full"></div>
                    </div>
                    
                    {/* Premium Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    </div>
                    
                    {/* Border Glow */}
                    <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20 group-hover:ring-white/40 transition-all duration-500"></div>
                  </div>
                </div>
            </div>
          </div>

          {/* Module Section Title */}
          <div className="mb-6 sm:mb-8 animate-fadeInUp relative z-20" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
              Menu Administrasi
            </h2>
            <p className="text-sm sm:text-base text-gray-600 ml-6">Pilih modul yang ingin Anda kelola</p>
          </div>

          {/* Enhanced Grid Layout with Modern Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 relative z-20">
            {gridItems.map((item, index) => (
              <div
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="group relative overflow-hidden card-gradient-border rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent animate-fadeInUp"
                style={{
                  animationDelay: `${0.6 + (index * 0.05)}s`,
                }}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-red-50 group-hover:via-pink-50 group-hover:to-purple-50 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                {/* Card Content */}
                <div className="relative p-6 sm:p-7 lg:p-8 flex flex-col items-center text-center h-full">
                  {/* Enhanced Icon with Floating Animation */}
                  <div className="mb-5 sm:mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    {getEnhancedIcon(item.icon, index)}
                  </div>
                  
                  {/* Title with Gradient on Hover */}
                  <h3 className="font-bold text-base sm:text-lg text-gray-800 group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:via-pink-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 mb-2 sm:mb-3">
                    {item.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed mb-4">
                    {getModuleDescription(item.label)}
                  </p>
                  
                  {/* Hover Arrow with Pulse Effect */}
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:animate-pulse-glow">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Corner Decorations */}
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-gray-200 group-hover:border-red-300 rounded-tr-2xl transition-colors duration-300"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-gray-200 group-hover:border-pink-300 rounded-bl-2xl transition-colors duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeInUp">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md" onClick={() => setShowProfileModal(false)}></div>
            
            {/* Modal Card */}
            <div className="relative w-full max-w-lg glass-effect rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 animate-scaleIn">
              {/* Close Button */}
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all duration-300 group"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-float">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                  Kelola Profil
                </h3>
                <p className="text-sm sm:text-base text-gray-600 font-medium">Perbarui informasi akun Anda dengan mudah</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setProfileError(''); if (newPassword || confirmPassword) { if (newPassword !== confirmPassword) { setProfileError('Konfirmasi kata sandi tidak cocok'); return; } } setShowProfileModal(false); alert('Perubahan profil disimpan'); }} className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
                    Username
                  </label>
                  <input 
                    value={profileUsername} 
                    onChange={(e) => setProfileUsername(e.target.value)} 
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50/80 text-sm sm:text-base text-gray-800 font-medium placeholder-gray-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300" 
                    placeholder="Masukkan username"
                  />
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    Email
                  </label>
                  <input 
                    type="email"
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50/80 text-sm sm:text-base text-gray-800 font-medium placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300" 
                    placeholder="Masukkan email"
                  />
                </div>

                {/* Name Field */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                    Nama Lengkap
                  </label>
                  <input 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50/80 text-sm sm:text-base text-gray-800 font-medium placeholder-gray-400 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300" 
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-violet-600 rounded-full"></div>
                      Kata Sandi Baru
                    </label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="********" 
                      className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50/80 text-sm sm:text-base text-gray-800 font-medium placeholder-gray-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300" 
                    />
                  </div>
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                      Konfirmasi
                    </label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="********" 
                      className="w-full px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50/80 text-sm sm:text-base text-gray-800 font-medium placeholder-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all duration-300" 
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl sm:rounded-2xl animate-scaleIn">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm sm:text-base text-red-700 font-semibold">{profileError}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowProfileModal(false)} 
                    className="flex-1 px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-300 bg-white text-sm sm:text-base text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 text-sm sm:text-base text-white font-black shadow-lg hover:shadow-xl hover:from-red-600 hover:via-pink-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-red-200 transform hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    💾 Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
