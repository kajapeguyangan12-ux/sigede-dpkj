"use client";
import React from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/AdminLayout";
import BeritaList from "./components/BeritaList";
import PengumumanList from "./components/PengumumanList";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderIcons, AdminHeaderAccount } from "../../components/AdminHeaderCard";

const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.4s ease-out forwards;
  }

  /* Mobile-optimized glass effect */
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  /* Lighter pattern for mobile */
  @media (min-width: 768px) {
    .pattern-grid {
      background-image: 
        linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px);
      background-size: 30px 30px;
    }
  }
`;

export default function AdminENewsPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<'berita' | 'pengumuman'>('berita');

  return (
    <AdminLayout>
      <style>{styles}</style>
      
      {/* Modern Background with Enhanced Geometric Patterns */}
      <div className="min-h-screen relative">
      {/* Modern Background - Mobile Optimized */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/40"></div>
        
      {/* Simplified Background - Only on Desktop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute inset-0 pattern-grid opacity-20"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          
          {/* Mobile-Optimized Header */}
          <div className="glass-effect rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl border border-white/60 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 animate-fadeInUp">
            {/* Top Border Decoration */}
            <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-t-2xl sm:rounded-t-3xl"></div>
            
            {/* Mobile-First Header Card */}
            <div className="w-full bg-gradient-to-r from-white via-red-50/20 to-purple-50/30 rounded-xl sm:rounded-2xl shadow-md border border-gray-200/50 p-3 sm:p-4 md:p-6 lg:p-8">
              
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                
                {/* Title Section - Mobile Optimized */}
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                      <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1v4.5a1.5 1.5 0 01-3 0V7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl bg-gradient-to-r from-slate-800 via-red-800 to-purple-800 bg-clip-text text-transparent truncate">
                      E-News Management
                    </h1>
                    <p className="text-slate-600 font-medium text-xs sm:text-sm md:text-base lg:text-lg mt-0.5 sm:mt-1">
                      Kelola berita dan pengumuman desa
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-1 sm:mt-2">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-600 font-semibold">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">Berita</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-purple-600 font-semibold">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline">Pengumuman</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Controls Section - Mobile Optimized */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                  
                  {/* Search Bar - Hidden on small mobile, shown on larger screens */}
                  <div className="hidden sm:flex items-center flex-1 lg:max-w-md bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-gray-300/50 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 hover:border-red-400 transition-all">
                    <input
                      type="text"
                      placeholder="Cari..."
                      className="flex-1 bg-transparent text-gray-700 text-sm sm:text-base font-medium focus:outline-none placeholder-gray-500"
                    />
                    <svg className="ml-2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  
                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Notifications - Optional on mobile */}
                    <div className="hidden md:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center hover:from-red-50 hover:to-red-100 transition-all cursor-pointer shadow-sm">
                      <svg width="18" height="18" className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5h2A5.5 5.5 0 0110 10z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Tab Navigation */}
          <div className="animate-fadeInUp mb-4 sm:mb-6 md:mb-8" style={{ animationDelay: '0.1s' }}>
            <div className="glass-effect rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl border border-white/60 p-1 sm:p-2 inline-flex gap-1 sm:gap-2 w-full sm:w-auto">
              
              <button
                className={`flex-1 sm:flex-initial px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all ${
                  tab === 'berita' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105' 
                    : 'bg-white/50 text-gray-700 hover:bg-white/80 active:scale-95'
                }`}
                onClick={() => setTab('berita')}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-white/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className="hidden xs:inline">Berita</span>
                  <span className="xs:hidden">📰</span>
                </div>
              </button>
              
              <button
                className={`flex-1 sm:flex-initial px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all ${
                  tab === 'pengumuman' 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg scale-105' 
                    : 'bg-white/50 text-gray-700 hover:bg-white/80 active:scale-95'
                }`}
                onClick={() => setTab('pengumuman')}
              >
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-white/20 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <span className="hidden xs:inline">Pengumuman</span>
                  <span className="xs:hidden">📢</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Mobile-Optimized Content Container */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="glass-effect rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-2xl border border-white/60">
              {/* Top Border */}
              <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>
              
              <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                {tab === 'berita' ? <BeritaList /> : <PengumumanList />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
