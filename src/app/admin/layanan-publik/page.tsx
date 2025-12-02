"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from "../components/AdminLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../lib/logoutHelper";
import { 
  getAllLayananPublik, 
  updateStatusLayanan, 
  LayananPublik,
  getLayananStats,
  approveByAdmin,
  approveByKadus,
  markAsCompleted
} from "../../../lib/layananPublikService";
import { getDataDesa } from "../../../lib/dataDesaService";
import { getMasyarakatByNIK } from "../../../lib/masyarakatService";

const jenisLayananList = [
  "Surat Kelakuan Baik",
  "Surat Keterangan Belum Nikah/Kawin", 
  "Surat Keterangan Belum Bekerja",
  "Surat Keterangan Kawin/Menikah",
  "Surat Keterangan Kematian",
  "Surat Keterangan Perjalanan",
  "Pelayanan Taring Dukcapil"
];

// Helper function to format date from YYYY-MM-DD to DD Month YYYY
const formatTanggalLahir = (tanggal: string | undefined): string => {
  if (!tanggal) return '...';
  
  try {
    // Check if date is in YYYY-MM-DD format
    if (tanggal.includes('-')) {
      const date = new Date(tanggal);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    // If already in different format, return as is
    return tanggal;
  } catch (error) {
    return tanggal;
  }
};

export default function LayananPublikAdminPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [layananData, setLayananData] = useState<LayananPublik[]>([]);
  const [filteredData, setFilteredData] = useState<LayananPublik[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLayanan, setSelectedLayanan] = useState<LayananPublik | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [userDaerah, setUserDaerah] = useState<string>("");
  const [nomorSuratKadus, setNomorSuratKadus] = useState<string>("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchUserDaerah();
    fetchData();
    fetchStats();
  }, [user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDetailModal) {
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      // For iOS Safari
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showDetailModal]);

  // Fetch daerah user dari data-desa berdasarkan NIK (hanya untuk kepala_dusun)
  const fetchUserDaerah = async () => {
    if (user?.role === 'kepala_dusun' && user?.nik) {
      try {
        const allData = await getDataDesa();
        const userData = allData.find(d => d.nik === user.nik);
        if (userData?.daerah) {
          setUserDaerah(userData.daerah);
        }
      } catch (error) {
        console.error("Error fetching user daerah:", error);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllLayananPublik();
      
      // Get data-desa to enrich layanan with daerah info
      const dataDesaList = await getDataDesa();
      
      // Enrich layanan data with daerah and personal data from data-desa and masyarakat profile
      const enrichedData = await Promise.all(data.map(async (layanan) => {
        let enriched = { ...layanan };
        
        // Enrich with daerah from data-desa
        if (!enriched.daerah && enriched.nik) {
          const userData = dataDesaList.find(d => d.nik === enriched.nik);
          if (userData?.daerah) {
            enriched.daerah = userData.daerah;
          }
        }
        
        // Enrich with personal data from masyarakat profile if missing
        if (enriched.nik && (!enriched.tempatLahir || !enriched.tanggalLahir || !enriched.jenisKelamin || !enriched.agama || !enriched.pekerjaan)) {
          try {
            const masyarakatData = await getMasyarakatByNIK(enriched.nik);
            if (masyarakatData) {
              enriched = {
                ...enriched,
                tempatLahir: enriched.tempatLahir || masyarakatData.tempatLahir || '',
                tanggalLahir: enriched.tanggalLahir || masyarakatData.tanggalLahir || '',
                jenisKelamin: enriched.jenisKelamin || masyarakatData.jenisKelamin || '',
                agama: enriched.agama || masyarakatData.agama || '',
                pekerjaan: enriched.pekerjaan || masyarakatData.pekerjaan || ''
              };
            }
          } catch (error) {
            console.error(`Error fetching masyarakat data for NIK ${enriched.nik}:`, error);
          }
        }
        
        return enriched;
      }));
      
      // Filter berdasarkan role
      let filtered = enrichedData;
      
      // Kepala Dusun: hanya lihat layanan dari daerah mereka
      if (user?.role === 'kepala_dusun' && userDaerah) {
        filtered = enrichedData.filter(layanan => 
          layanan.daerah === userDaerah
        );
      }
      
      // Admin Desa: lihat semua layanan (untuk monitoring dan approval)
      // Tidak perlu filter khusus, admin desa bisa lihat semua
      
      setLayananData(filtered);
      setFilteredData(filtered);
    } catch (error) {
      console.error("Error fetching layanan:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getLayananStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  // Filter data berdasarkan search, jenis, dan status
  useEffect(() => {
    let filtered = layananData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenisLayanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm)
      );
    }

    if (selectedJenis !== "semua") {
      filtered = filtered.filter(item => item.jenisLayanan === selectedJenis);
    }

    if (selectedStatus !== "semua") {
      filtered = filtered.filter(item => item.status.includes(selectedStatus));
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
  }, [searchTerm, selectedJenis, selectedStatus, layananData]);

  const handleDetailClick = (layanan: LayananPublik) => {
    setSelectedLayanan(layanan);
    setShowDetailModal(true);
  };

  // Pagination calculations with useMemo for optimization
  const paginationData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    return {
      indexOfLastItem,
      indexOfFirstItem,
      currentItems,
      totalPages
    };
  }, [currentPage, itemsPerPage, filteredData]);

  const { indexOfLastItem, indexOfFirstItem, currentItems, totalPages } = paginationData;

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Generate page numbers with ellipsis - memoized
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleApprove = async (layananId: string, role: string) => {
    try {
      setProcessingAction(true);
      if (role === 'admin_desa') {
        await approveByAdmin(layananId, {});
      } else if (role === 'kepala_dusun') {
        // Validasi nomor surat untuk kepala dusun
        if (!nomorSuratKadus || nomorSuratKadus.trim() === '') {
          alert('Nomor surat kepala dusun wajib diisi!');
          setProcessingAction(false);
          return;
        }
        await approveByKadus(layananId, { nomorSuratKadus });
      }
      await fetchData();
      setShowDetailModal(false);
      setNomorSuratKadus(''); // Reset nomor surat
      alert('Permohonan berhasil disetujui!');
    } catch (error) {
      console.error("Error approving:", error);
      alert('Gagal menyetujui permohonan');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTolak = async (layananId: string, alasan: string) => {
    try {
      setProcessingAction(true);
      await updateStatusLayanan(layananId, 'ditolak', { alasanTolak: alasan });
      await fetchData();
      setShowDetailModal(false);
      alert('Permohonan ditolak');
    } catch (error) {
      console.error("Error rejecting:", error);
      alert('Gagal menolak permohonan');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status.includes('approved')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'ditolak') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    // Status text berdasarkan role
    if (user?.role === 'kepala_dusun') {
      const statusMap: Record<string, string> = {
        'pending': 'Menunggu Persetujuan Kepala Dusun',
        'pending_admin': 'Menunggu Persetujuan Kepala Dusun',
        'pending_kadus': 'Menunggu Persetujuan Kepala Dusun',
        'approved_kadus': 'Sudah Disetujui - Menunggu Admin Desa',
        'approved_admin': 'Disetujui Admin Desa',
        'completed': 'Selesai',
        'ditolak': 'Ditolak',
        'auto_approved': 'Disetujui Otomatis'
      };
      return statusMap[status] || status;
    } else if (user?.role === 'admin_desa') {
      const statusMap: Record<string, string> = {
        'pending': 'Pending Kepala Dusun',
        'pending_admin': 'Pending Kepala Dusun',
        'pending_kadus': 'Pending Kepala Dusun',
        'approved_kadus': 'Disetujui Kadus - Menunggu Persetujuan',
        'approved_admin': 'Sudah Disetujui Admin Desa',
        'completed': 'Selesai',
        'ditolak': 'Ditolak',
        'auto_approved': 'Disetujui Otomatis'
      };
      return statusMap[status] || status;
    } else {
      const statusMap: Record<string, string> = {
        'pending': 'Pending Kepala Dusun',
        'pending_admin': 'Pending Kepala Dusun',
        'pending_kadus': 'Pending Kepala Dusun',
        'approved_kadus': 'Disetujui Kadus',
        'approved_admin': 'Disetujui Admin Desa',
        'completed': 'Selesai',
        'ditolak': 'Ditolak',
        'auto_approved': 'Disetujui Otomatis'
      };
      return statusMap[status] || status;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-2 sm:p-4 md:p-6">
        {/* Modern Header Card - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-purple-100 p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Layanan Publik
                </h1>
                <p className="text-gray-600 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">Kelola permohonan layanan masyarakat</p>
                {user?.role === 'kepala_dusun' && userDaerah && (
                  <p className="text-xs sm:text-sm text-purple-600 font-semibold mt-0.5 sm:mt-1">
                    📍 Daerah: {userDaerah}
                  </p>
                )}
                {user?.role === 'kepala_desa' && (
                  <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-0.5 sm:mt-1">
                    👁️ Melihat semua daerah (menunggu approval Kadus)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action - Form Taring Dukcapil Management */}
        {user?.role === 'admin_desa' && (
          <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">Form Taring Dukcapil</h3>
                  <p className="text-xs sm:text-sm text-white/90 mt-0.5">Kelola konten informasi dan persyaratan layanan</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/layanan-publik/taring-dukcapil')}
                className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white text-red-600 font-bold rounded-lg sm:rounded-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Konten
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards - Mobile Optimized */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl border border-yellow-200 p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold truncate">Menunggu</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl border border-blue-200 p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold truncate">Diproses</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{stats.diproses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl border border-green-200 p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold truncate">Selesai</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{stats.selesai || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl border border-red-200 p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl active:scale-95 transition-all">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 text-center sm:text-left">
                <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold truncate">Ditolak</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{stats.ditolak || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama, NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 pl-9 sm:pl-10 md:pl-12 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-gray-900 text-sm sm:text-base"
              />
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-2.5 sm:top-3 md:top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-900 text-sm sm:text-base"
            >
              <option value="semua">Semua Jenis</option>
              {jenisLayananList.map(jenis => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-900 text-sm sm:text-base"
            >
              <option value="semua">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="completed">Selesai</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Layanan Table/Cards - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Desktop Table View - hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Jenis Layanan</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Pemohon</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">NIK</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Daerah</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 font-semibold">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada layanan</h3>
                      <p className="text-gray-600">Belum ada permohonan layanan yang masuk</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((layanan, index) => (
                    <tr key={layanan.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-bold text-gray-900">{indexOfFirstItem + index + 1}</td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900 text-sm lg:text-base">{layanan.jenisLayanan}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-bold text-gray-900">{layanan.namaLengkap}</td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">{layanan.nik}</td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {layanan.daerah ? layanan.daerah.replace(/_/g, ' ') : '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {layanan.createdAt ? new Date(layanan.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className={`px-2 lg:px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(layanan.status)}`}>
                          {getStatusText(layanan.status)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDetailClick(layanan)}
                          className="inline-flex items-center px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs lg:text-sm font-semibold rounded-lg hover:shadow-lg active:scale-95 transition-all"
                        >
                          <svg className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - visible only on mobile */}
          <div className="md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-7 h-7 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 font-semibold text-sm">Memuat data...</span>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="text-5xl mb-3">\ud83d\udcc4</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Tidak ada layanan</h3>
                <p className="text-sm text-gray-600">Belum ada permohonan layanan yang masuk</p>
              </div>
            ) : (
              currentItems.map((layanan, index) => (
                <div key={layanan.id} className="p-3 sm:p-4 hover:bg-purple-50 active:bg-purple-100 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 mb-0.5 line-clamp-2">{layanan.jenisLayanan}</h3>
                        <p className="text-xs text-gray-600 font-semibold">#{indexOfFirstItem + index + 1}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border flex-shrink-0 ${getStatusColor(layanan.status)}`}>
                      {getStatusText(layanan.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-bold text-gray-900 truncate">{layanan.namaLengkap}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="font-mono font-bold text-gray-900">{layanan.nik}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700 truncate">
                        {layanan.daerah ? layanan.daerah.replace(/_/g, ' ') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-gray-700">
                        {layanan.createdAt ? new Date(layanan.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDetailClick(layanan)}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Lihat Detail
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pagination - Mobile Optimized */}
          {filteredData.length > 0 && totalPages > 1 && (
            <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white rounded-xl border border-purple-100">
              <div className="text-xs sm:text-sm text-gray-700 font-semibold text-center sm:text-left">
                Menampilkan <span className="text-purple-600">{indexOfFirstItem + 1}</span> - <span className="text-purple-600">{Math.min(indexOfLastItem, filteredData.length)}</span> dari <span className="text-purple-600">{filteredData.length}</span> data
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg font-semibold text-sm transition-all ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500 text-xs sm:text-sm">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-purple-50 active:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg font-semibold text-sm transition-all ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modern Detail Modal - Optimized for all devices */}
        {showDetailModal && selectedLayanan && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-2 md:p-4 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
          >
            <div 
              className="bg-white rounded-none sm:rounded-xl md:rounded-2xl max-w-5xl w-full h-full sm:h-auto sm:my-4 md:my-8 shadow-2xl border-0 sm:border-2 border-purple-200 sm:max-h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Mobile Optimized */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 rounded-t-none sm:rounded-t-xl md:rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">Detail Permohonan Layanan</h3>
                    <p className="text-purple-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">Informasi lengkap permohonan</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Body - Scrollable */}
              <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto flex-1">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <span className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base lg:text-lg font-bold rounded-full border-2 ${getStatusColor(selectedLayanan.status)} text-center`}>
                    {getStatusText(selectedLayanan.status)}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {/* Informasi Pemohon */}
                  <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-purple-200 sm:border-2">
                    <h4 className="font-bold text-sm sm:text-base md:text-lg text-purple-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Pemohon
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold text-xs sm:text-sm">Nama Lengkap:</span>
                        <p className="text-gray-900 font-bold mt-0.5 sm:mt-1 text-sm sm:text-base">{selectedLayanan.namaLengkap}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">NIK:</span>
                        <p className="text-gray-900 font-bold font-mono mt-1">{selectedLayanan.nik}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">No. KK:</span>
                        <p className="text-gray-900 font-bold font-mono mt-1">{selectedLayanan.noKK}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Alamat:</span>
                        <p className="text-gray-900 font-bold mt-1">{selectedLayanan.alamat}</p>
                      </div>
                      {selectedLayanan.daerah && (
                        <div>
                          <span className="text-gray-600 font-semibold">Daerah:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.daerah}</p>
                        </div>
                      )}
                      {selectedLayanan.noTelepon && (
                        <div>
                          <span className="text-gray-600 font-semibold">No. Telepon:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.noTelepon}</p>
                        </div>
                      )}
                      {selectedLayanan.email && (
                        <div>
                          <span className="text-gray-600 font-semibold">Email:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.email}</p>
                        </div>
                      )}
                      <div className="pt-3 border-t border-purple-300">
                        <span className="text-gray-600 font-semibold">Jenis Layanan:</span>
                        <p className="text-gray-900 font-bold mt-1">{selectedLayanan.jenisLayanan}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Tanggal Permohonan:</span>
                        <p className="text-gray-900 font-bold mt-1">
                          {selectedLayanan.createdAt ? new Date(selectedLayanan.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : '-'}
                        </p>
                      </div>
                      {selectedLayanan.keperluan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Keperluan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.keperluan}</p>
                        </div>
                      )}
                      {selectedLayanan.tujuan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tujuan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tujuan}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Surat */}
                  <div className="bg-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-pink-200 sm:border-2">
                    <h4 className="font-bold text-sm sm:text-base md:text-lg text-pink-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Review Surat
                    </h4>
                    <div className="space-y-2 sm:space-y-3 text-xs bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-pink-300 text-gray-900">
                      <div className="text-center mb-2 sm:mb-3 md:mb-4">
                        <p className="font-bold text-xs sm:text-sm text-gray-900">PEMERINTAH KOTA DENPASAR</p>
                        <p className="font-bold text-xs sm:text-sm text-gray-900">KECAMATAN DENPASAR UTARA</p>
                        <p className="font-bold text-xs sm:text-sm text-gray-900">DESA DAUH PURI KAJA</p>
                      </div>
                      <div className="text-center mb-4">
                        <p className="font-bold underline text-gray-900">
                          {selectedLayanan.jenisLayanan === 'Surat Kelakuan Baik' ? 'SURAT KETERANGAN KELAKUAN BAIK' :
                           selectedLayanan.jenisLayanan === 'Surat Keterangan Belum Nikah/Kawin' ? 'SURAT KETERANGAN BELUM PERNAH KAWIN/MENIKAH' :
                           selectedLayanan.jenisLayanan === 'Surat Keterangan Belum Bekerja' ? 'SURAT KETERANGAN BELUM BEKERJA' :
                           selectedLayanan.jenisLayanan === 'Surat Keterangan Kawin/Menikah' ? 'SURAT KETERANGAN KAWIN/MENIKAH' :
                           selectedLayanan.jenisLayanan === 'Surat Keterangan Kematian' ? 'SURAT KETERANGAN KEMATIAN' :
                           selectedLayanan.jenisLayanan === 'Surat Keterangan Perjalanan' ? 'SURAT KETERANGAN PERJALANAN' :
                           'SURAT KETERANGAN'}
                        </p>
                        <p className="text-xs mt-1 text-gray-900">Nomor: ............................</p>
                      </div>
                      <p className="text-justify leading-relaxed text-gray-900">
                        Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, 
                        menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun {selectedLayanan.daerah?.replace(/_/g, ' ') || '...........'}, 
                        Nomor <span className="font-bold text-blue-600">{nomorSuratKadus || '.............................'}</span>, 
                        Tanggal : {selectedLayanan.createdAt ? new Date(selectedLayanan.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : '.......'}, bahwa :
                      </p>
                      <div className="pl-6 space-y-1 text-gray-900">
                        <p className="text-gray-900">Nama: <span className="font-semibold text-gray-900">{selectedLayanan.namaLengkap}</span></p>
                        <p className="text-gray-900">NIK: <span className="font-semibold text-gray-900">{selectedLayanan.nik}</span></p>
                        <p className="text-gray-900">Tempat/Tgl Lahir: <span className="font-semibold text-gray-900">{selectedLayanan.tempatLahir || '...'} / {formatTanggalLahir(selectedLayanan.tanggalLahir)}</span></p>
                        <p className="text-gray-900">Jenis Kelamin: <span className="font-semibold text-gray-900">{selectedLayanan.jenisKelamin || '...'}</span></p>
                        <p className="text-gray-900">Agama: <span className="font-semibold text-gray-900">{selectedLayanan.agama || '...'}</span></p>
                        <p className="text-gray-900">Pekerjaan: <span className="font-semibold text-gray-900">{selectedLayanan.pekerjaan || '...'}</span></p>
                        <p className="text-gray-900">Alamat: <span className="font-semibold text-gray-900">{selectedLayanan.alamat}</span></p>
                        <p className="text-gray-900">Daerah/Banjar: <span className="font-semibold text-gray-900">{selectedLayanan.daerah?.replace(/_/g, ' ') || '...'}</span></p>
                      </div>
                      <p className="text-justify leading-relaxed mt-3 text-gray-900">
                        {selectedLayanan.jenisLayanan === 'Surat Kelakuan Baik' ? 
                          'Sepanjang pengetahuan kami orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berkelakuan baik, tidak pernah tersangkut dalam tindakan kriminal/kejahatan.' :
                         selectedLayanan.jenisLayanan === 'Surat Keterangan Belum Nikah/Kawin' ?
                          'Sepanjang pengetahuan kami memang benar orang tersebut diatas belum pernah kawin/menikah sampai saat ini.' :
                         selectedLayanan.jenisLayanan === 'Surat Keterangan Belum Bekerja' ?
                          'Sepanjang pengetahuan kami memang benar orang tersebut diatas belum bekerja dan tidak terikat kontrak kerja dengan instansi/perusahaan manapun sampai saat ini.' :
                         selectedLayanan.jenisLayanan === 'Surat Keterangan Kawin/Menikah' ?
                          'Sepanjang pengetahuan kami memang benar orang tersebut diatas telah melangsungkan perkawinan dan berstatus sebagai suami/istri yang sah.' :
                         selectedLayanan.jenisLayanan === 'Surat Keterangan Kematian' ?
                          'Telah meninggal dunia pada tanggal .............. di .............. karena ..............' :
                         selectedLayanan.jenisLayanan === 'Surat Keterangan Perjalanan' ?
                          'Orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan akan melakukan perjalanan ke .............. untuk keperluan ..............' :
                         'Orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja.'}
                      </p>
                      <p className="text-justify leading-relaxed text-gray-900">
                        Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk {selectedLayanan.keperluan || '..........'}.
                      </p>
                      <div className="text-right mt-4">
                        <p className="text-xs text-gray-900">Denpasar, {selectedLayanan.createdAt ? new Date(selectedLayanan.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : new Date().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</p>
                        <p className="text-xs font-semibold mt-12 text-gray-900">Perbekel Desa Dauh Puri Kaja</p>
                        <p className="text-xs font-semibold mt-8 text-gray-900">I Gusti Ketut Sucipta, ST.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Data */}
                {(selectedLayanan.tempatLahir || selectedLayanan.tanggalLahir) && (
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-200 sm:border-2">
                    <h4 className="font-bold text-sm sm:text-base md:text-lg text-blue-900 mb-2 sm:mb-3 md:mb-4">Data Pribadi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                      {selectedLayanan.tempatLahir && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tempat Lahir:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tempatLahir}</p>
                        </div>
                      )}
                      {selectedLayanan.tanggalLahir && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tanggal Lahir:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tanggalLahir}</p>
                        </div>
                      )}
                      {selectedLayanan.jenisKelamin && (
                        <div>
                          <span className="text-gray-600 font-semibold">Jenis Kelamin:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.jenisKelamin}</p>
                        </div>
                      )}
                      {selectedLayanan.agama && (
                        <div>
                          <span className="text-gray-600 font-semibold">Agama:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.agama}</p>
                        </div>
                      )}
                      {selectedLayanan.pekerjaan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Pekerjaan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.pekerjaan}</p>
                        </div>
                      )}
                      {selectedLayanan.statusPerkawinan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Status Perkawinan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.statusPerkawinan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Catatan/Alasan Tolak */}
                {selectedLayanan.alasanTolak && (
                  <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-red-200 sm:border-2">
                    <h4 className="font-bold text-sm sm:text-base md:text-lg text-red-900 mb-1 sm:mb-2">Alasan Penolakan</h4>
                    <p className="text-gray-900 font-semibold text-xs sm:text-sm">{selectedLayanan.alasanTolak}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer - Action Buttons */}
              <div className="bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 rounded-b-none sm:rounded-b-xl md:rounded-b-2xl border-t border-gray-200 sm:border-t-2 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 md:gap-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gray-200 text-gray-700 font-bold rounded-lg sm:rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors text-sm sm:text-base"
                  >
                    Tutup
                  </button>
                  
                  {/* Download Surat Button - Only available when approved_admin or completed */}
                  {selectedLayanan.jenisLayanan !== 'Pelayanan Taring Dukcapil' && 
                   (selectedLayanan.status === 'approved_admin' || selectedLayanan.status === 'completed') && (
                    <button
                      onClick={() => window.open(`/admin/layanan-publik/cetak-surat?id=${selectedLayanan.id}`, '_blank')}
                      className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-98 transition-all text-sm sm:text-base"
                    >
                      📥 Download Surat
                    </button>
                  )}
                  
                  {/* Role-based Approve Buttons */}
                  {user?.role === 'admin_desa' && selectedLayanan.status === 'approved_kadus' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedLayanan.id!, 'admin_desa')}
                        disabled={processingAction}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        onClick={() => {
                          const alasan = prompt('Masukkan alasan penolakan:');
                          if (alasan) handleTolak(selectedLayanan.id!, alasan);
                        }}
                        disabled={processingAction}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        ✗ Tolak
                      </button>
                    </>
                  )}
                  
                  {user?.role === 'kepala_dusun' && selectedLayanan.status === 'pending_kadus' && (
                    <>
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                          Nomor Surat Pengantar Kepala Dusun:
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 123/KADUS-WK/XII/2025"
                          value={nomorSuratKadus}
                          onChange={(e) => setNomorSuratKadus(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 sm:border-2 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400 text-sm sm:text-base"
                        />
                        <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                          Nomor surat ini akan digunakan untuk: "...menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun [Nomor Surat]..."
                        </p>
                      </div>
                      <button
                        onClick={() => handleApprove(selectedLayanan.id!, 'kepala_dusun')}
                        disabled={processingAction}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        ✓ Setujui (Kadus)
                      </button>
                      <button
                        onClick={() => {
                          const alasan = prompt('Masukkan alasan penolakan:');
                          if (alasan) handleTolak(selectedLayanan.id!, alasan);
                        }}
                        disabled={processingAction}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg sm:rounded-xl hover:shadow-lg active:scale-98 transition-all disabled:opacity-50 text-sm sm:text-base"
                      >
                        ✗ Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
