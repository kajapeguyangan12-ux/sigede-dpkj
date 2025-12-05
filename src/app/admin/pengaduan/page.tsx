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

  // Lock body scroll when modal opens - iOS compatible
  useEffect(() => {
    if (showDetailModal || showStatusModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showDetailModal, showStatusModal]);

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
        {/* Hero Section with Header - Mobile Optimized */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 bg-[url('/pattern-white.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 sm:w-80 h-48 sm:h-80 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            {/* Title Section - Compact Mobile */}
            <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-lg rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-xl sm:text-2xl md:text-3xl text-white mb-1">
                    Pengaduan Masyarakat
                  </h1>
                  <p className="text-white/90 text-xs sm:text-sm md:text-base">
                    Kelola dan tanggapi pengaduan dari warga
                  </p>
                </div>
              </div>

              {/* Badges - Compact */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-white">Pengaduan Aktif</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-white">Sistem Online</span>
                </div>
                {(currentUser?.role === 'admin_desa' || currentUser?.role === 'kepala_dusun') && userDaerah && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                    <span className="text-xs font-semibold text-white">📍 {userDaerah}</span>
                  </div>
                )}
                {currentUser?.role === 'kepala_desa' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                    <span className="text-xs font-semibold text-white">👁️ Semua Daerah</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
        {/* Statistics Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-yellow-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-yellow-700 mb-1">Menunggu</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-900">{stats.menunggu}</p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-blue-700 mb-1">Diproses</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.diproses}</p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl">🔄</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-green-700 mb-1">Selesai</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.selesai}</p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl">✔️</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-red-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-red-700 mb-1">Ditolak</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-900">{stats.ditolak}</p>
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl">❌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section - Mobile Optimized */}
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 bg-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari pengaduan, nama pelapor, kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium text-sm sm:text-base text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-semibold text-sm sm:text-base text-gray-700 cursor-pointer hover:bg-gray-100 transition-all"
              >
                <option value="newest">🕐 Terbaru</option>
                <option value="oldest">🕑 Terlama</option>
              </select>
            </div>

            {/* Filter Tabs - Mobile Optimized */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
                  className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                    activeFilter === filter.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 sm:ml-2 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold ${
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

        {/* Laporan List - Mobile Optimized */}
        {filteredLaporan.length === 0 && !loading ? (
          <div className="text-center py-12 sm:py-16 md:py-20 px-3 sm:px-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Tidak Ada Pengaduan</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6">
                {searchQuery ? 'Tidak ada pengaduan yang sesuai dengan pencarian Anda' : 'Belum ada pengaduan dari masyarakat'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg transition-all active:scale-95"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-0">
            {filteredLaporan.map((laporan) => {
              const statusConfig = STATUS_CONFIG[laporan.status];
              
              return (
                <div
                  key={laporan.id}
                  className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group"
                >
                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-6">
                      {/* Image - Mobile Optimized */}
                      <div className="w-full sm:w-auto flex-shrink-0">
                        {laporan.fotoUrl ? (
                          <div className="relative w-full h-48 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                            <img
                              src={laporan.fotoUrl}
                              alt={laporan.judul}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <svg className="w-12 h-12 sm:w-10 sm:h-10 md:w-16 md:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content - Mobile Optimized */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                              {laporan.judul}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-xs sm:text-sm font-bold">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {laporan.kategori}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 ${statusConfig.bgColor} ${statusConfig.textColor} rounded-full text-xs sm:text-sm font-bold`}>
                                <span>{statusConfig.icon}</span>
                                {statusConfig.label}
                              </span>
                              
                              {/* Workflow Status Indicator */}
                              {currentUser?.role === 'admin_desa' && laporan.status === 'menunggu' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Perlu Approval
                                </span>
                              )}
                              
                              {currentUser?.role === 'kepala_dusun' && laporan.status === 'menunggu' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Menunggu Admin Approval
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4 line-clamp-2">
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

                        {/* Action Buttons - Mobile Optimized */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                          <button
                            onClick={() => openDetailModal(laporan)}
                            className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="w-full sm:flex-1 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Detail Modal - Mobile Optimized */}
        {showDetailModal && selectedLaporan && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowDetailModal(false)}
          >
            <div 
              className="bg-white rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-hidden animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Mobile Optimized */}
              <div className="relative p-4 sm:p-6 md:p-8 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-lg rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1">Detail Pengaduan</h2>
                      <p className="text-xs sm:text-sm text-orange-100 font-medium truncate">Informasi lengkap pengaduan masyarakat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg sm:rounded-xl transition-all flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - Mobile Optimized */}
              <div className="p-3 sm:p-5 md:p-8 overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[calc(90vh-200px)]">
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r ${STATUS_CONFIG[selectedLaporan.status].color} text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold shadow-lg`}>
                      <span className="text-lg sm:text-xl md:text-2xl">{STATUS_CONFIG[selectedLaporan.status].icon}</span>
                      Status: {STATUS_CONFIG[selectedLaporan.status].label}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">{selectedLaporan.judul}</h3>
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {selectedLaporan.kategori}
                    </span>
                  </div>

                  {/* Photos - Mobile Optimized */}
                  {selectedLaporan.fotoUrl && (
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Foto Pengaduan
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg aspect-square">
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

                  {/* Description - Mobile Optimized */}
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Isi Pengaduan
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl">
                      {selectedLaporan.isi}
                    </p>
                  </div>

                  {/* Reporter Info - Mobile Optimized */}
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Pelapor
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Nama Lengkap</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {selectedLaporan.namaLengkap || selectedLaporan.userName || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.namaLengkap && (
                          <p className="text-xs text-orange-600 mt-1">* Menggunakan username sebagai fallback</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">NIK</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {selectedLaporan.nik || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.nik && (
                          <p className="text-xs text-gray-500 mt-1">* Data NIK tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">No. Telepon</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {selectedLaporan.noTelepon || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.noTelepon && (
                          <p className="text-xs text-gray-500 mt-1">* Data telepon tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Email</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {selectedLaporan.email || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.email && (
                          <p className="text-xs text-gray-500 mt-1">* Data email tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl col-span-1 sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Alamat</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          {selectedLaporan.alamat || 'Tidak tersedia'}
                        </p>
                        {!selectedLaporan.alamat && (
                          <p className="text-xs text-gray-500 mt-1">* Data alamat tidak diisi</p>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">User ID</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">{selectedLaporan.userId || '-'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Username</p>
                        <p className="text-sm sm:text-base font-bold text-gray-900">{selectedLaporan.userName || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes - Mobile Optimized */}
                  {selectedLaporan.tanggapan && (
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Catatan Admin
                      </h4>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-blue-50 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-200">
                        {selectedLaporan.tanggapan}
                      </p>
                    </div>
                  )}

                  {/* Timestamps - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Tanggal Laporan</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">{formatDate(selectedLaporan.createdAt)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                      <p className="text-xs sm:text-sm text-gray-500 font-semibold mb-1">Terakhir Diupdate</p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">{formatDate(selectedLaporan.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Mobile Optimized */}
              <div className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 md:py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-white text-gray-700 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openStatusModal(selectedLaporan);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  Ubah Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal - Mobile Optimized */}
        {showStatusModal && selectedLaporan && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowStatusModal(false)}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            <div 
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-auto sm:min-w-[600px] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform'
              }}
            >
              {/* Modal Header - Compact */}
              <div className="relative p-4 sm:p-5 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">Ubah Status Pengaduan</h2>
                      <p className="text-white/90 text-xs sm:text-sm">Update status dan tambahkan catatan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors flex-shrink-0"
                    aria-label="Tutup"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable with momentum */}
              <div 
                className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Current Info - Compact */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">{selectedLaporan.judul}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Pelapor: <span className="font-semibold">{selectedLaporan.namaLengkap}</span></p>
                </div>

                {/* Status Selection - Optimized Grid */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Pilih Status Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewStatus(key as StatusLaporan)}
                        className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                          newStatus === key
                            ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-md`
                            : `${config.bgColor} border-gray-200 active:border-gray-300`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl flex-shrink-0">{config.icon}</span>
                          <span className={`font-semibold text-xs sm:text-sm ${newStatus === key ? 'text-white' : 'text-gray-800'}`}>{config.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tanggapan Admin - Optimized */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tanggapan Admin
                  </label>
                  <textarea
                    value={catatanAdmin}
                    onChange={(e) => setCatatanAdmin(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm sm:text-base text-gray-800 placeholder:text-gray-400 transition-shadow"
                    placeholder="Tambahkan tanggapan untuk masyarakat..."
                    style={{ 
                      WebkitOverflowScrolling: 'touch'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer - Compact & Fixed */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-white text-gray-700 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl border-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={submitting || !newStatus}
                  className="px-5 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Menyimpan...</span>
                      <span className="sm:hidden">...</span>
                    </span>
                  ) : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
