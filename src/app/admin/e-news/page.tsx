"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../lib/logoutHelper";
import AdminLayout from "../components/AdminLayout";
import BeritaList from "./components/BeritaList";
import PengumumanList from "./components/PengumumanList";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderIcons, AdminHeaderAccount } from "../../components/AdminHeaderCard";

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
      transform: translateY(-10px);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-scaleIn {
    animation: scaleIn 0.5s ease-out forwards;
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
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

  .btn-modern {
    position: relative;
    overflow: hidden;
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
`;

export default function AdminENewsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tab, setTab] = React.useState<'berita' | 'pengumuman'>('berita');

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <style>{styles}</style>
      
      {/* Modern Background with Enhanced Geometric Patterns */}
      <div className="min-h-screen relative">
        {/* Primary Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60"></div>
        
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute -top-48 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-red-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-48 w-[700px] h-[700px] bg-gradient-to-br from-purple-400/15 via-blue-400/10 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/12 via-red-400/8 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          
          {/* Enhanced Grid Pattern */}
          <div className="absolute inset-0 pattern-grid opacity-30"></div>
          
          {/* Dots Pattern Overlay */}
          <div className="absolute inset-0 pattern-dots opacity-20"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Enhanced Header */}
          <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 mb-8 sm:mb-10 animate-fadeInUp relative z-40">
            {/* Header Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-t-3xl"></div>
            
            {/* Floating Background Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-red-400/10 to-purple-400/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

            {/* Enhanced AdminHeaderCard with better styling */}
            <div className="w-full bg-gradient-to-r from-white via-red-50/30 to-purple-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
              {/* Enhanced Title Section */}
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/25 transform hover:scale-105 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                    <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1v4.5a1.5 1.5 0 01-3 0V7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-red-800 to-purple-800 bg-clip-text text-transparent mb-2">
                    E-News Management
                  </h1>
                  <p className="text-slate-600 font-medium text-lg">
                    Kelola berita dan pengumuman desa
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      Berita Aktif
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      Pengumuman Aktif
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Controls Section */}
              <div className="flex items-center gap-6 relative z-10">
                {/* Enhanced Search Bar */}
                <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-red-400 hover:shadow-lg transition-all duration-300 group">
                  <input
                    type="text"
                    placeholder="Cari berita atau pengumuman..."
                    className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
                  />
                  <svg
                    className="ml-3 text-gray-400 group-hover:text-red-500 transition-colors duration-300"
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-red-50 hover:to-red-100 transition-all duration-300 cursor-pointer shadow-md">
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
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="animate-fadeInUp mb-8" style={{ animationDelay: '0.2s' }}>
            <div className="glass-effect rounded-2xl shadow-xl border border-white/60 p-2 inline-flex gap-2 relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-purple-500/5 to-blue-500/5"></div>
              
              <button
                className={`relative px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 btn-modern ${
                  tab === 'berita' 
                    ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-xl transform scale-105 z-10' 
                    : 'bg-white/50 text-gray-700 hover:bg-white/80 hover:shadow-lg hover:scale-102 z-10'
                }`}
                onClick={() => setTab('berita')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span>Kelola Berita</span>
                </div>
              </button>
              
              <button
                className={`relative px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 btn-modern ${
                  tab === 'pengumuman' 
                    ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-xl transform scale-105 z-10' 
                    : 'bg-white/50 text-gray-700 hover:bg-white/80 hover:shadow-lg hover:scale-102 z-10'
                }`}
                onClick={() => setTab('pengumuman')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <span>Kelola Pengumuman</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Enhanced Content Container */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 relative">
              {/* Content Decoration */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>
              
              <div className="p-6 sm:p-8">
                {tab === 'berita' ? <BeritaList /> : <PengumumanList />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
