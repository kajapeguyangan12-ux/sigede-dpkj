"use client";
import React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

// Custom Hook untuk Counter Animation
function useCountAnimation(end: number, duration: number = 2000, shouldStart: boolean = false) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    if (!shouldStart || end === 0) {
      setCount(0);
      return;
    }
    
    let startTime: number | null = null;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
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

function RenderIcon({ name, className = '' }: { name: string; className?: string }) {
  const baseProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, className } as const;
  switch (name) {
    case 'newspaper': return (<svg {...baseProps}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M8 10h8M8 14h6"/></svg>);
    case 'landmark': return (<svg {...baseProps}><path d="M3 21h18M6 18V9l6-6 6 6v9M9 21v-6h6v6"/></svg>);
    case 'file': return (<svg {...baseProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>);
    case 'wallet': return (<svg {...baseProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>);
    case 'briefcase': return (<svg {...baseProps}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>);
    case 'star': return (<svg {...baseProps}><polygon points="12 2 15.09 10.26 23.77 10.5 17.39 16.62 19.54 25.29 12 20.88 4.46 25.29 6.61 16.62 0.23 10.5 8.91 10.26 12 2"/></svg>);
    case 'layers': return (<svg {...baseProps}><path d="M12 2L2 7l10 5 10-5L12 2z"/><path d="M2 17l10 5 10-5"/></svg>);
    case 'message-circle': return (<svg {...baseProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
    case 'shopping-bag': return (<svg {...baseProps}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
    case 'database': return (<svg {...baseProps}><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/><path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"/></svg>);
    case 'clipboard': return (<svg {...baseProps}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>);
    case 'map': return (<svg {...baseProps}><polygon points="1 6 1 22 8 18 16 22 23 18 23 6 16 10 8 6 1 10 1 6"/></svg>);
    default: return (<svg {...baseProps}><circle cx="12" cy="12" r="10"/></svg>);
  }
}

function getEnhancedIcon(iconName: string, index: number) {
  const colors = [
    { from: 'from-red-500', to: 'to-pink-600' },
    { from: 'from-emerald-500', to: 'to-green-600' }, 
    { from: 'from-purple-500', to: 'to-violet-600' },
    { from: 'from-green-500', to: 'to-emerald-600' },
    { from: 'from-indigo-500', to: 'to-blue-600' },
    { from: 'from-cyan-500', to: 'to-blue-600' },
    { from: 'from-orange-500', to: 'to-amber-600' },
    { from: 'from-pink-500', to: 'to-rose-600' },
    { from: 'from-blue-500', to: 'to-indigo-600' },
    { from: 'from-amber-500', to: 'to-orange-600' }
  ];
  
  const color = colors[index % colors.length];
  
  return (
    <div className={`w-14 h-14 bg-gradient-to-br ${color.from} ${color.to} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
      <RenderIcon name={iconName} className="w-7 h-7 text-white" />
    </div>
  );
}

function getModuleDescription(label: string): string {
  const descriptions: { [key: string]: string } = {
    'E-News': 'Berita dan pengumuman terkini desa',
    'Profil Desa': 'Informasi dan sejarah desa',
    'Regulasi': 'Peraturan dan kebijakan desa',
    'Keuangan': 'Transparansi anggaran desa',
    'Data Desa': 'Informasi lengkap data desa',
    'Layanan Publik': 'Ajukan layanan administrasi',
    'Wisata & Budaya': 'Destinasi wisata lokal',
    'Pengaduan': 'Sampaikan keluhan dan saran',
    'E-UMKM': 'Jelajahi UMKM lokal'
  };
  
  return descriptions[label] || 'Layanan masyarakat';
}

export default function MasyarakatHomePage() {
  const gridItems = [
    { label: "E-News", icon: 'newspaper', href: '/masyarakat/e-news' },
    { label: "Profil Desa", icon: 'landmark', href: '/masyarakat/profil-desa' },
    { label: "Regulasi", icon: 'file', href: '/masyarakat/regulasi' },
    { label: "Keuangan", icon: 'wallet', href: '/masyarakat/keuangan' },
    { label: "Data Desa", icon: 'database', href: '/masyarakat/data-desa' },
    { label: "Layanan Publik", icon: 'briefcase', href: '/masyarakat/layanan-publik' },
    { label: "Wisata & Budaya", icon: 'layers', href: '/masyarakat/wisata-budaya' },
    { label: "Pengaduan", icon: 'message-circle', href: '/masyarakat/pengaduan' },
    { label: "E-UMKM", icon: 'shopping-bag', href: '/masyarakat/e-umkm' },
  ];

  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [stats] = React.useState({
    totalServices: 9,
    activeNews: 0,
    totalUMKM: 0,
  });

  const [startAnimation, setStartAnimation] = React.useState(false);

  const animatedServices = useCountAnimation(stats.totalServices, 2000, startAnimation);
  const animatedNews = useCountAnimation(stats.activeNews, 2000, startAnimation);
  const animatedUMKM = useCountAnimation(stats.totalUMKM, 2000, startAnimation);

  React.useEffect(() => {
    setTimeout(() => {
      setStartAnimation(true);
    }, 100);
  }, []);

  const handleLogout = async () => {
    try {
      await logout('masyarakat');
      router.push('/masyarakat/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <style>{styles}</style>
      {/* Simplified Background */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Simplified Header */}
          <div className="glass-effect rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-8 sm:mb-10 relative">
            {/* Header Card */}
            <div className="w-full bg-white rounded-xl shadow-md border border-gray-200 px-6 py-6 flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-1">
                    Portal Masyarakat
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Akses layanan desa dengan mudah
                  </p>
                </div>
              </div>
              
              {/* Controls Section */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* User Info */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg flex-1 sm:flex-initial">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.displayName?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
                      {user?.displayName || 'Masyarakat'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'warga_luar_dpkj' ? 'Warga Luar' : 'Warga'}
                    </p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-11 h-11 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm"
                  title="Keluar"
                >
                  <svg
                    width="20"
                    height="20"
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
            
            {/* Welcome Message */}
            <div className="mt-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Selamat Datang, {user?.displayName || 'Warga'}! 👋
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Akses berbagai layanan dan informasi desa dalam satu platform
              </p>
            </div>
            
            {/* Simplified Statistics Section */}
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Total Layanan */}
                <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="briefcase" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                      {animatedServices}
                    </h4>
                    <p className="text-sm sm:text-base text-white/90 font-medium">Layanan Tersedia</p>
                  </div>
                </div>
                  
                {/* Berita Aktif */}
                <div className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="newspaper" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                      {animatedNews}
                    </h4>
                    <p className="text-sm sm:text-base text-white/90 font-medium">Berita Terbaru</p>
                  </div>
                </div>
                  
                {/* UMKM */}
                <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 sm:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1 cursor-pointer">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <RenderIcon name="shopping-bag" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                      {animatedUMKM}
                    </h4>
                    <p className="text-sm sm:text-base text-white/90 font-medium">UMKM Terdaftar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module Section Title */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></div>
              Menu Layanan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 ml-5">Pilih layanan yang Anda butuhkan</p>
          </div>

          {/* Simplified Grid Layout - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {gridItems.map((item, index) => (
              <div
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-red-300"
              >
                {/* Card Content */}
                <div className="relative p-4 sm:p-6 flex flex-col items-center text-center h-full">
                  {/* Icon */}
                  <div className="mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {getEnhancedIcon(item.icon, index)}
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 group-hover:text-red-600 transition-colors duration-300 mb-2">
                    {item.label}
                  </h3>
                  
                  {/* Description - Hidden on mobile */}
                  <p className="hidden sm:block text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed mb-3">
                    {getModuleDescription(item.label)}
                  </p>
                  
                  {/* Hover Arrow */}
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      
      <BottomNavigation />
    </>
  );
}
