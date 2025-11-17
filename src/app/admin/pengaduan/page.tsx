'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { 
  getAllLaporan,
  updateStatusLaporan,
  LaporanPengaduan,
  StatusLaporan
} from '../../../lib/laporanPengaduanService';
import { getDataDesa } from '../../../lib/dataDesaService';
import { useCurrentUser } from '../../masyarakat/lib/useCurrentUser';
import { UserRole } from '../../masyarakat/lib/useCurrentUser';
import Link from 'next/link';
import Image from 'next/image';

type FilterType = 'all' | 'menunggu' | 'approved_admin' | 'approved_kadus' | 'approved_kades' | 'diproses' | 'disetujui' | 'selesai' | 'ditolak' | 'auto_approved';
type SortType = 'newest' | 'oldest' | 'priority';

const KATEGORI_OPTIONS = [
  'Infrastruktur',
  'Keamanan', 
  'Lingkungan',
  'Pelayanan',
  'Kesehatan',
  'Pendidikan',
  'Lainnya'
];

const STATUS_CONFIG = {
  menunggu: {
    label: 'Menunggu Approval Admin',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    icon: '⏳'
  },
  approved_admin: {
    label: 'Approved Admin - Menunggu Kadus',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: '📋'
  },
  approved_kadus: {
    label: 'Approved Kadus - Menunggu Kades',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    icon: '✓'
  },
  approved_kades: {
    label: 'Approved Kades - Siap Diproses',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: '✅'
  },
  auto_approved: {
    label: 'Auto-Approved (Kadus Timeout)',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    icon: '⚡'
  },
  diproses: {
    label: 'Diproses',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: '🔄'
  },
  disetujui: {
    label: 'Disetujui',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: '✅'
  },
  selesai: {
    label: 'Selesai',
    color: 'from-green-600 to-teal-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    icon: '✔️'
  },
  ditolak: {
    label: 'Ditolak',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: '❌'
  }
};

