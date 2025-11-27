"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider } from './AdminContext';
import { useAuth } from '../../../contexts/AuthContext';
import { hasPermission } from '../../../lib/rolePermissions';
import { UserRole } from '../../masyarakat/lib/useCurrentUser';
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
    case 'clipboard': return (<svg {...baseProps}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>);
    case 'document-text': return (<svg {...baseProps}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>);
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [animateMenu, setAnimateMenu] = useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const scrollPositionRef = React.useRef<number>(0);

  // Save scroll position on scroll
  useEffect(() => {
    const sidebar = sidebarRef.current?.querySelector('nav');
    if (!sidebar) return;
    
    const saveScroll = () => {
      scrollPositionRef.current = sidebar.scrollTop;
      sessionStorage.setItem('admin-sidebar-scroll', String(sidebar.scrollTop));
    };
    
    sidebar.addEventListener('scroll', saveScroll, { passive: true });
    return () => sidebar.removeEventListener('scroll', saveScroll);
  }, []);

  // Restore scroll position on mount and navigation
  useEffect(() => {
    const sidebar = sidebarRef.current?.querySelector('nav');
    if (!sidebar) return;
    
    // Restore from sessionStorage or ref
    const savedScroll = sessionStorage.getItem('admin-sidebar-scroll');
    const scrollPos = savedScroll ? parseInt(savedScroll) : scrollPositionRef.current;
    
    if (scrollPos > 0) {
      requestAnimationFrame(() => {
        sidebar.scrollTop = scrollPos;
      });
    }
  }, [pathname]);

  // Initialize animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      const menuTimer = setTimeout(() => {
        setAnimateMenu(true);
      }, 300);
      return () => clearTimeout(menuTimer);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Note: Auth check is now handled by /admin/layout.tsx
  // This component only handles UI layout (sidebar, navigation, etc.)

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Admin Layout: Logout initiated');
      
      // Set flag FIRST to prevent auth check from running
      sessionStorage.setItem('admin_logout_in_progress', 'true');
      
      // Clear all auth data immediately
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('admin_logout_in_progress', 'true'); // Keep this flag
      
      try {
        await logout('admin');
      } catch (error) {
        console.error('Context logout failed, but continuing with manual logout');
      }
      
      // Clean up
      sessionStorage.removeItem('admin_logout_in_progress');
      
      // Force immediate redirect
      console.log('✅ Admin Layout: Forcing redirect to login');
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Admin Layout: Logout error:', error);
      // Clear everything on error
      localStorage.clear();
      sessionStorage.clear();
      
      // Force redirect even on error
      window.location.href = '/admin/login';
    }
  };

  // Define all menu items with their permission keys
  // NOTE: Order matters! More specific paths should come BEFORE general paths
  const allMenuItems = [
    { label: 'Home', path: '/admin/home', key: null }, // Home always accessible
    { label: 'Super Admin', path: '/admin/super-admin', key: 'super-admin' },
    { label: 'Kelola Pengguna', path: '/admin/kelola-pengguna', key: 'kelola-pengguna' },
    { label: 'E-News', path: '/admin/e-news', key: 'e-news' },
    { label: 'Profil Desa', path: '/admin/profil-desa', key: 'profil-desa' },
    { label: 'Regulasi Desa', path: '/admin/regulasi', key: 'regulasi-desa' },
    { label: 'Keuangan', path: '/admin/keuangan', key: 'keuangan' },
    { label: 'Data Desa', path: '/admin/data-desa', key: 'data-desa' },
    { label: 'Form Taring Dukcapil', path: '/admin/layanan-publik/taring-dukcapil', key: 'layanan-publik' }, // Specific path first
    { label: 'Layanan Publik', path: '/admin/layanan-publik', key: 'layanan-publik' }, // General path after
    { label: 'IKM', path: '/admin/ikm', key: 'ikm' },
    { label: 'Wisata & Budaya', path: '/admin/wisata-budaya', key: 'wisata-budaya' },
    { label: 'Pengaduan', path: '/admin/pengaduan', key: 'pengaduan' },
    { label: 'E-UMKM', path: '/admin/e-umkm', key: 'e-umkm' },
    { label: 'Pengaturan', path: '/admin/pengaturan', key: null }, // Settings always accessible
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (item.key === null) return true; // Always show Home and Settings
    if (!user?.role) return false; // No role, hide all permission-based items
    return hasPermission(user.role as UserRole, item.key as any, 'read');
  });
  
  // Find active index by matching pathname (check longer paths first for exact match)
  const activeIndex = menuItems.findIndex(item => {
    // Exact match first
    if (pathname === item.path) return true;
    // For nested routes, ensure it starts with the path and has a trailing slash or segment
    if (pathname?.startsWith(item.path + '/')) return true;
    return false;
  });


  return (
    <AdminProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
        {/* Desktop Sidebar - Fixed Position */}
        <aside ref={sidebarRef} className="hidden md:flex md:w-80 flex-col bg-white border-r border-gray-200 shadow-lg fixed top-0 left-0 h-screen z-30">
          
          {/* Logo Section */}
          <div className="relative flex items-center justify-center py-8 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Image 
                  src="/logo/Logo_BGD1.png"
                  alt="Logo BGD"
                  width={60}
                  height={60}
                  className="w-16 h-16 object-contain filter brightness-0 invert"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
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
            <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-md">
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
                  onClick={handleLogout}
                  type="button"
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
          <nav className="relative flex-1 px-4 space-y-2 overflow-y-auto sidebar-scroll pb-24 scroll-smooth">
            {menuItems.map((item, idx) => {
              const isActive = activeIndex === idx;
              const iconColors = [
                'from-red-500 to-pink-600',      // Home
                'from-blue-500 to-indigo-600',   // Super Admin
                'from-green-500 to-emerald-600', // Kelola Pengguna  
                'from-purple-500 to-violet-600', // E-News
                'from-orange-500 to-red-600',    // Profil Desa
                'from-cyan-500 to-blue-600',     // Regulasi
                'from-pink-500 to-rose-600',     // Keuangan
                'from-indigo-500 to-purple-600', // Data Desa
                'from-teal-500 to-cyan-600',     // Layanan Publik
                'from-red-500 to-pink-500',      // Form Taring Dukcapil
                'from-yellow-500 to-orange-600', // IKM
                'from-violet-500 to-purple-600', // Wisata & Budaya
                'from-emerald-500 to-teal-600',  // Pengaduan
                'from-amber-500 to-orange-600',  // E-UMKM
                'from-gray-500 to-slate-600'     // Pengaturan
              ];
              
              return (
                <button
                  key={item.label}
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate without scrolling to top
                    router.push(item.path);
                  }}
                  className={`group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  {/* Icon Container */}
                  <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${iconColors[idx]}`
                  }`}>
                    <span className="relative z-10">
                      {idx === 0 && <RenderIcon name="home" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 1 && <RenderIcon name="users" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 2 && <RenderIcon name="newspaper" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 3 && <RenderIcon name="layers" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 4 && <RenderIcon name="file" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 5 && <RenderIcon name="building" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 6 && <RenderIcon name="wallet" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 7 && <RenderIcon name="bar-chart" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 8 && <RenderIcon name="clipboard" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 9 && <RenderIcon name="document-text" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 10 && <RenderIcon name="help-circle" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 11 && <RenderIcon name="map" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 12 && <RenderIcon name="message" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 13 && <RenderIcon name="shopping-bag" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                      {idx === 14 && <RenderIcon name="settings" className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />}
                    </span>
                  </div>
                  
                  {/* Label */}
                  <span className={`flex-1 text-left font-semibold transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
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

          {/* Logout Button */}
          <div className="relative px-4 pb-4 mt-auto z-50">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              type="button"
              className="relative w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-colors duration-300 shadow-md cursor-pointer z-50"
            >
              <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="pointer-events-none">Logout</span>
            </button>
          </div>

          {/* Footer Section */}
          <div className="relative p-4 border-t border-gray-200/50 z-40">
            <div className="text-center text-xs text-gray-400">
              © 2024 SiGede DPKJ
            </div>
          </div>
        </aside>

        {/* Mobile Navigation - Fixed Top */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
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
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        </div>

        {/* Main Content Area */}
        <main className="md:ml-80 pt-32 md:pt-0 min-h-screen">
          <div className="px-4 md:px-8 py-6 md:py-8 max-w-full">
            {children}
          </div>
        </main>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50 md:hidden">
          <button className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </AdminProvider>
  );
}
