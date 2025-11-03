"use client";
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider } from './AdminContext';
import { useAuth } from '../../../contexts/AuthContext';
// import AuthGuard from '../../components/AuthGuard';
import Image from 'next/image';

function RenderIcon({ name, className = '' }: { name: string; className?: string }) {
  const baseProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, className } as const;
  switch (name) {
    case 'home': return (<svg {...baseProps}><path d="M3 11.5L12 5l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z"/></svg>);
    case 'users': return (<svg {...baseProps}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>);
    case 'newspaper': return (<svg {...baseProps}><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><path d="M8 10h8M8 14h6"/></svg>);
    case 'file': return (<svg {...baseProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>);
    case 'layers': return (<svg {...baseProps}><path d="M12 2L2 7l10 5 10-5L12 2z"/><path d="M2 17l10 5 10-5"/></svg>);
    case 'building': return (<svg {...baseProps}><rect x="3" y="6" width="18" height="14" rx="1"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="9" y1="10" x2="9" y2="16"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="15" y1="10" x2="15" y2="16"/></svg>);
    case 'wallet': return (<svg {...baseProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>);
    case 'bar-chart': return (<svg {...baseProps}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>);
    case 'home-alt': return (<svg {...baseProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
    case 'compass': return (<svg {...baseProps}><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 9 8 12 12 15 16 12"/></svg>);
    case 'briefcase': return (<svg {...baseProps}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>);
    case 'star': return (<svg {...baseProps}><polygon points="12 2 15.09 10.26 23.77 10.5 17.39 16.62 19.54 25.29 12 20.88 4.46 25.29 6.61 16.62 0.23 10.5 8.91 10.26 12 2"/></svg>);
    case 'map': return (<svg {...baseProps}><polygon points="1 6 1 22 8 18 16 22 23 18 23 6 16 10 8 6 1 10 1 6"/></svg>);
    case 'message': return (<svg {...baseProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
    case 'shopping-bag': return (<svg {...baseProps}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
    case 'gift': return (<svg {...baseProps}><polyline points="20.42 4.58 16.5 2.5 12 6.92 7.5 2.5 3.58 4.58"/><path d="M3.75 13v5a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-2v-5"/><line x1="12" y1="6.92" x2="12" y2="21"/><line x1="3.75" y1="9" x2="20.25" y2="9"/></svg>);
    case 'help-circle': return (<svg {...baseProps}><circle cx="12" cy="12" r="10"/><path d="M12 16v.01M12 12a2 2 0 0 0-2-2 2 2 0 0 0-2 2c0 1 1 2 2 2s2 1 2 2"/></svg>);
    case 'settings': return (<svg {...baseProps}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.98 2.98l4.24 4.24M1 12h6m6 0h6m-16.78 7.78l4.24-4.24m2.98-2.98l4.24-4.24"/></svg>);
    default: return (<svg {...baseProps}><circle cx="12" cy="12" r="10"/></svg>);
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Simple auth check - redirect if not authenticated
  React.useEffect(() => {
    // Check if we're in the middle of logout process
    const isLoggingOut = sessionStorage.getItem('admin_logout_in_progress');
    if (isLoggingOut) {
      console.log('⏳ AdminLayout: Logout in progress, skipping auth check');
      return;
    }

    const storedUser = localStorage.getItem('sigede_auth_user');
    if (!storedUser) {
      console.log('❌ AdminLayout: No stored user found, redirecting to login');
      window.location.href = '/admin/login';
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      const validAdminRoles = ['administrator', 'admin_desa', 'kepala_desa'];
      
      if (!userData || !userData.role || !validAdminRoles.includes(userData.role)) {
        console.log('❌ AdminLayout: Invalid user role:', userData?.role, '- redirecting to login');
        localStorage.removeItem('sigede_auth_user');
        window.location.href = '/admin/login';
      } else {
        console.log('✅ AdminLayout: Valid admin user:', userData.role);
      }
    } catch (e) {
      console.log('❌ AdminLayout: Invalid user data, redirecting to login');
      localStorage.removeItem('sigede_auth_user');
      window.location.href = '/admin/login';
    }
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Admin Layout: Logout initiated');
      
      // Set flag FIRST to prevent auth check from running
      sessionStorage.setItem('admin_logout_in_progress', 'true');
      
      // Show loading state to prevent interaction during logout
      const logoutButton = document.querySelector('[data-logout-btn]');
      if (logoutButton) {
        logoutButton.setAttribute('disabled', 'true');
        logoutButton.textContent = 'Logging out...';
      }
      
      // Manual logout process for immediate effect
      console.log('🚪 Admin Layout: Starting manual logout process');
      
      // Clear all auth data immediately
      localStorage.clear(); // Clear everything
      sessionStorage.setItem('admin_logout_in_progress', 'true'); // Keep this flag
      
      try {
        await logout('admin');
      } catch (error) {
        console.error('Context logout failed, but continuing with manual logout');
      }
      
      // Clean up and redirect
      sessionStorage.removeItem('admin_logout_in_progress');
      
      // Force immediate redirect
      console.log('✅ Admin Layout: Forcing redirect to login');
      window.location.replace('/admin/login'); // Use replace instead of href
    } catch (error) {
      console.error('Admin Layout: Logout error:', error);
      // Clear everything on error
      localStorage.clear();
      sessionStorage.clear();
      
      // Force redirect even on error
      window.location.replace('/admin/login');
    }
  };

  const menuItems = [
    { label: 'Home', path: '/admin/home' },
    { label: 'Kelola Pengguna', path: '/admin/kelola-pengguna' },
    { label: 'E-News', path: '/admin/e-news' },
    { label: 'Profil Desa', path: '/admin/profil-desa' },
    { label: 'Regulasi Desa', path: '/admin/regulasi' },
    { label: 'Keuangan', path: '/admin/keuangan' },
    { label: 'Data Desa', path: '/admin/data-desa' },
    { label: 'Layanan Publik', path: '/admin/layanan-publik' },
    { label: 'IKM', path: '/admin/ikm' },
    { label: 'Wisata & Budaya', path: '/admin/wisata-budaya' },
    { label: 'Pengaduan', path: '/admin/pengaduan' },
    { label: 'E-UMKM', path: '/admin/e-umkm' },
    { label: 'Pengaturan', path: '/admin/pengaturan' },
  ];
  // Find active index by matching pathname
  const activeIndex = menuItems.findIndex(item => pathname?.startsWith(item.path));
  // top-right account avatar removed per request


  return (
    <>
      <AdminProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex font-sans text-gray-800 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-32 w-80 h-80 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        </div>

        {/* Professional Sidebar */}
        <aside className="hidden md:flex md:w-80 flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl relative z-10 h-screen overflow-hidden">
          {/* Sidebar Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-blue-50/40"></div>
          
          {/* Logo Section */}
          <div className="relative flex items-center justify-center py-8 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                <Image 
                  src="/logo/Logo_BGD1.png"
                  alt="Logo BGD"
                  width={60}
                  height={60}
                  className="w-16 h-16 object-contain filter brightness-0 invert"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>
          </div>

          {/* Brand Title */}
          <div className="relative text-center mb-6 px-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SiGede DPKJ
            </h1>
            <p className="text-sm text-gray-500 font-medium">Admin Dashboard</p>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-blue-600 capitalize truncate font-medium">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🚪 Direct Logout: Clearing all data and redirecting');
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/admin/login';
                  }}
                  data-logout-btn
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="relative flex-1 px-4 space-y-2 overflow-y-auto sidebar-scroll">
            {menuItems.map((item, idx) => {
              const isActive = activeIndex === idx;
              const iconColors = [
                'from-red-500 to-pink-600',      // Home
                'from-blue-500 to-indigo-600',   // Kelola Pengguna  
                'from-green-500 to-emerald-600', // E-News
                'from-purple-500 to-violet-600', // Profil Desa
                'from-orange-500 to-red-600',    // Regulasi
                'from-cyan-500 to-blue-600',     // Keuangan
                'from-pink-500 to-rose-600',     // Data Desa
                'from-indigo-500 to-purple-600', // Layanan Publik
                'from-teal-500 to-green-600',    // IKM
                'from-yellow-500 to-orange-600', // Wisata & Budaya
                'from-violet-500 to-purple-600', // Pengaduan
                'from-emerald-500 to-teal-600',  // E-UMKM
                'from-gray-500 to-slate-600'     // Pengaturan
              ];
              
              return (
                <button
                  key={item.label}
                  onClick={() => window.location.href = item.path}
                  className={`group relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-xl shadow-red-200' 
                      : 'text-gray-700 hover:bg-white/80 hover:shadow-lg'
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20 shadow-lg' 
                      : `bg-gradient-to-br ${iconColors[idx]} shadow-md group-hover:shadow-lg`
                  }`}>
                    <span className="relative z-10">
                      {idx === 0 && <RenderIcon name="home" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 1 && <RenderIcon name="users" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 2 && <RenderIcon name="newspaper" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 3 && <RenderIcon name="layers" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 4 && <RenderIcon name="file" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 5 && <RenderIcon name="wallet" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 6 && <RenderIcon name="bar-chart" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 7 && <RenderIcon name="briefcase" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 8 && <RenderIcon name="star" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 9 && <RenderIcon name="map" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 10 && <RenderIcon name="message" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 11 && <RenderIcon name="shopping-bag" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 12 && <RenderIcon name="settings" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                    </span>
                    
                    {/* Hover Glow Effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/20 transition-all duration-300"></div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`flex-1 text-left font-semibold transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"></div>
                  )}
                  
                  {/* Hover Arrow */}
                  {!isActive && (
                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Section */}
          <div className="relative mt-auto p-4 border-t border-gray-200/50">
            <div className="text-center text-xs text-gray-400">
              © 2024 SiGede DPKJ
            </div>
          </div>
        </aside>

      {/* Enhanced Mobile Navigation */}
      <div className="md:hidden w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-xl relative z-20">
        {/* Mobile Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Image 
                src="/logo/Logo_BGD1.png"
                alt="Logo BGD"
                width={24}
                height={24}
                className="w-6 h-6 object-contain filter brightness-0 invert"
              />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">SiGede</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide">
          {menuItems.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={item.label}
                onClick={() => window.location.href = item.path}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Main Content */}
      <main className="flex-1 relative z-10 md:px-8 px-4 py-6 md:py-8 overflow-auto">
        {/* Professional Content Container */}
        <div className="max-w-full mx-auto">
          {children}
        </div>
        
        {/* Floating Action Button (Optional) */}
        <div className="fixed bottom-8 right-8 z-50 md:hidden">
          <button className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-red-200 hover:shadow-2xl transform hover:scale-110 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </main>
        </div>
      </AdminProvider>
    </>
  );
}
