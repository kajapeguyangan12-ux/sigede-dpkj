"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLaporanByUser, subscribeToUserLaporan, LaporanPengaduan, StatusLaporan } from '@/lib/laporanPengaduanService';
import { useAuth } from '@/contexts/AuthContext';
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import Image from 'next/image';

// Interfaces
interface RiwayatItem {
  id: string;
  type: 'layanan' | 'laporan';
  title: string;
  subtitle?: string;
  status: string;
  date: any;
  data: any;
}

// Mock services - replace with actual imports
const useCurrentUser = () => {
  const { user } = useAuth();
  return { user, loading: false };
};

const layananPublikService = {
  getUserSubmissions: async (uid: string) => {
    return [];
  }
};

const laporanService = {
  getUserReports: async (uid: string) => {
    try {
      const laporan = await getLaporanByUser(uid);
      return laporan;
    } catch (error) {
      console.error('Error fetching laporan:', error);
      return [];
    }
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'menunggu':
    case 'pending':
      return 'Menunggu';
    case 'disetujui':
    case 'diterima':
    case 'selesai':
      return 'Disetujui';
    case 'ditolak':
      return 'Ditolak';
    case 'diproses':
      return 'Diproses';
    default:
      return 'Status Tidak Diketahui';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'menunggu':
      return 'text-yellow-600 bg-yellow-50';
    case 'diproses':
      return 'text-blue-600 bg-blue-50';
    case 'diterima':
    case 'disetujui':
    case 'selesai':
      return 'text-green-600 bg-green-50';
    case 'ditolak':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'layanan':
      return '📄';
    case 'laporan':
      return '📢';
    default:
      return '📋';
  }
};

