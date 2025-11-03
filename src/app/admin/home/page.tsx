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
    'from-red-500 to-pink-600',
    'from-blue-500 to-indigo-600', 
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-green-600',
    'from-yellow-500 to-orange-600',
    'from-violet-500 to-purple-600'
  ];
  
  const colorClass = colors[index % colors.length];
  
  return (
    <div className={`w-20 h-20 bg-gradient-to-br ${colorClass} rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 group-hover:rotate-0 transition-all duration-500`}>
      <RenderIcon name={iconName} className="w-10 h-10 text-white" />
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
    loading: true
  });

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

        console.log('✅ Dashboard statistics loaded successfully');
      } catch (error) {
        console.error('❌ Error fetching dashboard statistics:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      {/* Modern Background with Geometric Patterns */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-200/15 to-pink-200/15 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Enhanced Header */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-10">
            <AdminHeaderCard title="Beranda">
              <AdminHeaderSearchBar />
              <AdminHeaderAccount onLogout={handleLogout} />
            </AdminHeaderCard>
            
            {/* Statistics Section - Dipindahkan ke atas */}
            <div className="mt-8">
              {stats.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-32"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Pengguna */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <RenderIcon name="users" className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-3xl font-bold text-white mb-1">
                          {stats.totalUsers.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-blue-100 font-medium">Total Pengguna</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Layanan Aktif */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <RenderIcon name="briefcase" className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-3xl font-bold text-white mb-1">
                          {stats.activeServices.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-green-100 font-medium">Layanan Aktif</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Data Records */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        <RenderIcon name="database" className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-3xl font-bold text-white mb-1">
                          {stats.dataRecords.toLocaleString('id-ID')}
                        </h4>
                        <p className="text-purple-100 font-medium">Data Records</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gridItems.map((item, index) => (
              <div
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200/50 hover:border-red-300/50"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 via-pink-50/0 to-red-100/0 group-hover:from-red-50/50 group-hover:via-pink-50/30 group-hover:to-red-100/20 transition-all duration-500"></div>
                
                {/* Card Content */}
                <div className="relative p-8 flex flex-col items-center text-center h-full">
                  {/* Enhanced Icon */}
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                    {getEnhancedIcon(item.icon, index)}
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-red-600 transition-colors duration-300 mb-2">
                    {item.label}
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                    {getModuleDescription(item.label)}
                  </p>
                  
                  {/* Hover Arrow */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}></div>
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <RenderIcon name="user" className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Kelola Profil</h3>
                <p className="text-gray-600">Perbarui informasi akun Anda</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setProfileError(''); if (newPassword || confirmPassword) { if (newPassword !== confirmPassword) { setProfileError('Konfirmasi kata sandi tidak cocok'); return; } } setShowProfileModal(false); alert('Perubahan profil disimpan'); }} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input 
                    value={profileUsername} 
                    onChange={(e) => setProfileUsername(e.target.value)} 
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300" 
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email"
                    value={profileEmail} 
                    onChange={(e) => setProfileEmail(e.target.value)} 
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300" 
                  />
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300" 
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kata Sandi Baru</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Masukkan kata sandi baru" 
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Konfirmasi Kata Sandi</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Masukkan ulang kata sandi" 
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all duration-300" 
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-red-700 font-medium">{profileError}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowProfileModal(false)} 
                    className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-300"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-red-200 transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