export default function AdminPengaduanPage() {
  const { user: currentUser } = useCurrentUser();
  const [laporanList, setLaporanList] = useState<LaporanPengaduan[]>([]);
  const [loading, setLoading] = useState(false); // Only for data operations, not navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [userDaerah, setUserDaerah] = useState<string>('');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanPengaduan | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<StatusLaporan>('menunggu');
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [alasanTolak, setAlasanTolak] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserDaerah();
    fetchLaporan();
  }, []);

  // Fetch daerah user dari data-desa berdasarkan NIK
  const fetchUserDaerah = async () => {
    if ((currentUser?.role === 'admin_desa' || currentUser?.role === 'kepala_dusun') && currentUser?.nik) {
      try {
        const allData = await getDataDesa();
        const userData = allData.find(d => d.nik === currentUser.nik);
        if (userData?.daerah) {
          setUserDaerah(userData.daerah);
        }
      } catch (error) {
        console.error('Error fetching user daerah:', error);
      }
    }
  };

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const data = await getAllLaporan();
      setLaporanList(data);
    } catch (error) {
      console.error('Error fetching laporan:', error);
      alert('Gagal memuat data pengaduan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedLaporan?.id || !newStatus) return;
    
    try {
      setSubmitting(true);
      
      await updateStatusLaporan(selectedLaporan.id, newStatus, catatanAdmin || undefined);
      await fetchLaporan();
      
      setShowStatusModal(false);
      setShowDetailModal(false);
      setNewStatus('menunggu');
      setCatatanAdmin('');
      setAlasanTolak('');
      
      alert('Status berhasil diperbarui');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal memperbarui status');
    } finally {
      setSubmitting(false);
    }
  };

  // Function khusus untuk approval oleh admin desa
  const handleApproveByAdmin = async (laporanId: string) => {
    try {
      setSubmitting(true);
      await updateStatusLaporan(laporanId, 'approved_admin', 'Pengaduan telah disetujui oleh Admin Desa. Menunggu persetujuan Kepala Dusun untuk diproses lebih lanjut.');
      await fetchLaporan();
      alert('Pengaduan berhasil disetujui oleh Admin Desa');
    } catch (error) {
      console.error('Error approving laporan by admin:', error);
      alert('Gagal menyetujui pengaduan');
    } finally {
      setSubmitting(false);
    }
  };

  // Function khusus untuk approval oleh kepala dusun
  const handleApproveByKadus = async (laporanId: string) => {
    try {
      setSubmitting(true);
      await updateStatusLaporan(laporanId, 'approved_kadus', 'Pengaduan telah disetujui oleh Kepala Dusun. Menunggu persetujuan Kepala Desa.');
      await fetchLaporan();
      alert('Pengaduan berhasil disetujui oleh Kepala Dusun');
    } catch (error) {
      console.error('Error approving laporan by kadus:', error);
      alert('Gagal menyetujui pengaduan');
    } finally {
      setSubmitting(false);
    }
  };

  // Function khusus untuk approval oleh kepala desa
  const handleApproveByKades = async (laporanId: string) => {
    try {
      setSubmitting(true);
      await updateStatusLaporan(laporanId, 'approved_kades', 'Pengaduan telah disetujui oleh Kepala Desa dan siap diproses.');
      await fetchLaporan();
      alert('Pengaduan berhasil disetujui oleh Kepala Desa');
    } catch (error) {
      console.error('Error approving laporan by kades:', error);
      alert('Gagal menyetujui pengaduan');
    } finally {
      setSubmitting(false);
    }
  };

  // Function untuk reject oleh admin desa
  const handleReject = async (laporanId: string, reason: string) => {
    try {
      setSubmitting(true);
      await updateStatusLaporan(laporanId, 'ditolak', reason);
      await fetchLaporan();
      alert('Pengaduan berhasil ditolak');
    } catch (error) {
      console.error('Error rejecting laporan:', error);
      alert('Gagal menolak pengaduan');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = (laporan: LaporanPengaduan) => {
    console.log('Data laporan:', laporan);
    console.log('namaLengkap:', laporan.namaLengkap);
    console.log('alamat:', laporan.alamat);
    console.log('noTelepon:', laporan.noTelepon);
    setSelectedLaporan(laporan);
    setShowDetailModal(true);
  };

  const openStatusModal = (laporan: LaporanPengaduan) => {
    setSelectedLaporan(laporan);
    setNewStatus(laporan.status);
    setCatatanAdmin(laporan.tanggapan || '');
    setAlasanTolak('');
    setShowStatusModal(true);
  };

  // Filter and sort dengan role-based logic
  const filteredLaporan = laporanList
    .filter(item => {
      const matchesSearch = 
        item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         item.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.kategori.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
      
      // Role-based filtering logic untuk approval workflow
      let roleBasedFilter = true;
      if (currentUser?.role === 'admin_desa') {
        // Admin desa: filter per daerah, lihat menunggu dan approved_admin
        roleBasedFilter = userDaerah ? item.daerah === userDaerah : true;
      } else if (currentUser?.role === 'kepala_dusun') {
        // Kepala dusun: hanya lihat dari daerah mereka yang approved_admin
        roleBasedFilter = (item.daerah === userDaerah) && 
                          (['approved_admin', 'approved_kadus', 'auto_approved', 'approved_kades', 'diproses', 'disetujui', 'selesai', 'ditolak'].includes(item.status));
      } else if (currentUser?.role === 'kepala_desa') {
        // Kepala desa: lihat semua daerah yang sudah approved_kadus atau auto_approved
        roleBasedFilter = ['approved_kadus', 'auto_approved', 'approved_kades', 'diproses', 'disetujui', 'selesai', 'ditolak'].includes(item.status);
      }
      
      return matchesSearch && matchesFilter && roleBasedFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      } else if (sortBy === 'oldest') {
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      }
      return 0;
    });

  const stats = {
    total: laporanList.length,
    menunggu: laporanList.filter(l => l.status === 'menunggu').length,
    approved_admin: laporanList.filter(l => l.status === 'approved_admin').length,
    approved_kadus: laporanList.filter(l => l.status === 'approved_kadus').length,
    approved_kades: laporanList.filter(l => l.status === 'approved_kades').length,
    auto_approved: laporanList.filter(l => l.status === 'auto_approved').length,
    diproses: laporanList.filter(l => l.status === 'diproses').length,
    selesai: laporanList.filter(l => l.status === 'selesai' || l.status === 'disetujui').length,
    ditolak: laporanList.filter(l => l.status === 'ditolak').length,
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Enhanced Header */}
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 mb-8 sm:mb-10 relative z-40 overflow-hidden max-w-7xl mx-auto mt-6">
          {/* Floating Background Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-red-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-pink-400/5 to-orange-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

          {/* Enhanced AdminHeaderCard with better styling */}
          <div className="w-full bg-gradient-to-r from-white via-orange-50/30 to-red-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
            {/* Enhanced Title Section */}
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/25 transform hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-orange-800 to-red-800 bg-clip-text text-transparent mb-2">
                  Pengaduan Masyarakat
                </h1>
                <p className="text-slate-600 font-medium text-lg">
                  Kelola dan tanggapi pengaduan dari warga
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    Pengaduan Aktif
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Sistem Online
                  </div>
                  {/* Badge Daerah untuk Admin Desa dan Kepala Dusun */}
                  {(currentUser?.role === 'admin_desa' || currentUser?.role === 'kepala_dusun') && userDaerah && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      📍 Daerah: {userDaerah}
                    </div>
                  )}
                  {/* Badge info untuk Kepala Desa */}
                  {currentUser?.role === 'kepala_desa' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                      👁️ Semua Daerah
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced Controls Section */}
            <div className="flex items-center gap-6 relative z-10">
              {/* Enhanced Search Bar */}
              <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-orange-400 hover:shadow-lg transition-all duration-300 group">
                <input
                  type="text"
                  placeholder="Cari pengaduan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
                />
                <svg
                  className="ml-3 text-gray-400 group-hover:text-orange-500 transition-colors duration-300"
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-orange-50 hover:to-orange-100 transition-all duration-300 cursor-pointer shadow-md">
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
                  onClick={() => {}}
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-2xl shadow-lg border border-yellow-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 mb-1">Menunggu</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.menunggu}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">Diproses</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.diproses}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🔄</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">Selesai</p>
                    <p className="text-3xl font-bold text-green-900">{stats.selesai}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">✔️</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">Ditolak</p>
                    <p className="text-3xl font-bold text-red-900">{stats.ditolak}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">❌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="px-8 py-6 bg-white border-t border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari pengaduan, nama pelapor, kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-all"
              >
                <option value="newest">🕐 Terbaru</option>
                <option value="oldest">🕑 Terlama</option>
              </select>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'Semua', count: stats.total },
                { id: 'menunggu', label: 'Menunggu', count: stats.menunggu },
                { id: 'diproses', label: 'Diproses', count: stats.diproses },
                { id: 'disetujui', label: 'Disetujui', count: stats.selesai },
                { id: 'selesai', label: 'Selesai', count: stats.selesai },
                { id: 'ditolak', label: 'Ditolak', count: stats.ditolak }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FilterType)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    activeFilter === filter.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeFilter === filter.id
                      ? 'bg-white/30 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Laporan List */}
        {filteredLaporan.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Tidak Ada Pengaduan</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? 'Tidak ada pengaduan yang sesuai dengan pencarian Anda' : 'Belum ada pengaduan dari masyarakat'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredLaporan.map((laporan) => {
              const statusConfig = STATUS_CONFIG[laporan.status];
              
              return (
                <div
                  key={laporan.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {laporan.fotoUrl ? (
                          <div className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-lg">
                            <img
                              src={laporan.fotoUrl}
                              alt={laporan.judul}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                              {laporan.judul}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {laporan.kategori}
                              </span>
                              <span className={`inline-flex items-center gap-2 px-4 py-1.5 ${statusConfig.bgColor} ${statusConfig.textColor} rounded-full text-sm font-bold`}>
                                <span>{statusConfig.icon}</span>
                                {statusConfig.label}
                              </span>
                              
                              {/* Workflow Status Indicator */}
                              {currentUser?.role === 'admin_desa' && laporan.status === 'menunggu' && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Perlu Approval
                                </span>
                              )}
                              
                              {currentUser?.role === 'kepala_dusun' && laporan.status === 'menunggu' && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Menunggu Admin Approval
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                          {laporan.isi}
                        </p>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-semibold mb-0.5">Pelapor</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{laporan.namaLengkap}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-semibold mb-0.5">Telepon</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{laporan.noTelepon}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500 font-semibold mb-0.5">Alamat</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{laporan.alamat}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 font-semibold mb-0.5">Tanggal</p>
                              <p className="text-sm font-bold text-gray-900 truncate">{formatDate(laporan.createdAt)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => openDetailModal(laporan)}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Detail
                          </button>

                          {/* Button approval khusus untuk admin_desa pada status menunggu */}
                          {currentUser?.role === 'admin_desa' && laporan.status === 'menunggu' && (
                            <button
                              onClick={() => laporan.id && handleApproveByAdmin(laporan.id)}
                              disabled={submitting}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {submitting ? 'Processing...' : 'Approve Admin'}
                            </button>
                          )}

                          {/* Button approval khusus untuk kepala_dusun pada status approved_admin */}
                          {currentUser?.role === 'kepala_dusun' && laporan.status === 'approved_admin' && laporan.daerah === userDaerah && (
                            <button
                              onClick={() => laporan.id && handleApproveByKadus(laporan.id)}
                              disabled={submitting}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {submitting ? 'Processing...' : 'Approve Kadus'}
                            </button>
                          )}

                          {/* Button approval khusus untuk kepala_desa pada status approved_kadus atau auto_approved */}
                          {currentUser?.role === 'kepala_desa' && (laporan.status === 'approved_kadus' || laporan.status === 'auto_approved') && (
                            <>
                              <button
                                onClick={() => laporan.id && handleApproveByKades(laporan.id)}
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {submitting ? 'Processing...' : 'Approve Kades'}
                              </button>
                              {laporan.status === 'auto_approved' && (
                                <span className="text-xs text-orange-600 font-semibold">⚡ Auto-approved</span>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => openStatusModal(laporan)}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Ubah Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedLaporan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="relative p-8 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-1">Detail Pengaduan</h2>
                      <p className="text-orange-100 font-medium">Informasi lengkap pengaduan masyarakat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${STATUS_CONFIG[selectedLaporan.status].color} text-white rounded-2xl text-base font-bold shadow-lg`}>
                      <span className="text-2xl">{STATUS_CONFIG[selectedLaporan.status].icon}</span>
                      Status: {STATUS_CONFIG[selectedLaporan.status].label}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedLaporan.judul}</h3>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-xl text-sm font-bold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {selectedLaporan.kategori}
                    </span>
                  </div>

                  {/* Photos */}
                  {selectedLaporan.fotoUrl && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Foto Pengaduan
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-square">
                          <img
                            src={selectedLaporan.fotoUrl}
                            alt="Foto pengaduan"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(selectedLaporan.fotoUrl, '_blank')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Isi Pengaduan
                    </h4>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl">
                      {selectedLaporan.isi}
                    </p>
                  </div>

                  {/* Reporter Info */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Pelapor
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Nama Lengkap</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedLaporan.namaLengkap || selectedLaporan.userName || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.namaLengkap && (
                          <p className="text-xs text-orange-600 mt-1">* Menggunakan username sebagai fallback</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">NIK</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedLaporan.nik || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.nik && (
                          <p className="text-xs text-gray-500 mt-1">* Data NIK tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">No. Telepon</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedLaporan.noTelepon || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.noTelepon && (
                          <p className="text-xs text-gray-500 mt-1">* Data telepon tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Email</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedLaporan.email || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.email && (
                          <p className="text-xs text-gray-500 mt-1">* Data email tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Alamat</p>
                        <p className="text-base font-bold text-gray-900">
                          {selectedLaporan.alamat || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.alamat && (
                          <p className="text-xs text-gray-500 mt-1">* Data alamat tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">User ID</p>
                        <p className="text-base font-bold text-gray-900">{selectedLaporan.userId || '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Username</p>
                        <p className="text-base font-bold text-gray-900">{selectedLaporan.userName || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedLaporan.tanggapan && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Catatan Admin
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                        {selectedLaporan.tanggapan}
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Tanggal Laporan</p>
                      <p className="text-base font-bold text-gray-900">{formatDate(selectedLaporan.createdAt)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Terakhir Diupdate</p>
                      <p className="text-base font-bold text-gray-900">{formatDate(selectedLaporan.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:shadow-lg transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openStatusModal(selectedLaporan);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                >
                  Ubah Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedLaporan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slideUp">
              {/* Modal Header */}
              <div className="relative p-6 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Ubah Status Pengaduan</h2>
                      <p className="text-orange-100 text-sm">Update status dan tambahkan catatan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Current Info */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{selectedLaporan.judul}</h3>
                  <p className="text-sm text-gray-600">Pelapor: <span className="font-bold">{selectedLaporan.namaLengkap}</span></p>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Pilih Status Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setNewStatus(key as StatusLaporan)}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          newStatus === key
                            ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-lg scale-105`
                            : `${config.bgColor} ${config.textColor} border-gray-200 hover:border-gray-300 hover:shadow-md`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <span className="font-bold">{config.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan Admin */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tanggapan Admin
                  </label>
                  <textarea
                    value={catatanAdmin}
                    onChange={(e) => setCatatanAdmin(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    placeholder="Tambahkan tanggapan untuk masyarakat..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                  className="px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={submitting || !newStatus}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