export default function RiwayatMasyarakatPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [allData, setAllData] = useState<RiwayatItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'laporan-saya' | 'disimpan'>('laporan-saya');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<RiwayatItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadSampleData = useCallback(() => {
    const sampleData: RiwayatItem[] = [
      {
        id: 'sample1',
        type: 'layanan',
        title: 'Surat Keterangan Domisili',
        subtitle: 'Ahmad Dani - 1234567890123456',
        status: 'disetujui',
        date: new Date(),
        data: {
          jenisLayanan: 'Surat Keterangan Domisili',
          namaLengkap: 'Ahmad Dani',
          nik: '1234567890123456'
        }
      },
      {
        id: 'sample2',
        type: 'laporan',
        title: 'Jalan Rusak di RT 03',
        subtitle: 'Infrastruktur - Sari Indah',
        status: 'diproses',
        date: new Date(Date.now() - 86400000),
        data: {
          judulLaporan: 'Jalan Rusak di RT 03',
          kategoriLaporan: 'Infrastruktur',
          namaLengkap: 'Sari Indah'
        }
      },
      {
        id: 'sample3',
        type: 'layanan',
        title: 'Surat Keterangan Usaha',
        subtitle: 'Budi Santoso - 9876543210123456',
        status: 'menunggu',
        date: new Date(Date.now() - 172800000), // 2 days ago
        data: {
          jenisLayanan: 'Surat Keterangan Usaha',
          namaLengkap: 'Budi Santoso',
          nik: '9876543210123456'
        }
      }
    ];
    setAllData(sampleData);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      if (user?.uid) {
        // Setup real-time listener for laporan
        const unsubscribe = subscribeToUserLaporan(user.uid, (laporanData) => {
          // Process laporan data
          const formattedLaporanData: RiwayatItem[] = laporanData.map((item: any) => ({
            id: item.id,
            type: 'laporan' as const,
            title: item.judul || 'Laporan Pengaduan',
            subtitle: `${item.kategori || 'Kategori'} - ${item.userName || user.displayName || 'Pelapor'}`,
            status: item.status || 'menunggu',
            date: item.createdAt,
            data: item
          }));

          // For now, just use laporan data (layanan data can be added later)
          const sortedData = formattedLaporanData.sort((a, b) => {
            const dateA = a.date?.toDate?.() ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate?.() ? b.date.toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          
          setAllData(sortedData);
          setDataLoading(false);
        });

        // Return cleanup function
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } else {
        // User is null or not authenticated, load sample data
        loadSampleData();
      }
    }
  }, [user?.uid, userLoading, loadSampleData]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    setDataLoading(true);
    try {
      const [layananData, laporanData] = await Promise.all([
        layananPublikService.getUserSubmissions(user.uid),
        laporanService.getUserReports(user.uid)
      ]);

      const formattedData: RiwayatItem[] = [
        ...layananData.map((item: any) => ({
          id: item.id,
          type: 'layanan' as const,
          title: item.jenisPelayanan || item.jenisLayanan || 'Layanan Publik',
          subtitle: `${item.namaLengkap || item.nama || user.displayName || 'Pemohon'} - ${item.nik || 'NIK tidak tersedia'}`,
          status: item.status || 'pending',
          date: item.createdAt || item.tanggalPengajuan,
          data: item
        })),
        ...laporanData.map((item: any) => ({
          id: item.id,
          type: 'laporan' as const,
          title: item.judul || 'Laporan Pengaduan',
          subtitle: `${item.kategori || 'Kategori'} - ${item.userName || user.displayName || 'Pelapor'}`,
          status: item.status || 'menunggu',
          date: item.createdAt,
          data: item
        }))
      ].sort((a, b) => {
        const dateA = a.date?.toDate?.() ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate?.() ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setAllData(formattedData);
    } catch (error) {
      console.error('Error loading riwayat data:', error);
      // Fallback: Show sample data if real data fails
      loadSampleData();
    } finally {
      setDataLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };



  const filteredData = allData.filter(item => {
    // Filter berdasarkan tab
    if (activeTab === 'disimpan') {
      // Untuk tab disimpan, tampilkan item yang disimpan (bisa ditambah logic nanti)
      return false; // Sementara kosong
    }
    
    // Filter berdasarkan pencarian
    if (searchQuery) {
      return item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when search query or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-3 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-2 rounded-md ${
              currentPage === page
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-3 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
      <div className="mx-auto w-full max-w-md px-3 sm:px-4 pb-24 sm:pb-28 pt-4">
        <HeaderCard title="Aktivitas" backUrl="/masyarakat/home" showBackButton={false} />

        {/* Tabs */}
        <div className="flex mb-4 bg-white rounded-2xl p-1 shadow ring-1 ring-black/10">
          <button
            onClick={() => setActiveTab('laporan-saya')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'laporan-saya'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Laporan Saya
          </button>
          <button
            onClick={() => setActiveTab('disimpan')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'disimpan'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Disimpan
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'disimpan' && (
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-600 focus:border-red-600 sm:text-sm"
              />
            </div>
          </div>
        )}

        {(userLoading || dataLoading) ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : activeTab === 'disimpan' ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Item yang disimpan</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Yuk perhatikan sekitar desa sama dan buat laporan di fitur Pengaduan!
            </p>
          </div>
        ) : !userLoading && !dataLoading && filteredData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kamu belum pernah membuat laporan</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Yuk perhatikan sekitar desa sama dan buat laporan di fitur Pengaduan!
            </p>
            <div className="mt-6">
              <button 
                onClick={() => router.push('/masyarakat/pengaduan/create')}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 transition-colors font-medium"
              >
                Buat Laporan
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {currentData.map((item, idx) => (
              <li 
                key={item.id} 
                className="rounded-2xl border bg-white/95 p-3 sm:p-4 shadow ring-1 ring-black/10 backdrop-blur transition-all hover:shadow-md cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white text-xl">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{formatDate(item.date)}</div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 line-clamp-2 mb-1">{item.subtitle}</div>
                    )}
                    
                    {/* Additional Info for Laporan */}
                    {item.type === 'laporan' && item.data && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.data.noTelepon && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{item.data.noTelepon}</span>
                          </div>
                        )}
                        {item.data.alamat && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-1">{item.data.alamat}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {filteredData.length > 0 && <PaginationComponent />}

        {/* Results info */}
        {filteredData.length > 0 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
          </div>
        )}

      </div>
      <BottomNavigation />

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in-0"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Detail {selectedItem.type === 'laporan' ? 'Laporan' : 'Layanan'}</h2>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white/90`}>
                    {getStatusText(selectedItem.status)}
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

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
              {selectedItem.type === 'laporan' ? (
                <>
                  {/* Title & Category */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedItem.data.judul}</h3>
                    <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                      {selectedItem.data.kategori}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Isi Laporan</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedItem.data.isi}</p>
                  </div>

                  {/* Photo */}
                  {selectedItem.data.fotoUrl && (
                    <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-100">
                      <Image
                        src={selectedItem.data.fotoUrl}
                        alt="Foto laporan"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Tanggal</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(selectedItem.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Pelapor</p>
                        <p className="text-sm font-bold text-gray-900">{selectedItem.data.userName || 'Tidak diketahui'}</p>
                      </div>
                    </div>

                    {selectedItem.data.noTelepon && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Telepon</p>
                          <p className="text-sm font-bold text-gray-900">{selectedItem.data.noTelepon}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.data.alamat && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Alamat</p>
                          <p className="text-sm font-bold text-gray-900">{selectedItem.data.alamat}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.data.tanggapan && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Tanggapan Admin
                        </h4>
                        <p className="text-blue-800 text-sm">{selectedItem.data.tanggapan}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Layanan detail */
                <div>
                  <p className="text-gray-600">Detail layanan akan ditampilkan di sini</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}