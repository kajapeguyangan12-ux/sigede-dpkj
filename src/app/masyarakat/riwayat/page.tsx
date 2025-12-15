"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLaporanByUser, subscribeToUserLaporan, LaporanPengaduan, StatusLaporan, saveLaporan, unsaveLaporan, getSavedLaporanByUser } from '@/lib/laporanPengaduanService';
import { getLayananByUser, LayananPublik, saveLayanan, unsaveLayanan, getSavedLayananByUser } from '@/lib/layananPublikService';
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

// Current user hook
const useCurrentUser = () => {
  const { user } = useAuth();
  return { user, loading: false };
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'menunggu':
    case 'pending':
    case 'pending_kadus':
      return 'Belum di Approve oleh Kepala Dusun';
    case 'disetujui':
    case 'diterima':
    case 'approved_kadus':
    case 'diproses':
      return 'Sudah di Approve Kepala Dusun, Belum di Approve oleh Admin Desa';
    case 'approved_admin':
    case 'selesai':
    case 'completed':
      return 'Sudah di Approve oleh Admin Desa';
    case 'ditolak':
      return 'Ditolak';
    case 'auto_approved':
      return 'Disetujui Otomatis';
    default:
      return 'Status Tidak Diketahui';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'menunggu':
    case 'pending_kadus':
      return 'text-yellow-600 bg-yellow-50';
    case 'diproses':
    case 'approved_kadus':
      return 'text-blue-600 bg-blue-50';
    case 'diterima':
    case 'disetujui':
    case 'approved_admin':
    case 'selesai':
    case 'completed':
    case 'auto_approved':
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
  const itemsPerPage = 4;
  const [savedLaporan, setSavedLaporan] = useState<RiwayatItem[]>([]);
  const [savedLayanan, setSavedLayanan] = useState<RiwayatItem[]>([]);
  const [savingLaporan, setSavingLaporan] = useState<{[key: string]: boolean}>({});
  const [savingLayanan, setSavingLayanan] = useState<{[key: string]: boolean}>({});

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
        setDataLoading(true);
        
        // Setup real-time listener for laporan
        const unsubscribe = subscribeToUserLaporan(user.uid, async (laporanData) => {
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

          // Fetch layanan publik data
          try {
            const layananData = await getLayananByUser(user.uid);
            const formattedLayananData: RiwayatItem[] = layananData.map((item: LayananPublik) => ({
              id: item.id || '',
              type: 'layanan' as const,
              title: item.jenisLayanan || 'Layanan Publik',
              subtitle: `${item.namaLengkap} - ${item.nik}`,
              status: item.status || 'pending_kadus',
              date: item.createdAt,
              data: item
            }));

            // Combine both data
            const combinedData = [...formattedLaporanData, ...formattedLayananData];
            
            const sortedData = combinedData.sort((a, b) => {
              const dateA = a.date?.toDate?.() ? a.date.toDate() : new Date(a.date);
              const dateB = b.date?.toDate?.() ? b.date.toDate() : new Date(b.date);
              return dateB.getTime() - dateA.getTime();
            });
            
            setAllData(sortedData);
          } catch (error) {
            console.error('Error loading layanan data:', error);
            // If layanan fails, still show laporan data
            const sortedData = formattedLaporanData.sort((a, b) => {
              const dateA = a.date?.toDate?.() ? a.date.toDate() : new Date(a.date);
              const dateB = b.date?.toDate?.() ? b.date.toDate() : new Date(b.date);
              return dateB.getTime() - dateA.getTime();
            });
            setAllData(sortedData);
          }
          
          setDataLoading(false);
        });

        // Load saved laporan
        loadSavedLaporan();

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

  const loadSavedLaporan = async () => {
    if (!user?.uid) return;
    
    try {
      const savedData = await getSavedLaporanByUser(user.uid);
      const formattedData: RiwayatItem[] = savedData.map((item: any) => ({
        id: item.id,
        type: 'laporan' as const,
        title: item.judul || 'Laporan Pengaduan',
        subtitle: `${item.kategori || 'Kategori'} - ${item.userName || user.displayName || 'Pelapor'}`,
        status: item.status || 'menunggu',
        date: item.createdAt,
        data: item
      }));
      setSavedLaporan(formattedData);
    } catch (error) {
      console.error('Error loading saved laporan:', error);
    }
  };

  const handleSaveLaporan = async (laporanId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.uid) return;
    
    setSavingLaporan(prev => ({ ...prev, [laporanId]: true }));
    
    try {
      const item = allData.find(d => d.id === laporanId);
      const isSaved = item?.data?.savedBy?.includes(user.uid);
      
      if (isSaved) {
        await unsaveLaporan(laporanId, user.uid);
      } else {
        await saveLaporan(laporanId, user.uid);
      }
      
      // Reload data
      await loadSavedLaporan();
      
      // Update allData to reflect the change immediately
      setAllData(prevData => 
        prevData.map(item => {
          if (item.id === laporanId && item.data) {
            const savedBy = item.data.savedBy || [];
            return {
              ...item,
              data: {
                ...item.data,
                savedBy: isSaved 
                  ? savedBy.filter((id: string) => id !== user.uid)
                  : [...savedBy, user.uid]
              }
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Gagal menyimpan laporan');
    } finally {
      setSavingLaporan(prev => ({ ...prev, [laporanId]: false }));
    }
  };

  const loadSavedLayanan = async () => {
    if (!user?.uid) return;
    
    try {
      const savedData = await getSavedLayananByUser(user.uid);
      const formattedData: RiwayatItem[] = savedData.map((item: any) => ({
        id: item.id,
        type: 'layanan' as const,
        title: item.jenisLayanan || 'Layanan Publik',
        subtitle: `${item.namaLengkap || 'Pemohon'} - ${item.nik || 'NIK tidak tersedia'}`,
        status: item.status || 'pending',
        date: item.createdAt,
        data: item
      }));
      setSavedLayanan(formattedData);
    } catch (error) {
      console.error('Error loading saved layanan:', error);
    }
  };

  const handleSaveLayanan = async (layananId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.uid) return;
    
    setSavingLayanan(prev => ({ ...prev, [layananId]: true }));
    
    try {
      const item = allData.find(d => d.id === layananId);
      const isSaved = item?.data?.savedBy?.includes(user.uid);
      
      if (isSaved) {
        await unsaveLayanan(layananId, user.uid);
      } else {
        await saveLayanan(layananId, user.uid);
      }
      
      // Reload data
      await loadSavedLayanan();
      
      // Update allData to reflect the change immediately
      setAllData(prevData => 
        prevData.map(item => {
          if (item.id === layananId && item.data) {
            const savedBy = item.data.savedBy || [];
            return {
              ...item,
              data: {
                ...item.data,
                savedBy: isSaved 
                  ? savedBy.filter((id: string) => id !== user.uid)
                  : [...savedBy, user.uid]
              }
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error toggling save layanan:', error);
      alert('Gagal menyimpan layanan');
    } finally {
      setSavingLayanan(prev => ({ ...prev, [layananId]: false }));
    }
  };

  const filteredData = (activeTab === 'disimpan' ? [...savedLaporan, ...savedLayanan] : allData).filter(item => {
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
      <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 mb-8 sm:mb-10">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
        >
          ‹
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 sm:px-2 text-gray-400">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base font-medium ${
              currentPage === page
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 sm:px-2 text-gray-400">...</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
        >
          ›
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-48 sm:pb-52 pt-3 sm:pt-4">
        <HeaderCard title="Aktivitas" backUrl="/masyarakat/home" showBackButton={false} />

        {/* Tabs */}
        <div className="flex mb-4 sm:mb-6 bg-white rounded-2xl p-1 sm:p-1.5 shadow-lg ring-1 ring-black/10">
          <button
            onClick={() => setActiveTab('laporan-saya')}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium rounded-xl transition-all ${
              activeTab === 'laporan-saya'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Laporan Saya
          </button>
          <button
            onClick={() => setActiveTab('disimpan')}
            className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium rounded-xl transition-all ${
              activeTab === 'disimpan'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Disimpan
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'disimpan' && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari laporan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-600 focus:border-red-600 text-sm sm:text-base shadow-sm"
              />
            </div>
          </div>
        )}

        {(userLoading || dataLoading) ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeTab === 'disimpan' ? "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'disimpan' ? 'Belum Ada Laporan yang Disimpan' : 'Kamu belum pernah membuat laporan'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto px-4">
              {activeTab === 'disimpan' 
                ? 'Simpan laporan penting agar mudah ditemukan kembali' 
                : 'Yuk perhatikan sekitar desa sama dan buat laporan di fitur Pengaduan!'}
            </p>
            {activeTab !== 'disimpan' && (
              <div className="mt-6 sm:mt-8">
                <button 
                  onClick={() => router.push('/masyarakat/pengaduan/create')}
                  className="bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl hover:bg-red-700 transition-colors font-medium text-sm sm:text-base shadow-lg hover:shadow-xl"
                >
                  Buat Laporan
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {currentData.map((item, idx) => {
              const isSaved = item.data?.savedBy?.includes(user?.uid || '');
              return (
              <li 
                key={item.id} 
                className="rounded-2xl border bg-white/95 p-4 sm:p-5 shadow-md ring-1 ring-black/10 backdrop-blur transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer relative"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                {/* Save Button for Both Types */}
                <button
                  onClick={(e) => item.type === 'laporan' ? handleSaveLaporan(item.id, e) : handleSaveLayanan(item.id, e)}
                  disabled={item.type === 'laporan' ? savingLaporan[item.id] : savingLayanan[item.id]}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                  title={isSaved ? 'Hapus dari simpanan' : `Simpan ${item.type === 'laporan' ? 'laporan' : 'layanan'}`}
                >
                  {(item.type === 'laporan' ? savingLaporan[item.id] : savingLayanan[item.id]) ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isSaved ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </button>
                
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="grid h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl shadow-lg">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="font-semibold text-sm sm:text-base line-clamp-2 mb-2">{item.title}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-2">{formatDate(item.date)}</div>
                    {item.subtitle && (
                      <div className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-2">{item.subtitle}</div>
                    )}
                    
                    {/* Additional Info for Laporan */}
                    {item.type === 'laporan' && item.data && (
                      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        {item.data.noTelepon && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{item.data.noTelepon}</span>
                          </div>
                        )}
                        {item.data.alamat && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {filteredData.length > 0 && <PaginationComponent />}

        {/* Results info */}
        {filteredData.length > 0 && (
          <div className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
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
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedItem.data.jenisLayanan}</h3>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Tanggal Pengajuan</p>
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
                        <p className="text-xs text-gray-500 font-semibold">Nama Pemohon</p>
                        <p className="text-sm font-bold text-gray-900">{selectedItem.data.namaLengkap}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">NIK</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{selectedItem.data.nik}</p>
                      </div>
                    </div>

                    {selectedItem.data.keperluan && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Keperluan
                        </h4>
                        <p className="text-amber-800 text-sm">{selectedItem.data.keperluan}</p>
                      </div>
                    )}

                    {selectedItem.data.catatanAdmin && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Catatan Admin
                        </h4>
                        <p className="text-blue-800 text-sm">{selectedItem.data.catatanAdmin}</p>
                      </div>
                    )}

                    {selectedItem.data.alasanTolak && selectedItem.status === 'ditolak' && (
                      <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Alasan Penolakan
                        </h4>
                        <p className="text-red-800 text-sm font-medium leading-relaxed">{selectedItem.data.alasanTolak}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}