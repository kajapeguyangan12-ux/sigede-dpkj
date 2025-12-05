"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from '../../masyarakat/lib/useCurrentUser';
import AdminLayout from "../components/AdminLayout";
import { Users, Plus, Upload, Grid, List, Search, Trash2, Edit, Eye, X, TrendingUp, UserCheck, Home } from 'lucide-react';
import { addDataDesa, updateDataDesa, deleteDataDesa, subscribeToDataDesa, DataDesaItem } from "../../../lib/dataDesaService";
import UploadExcel from "./components/UploadExcelNew";
import KKCard from "./components/KKCard";
import AnimatedCounter from "./components/AnimatedCounter";

// Custom animations and mobile optimizations
const customStyles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* iOS safe area support */
  .safe-area-padding {
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* Touch optimizations */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  button, a {
    user-select: none;
    -webkit-user-select: none;
  }

  input, textarea, select {
    user-select: text;
    -webkit-user-select: text;
  }
`

// CSS untuk modal modern
const modernModalStyles = `
  .modern-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 9999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 20px !important;
    animation: modalFadeIn 0.3s ease-out !important;
  }
  
  .modern-modal-container {
    background: white !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    width: 100% !important;
    max-width: 900px !important;
    max-height: 90vh !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    animation: modalSlideUp 0.3s ease-out !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .close-button {
    position: absolute !important;
    top: 20px !important;
    right: 24px !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border: none !important;
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    z-index: 10 !important;
  }
  
  .close-button:hover {
    background: rgba(0, 0, 0, 0.7) !important;
    transform: rotate(90deg) !important;
  }

  .modern-modal-content {
    padding: 20px !important;
    padding-top: 60px !important;
    flex: 1 !important;
    overflow-y: auto !important;
    scroll-behavior: smooth !important;
  }

  .modern-modal-content::-webkit-scrollbar {
    width: 8px !important;
  }

  .modern-modal-content::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 4px !important;
  }

  .modern-modal-content::-webkit-scrollbar-thumb {
    background: #888 !important;
    border-radius: 4px !important;
    transition: background 0.2s ease !important;
  }

  .modern-modal-content::-webkit-scrollbar-thumb:hover {
    background: #555 !important;
  }

  .scroll-indicator {
    position: absolute !important;
    bottom: 10px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: rgba(0, 0, 0, 0.6) !important;
    color: white !important;
    padding: 8px 12px !important;
    border-radius: 20px !important;
    font-size: 12px !important;
    z-index: 20 !important;
    animation: bounce 2s infinite !important;
    pointer-events: none !important;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    40% {
      transform: translateX(-50%) translateY(-5px);
    }
    60% {
      transform: translateX(-50%) translateY(-3px);
    }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes modalSlideUp {
    from { 
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

interface DataDesa {
  id: string;
  noKK: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  daerah: string;
  statusNikah: string;
  agama: string;
  sukuBangsa: string;
  kewarganegaraan: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  penghasilan: string;
  golonganDarah: string;
  shdk: string;
  desil: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DataDesaPage() {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [dataWarga, setDataWarga] = useState<DataDesa[]>([]);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadMinimized, setIsUploadMinimized] = useState(false); // Track minimize state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBanjar, setFilterBanjar] = useState("all");
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards'); // Default ke cards
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [userDaerah, setUserDaerah] = useState<string>("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Access Control: Admin Desa tidak boleh akses halaman ini
  useEffect(() => {
    if (userLoading) return; // Wait for user data to load
    
    if (!hasCheckedAccess && currentUser) {
      setHasCheckedAccess(true);
      
      if (currentUser.role === 'admin_desa') {
        console.log('🚫 ACCESS DENIED: Admin Desa tidak dapat mengakses Data Desa');
        router.push('/admin/home');
        return;
      }
    }
  }, [currentUser, userLoading, router, hasCheckedAccess]);
  const [formData, setFormData] = useState({
    noKK: "",
    namaLengkap: "",
    nik: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    daerah: "",
    statusNikah: "",
    agama: "",
    sukuBangsa: "",
    kewarganegaraan: "",
    pendidikanTerakhir: "",
    pekerjaan: "",
    penghasilan: "",
    golonganDarah: "",
    shdk: "",
    desil: ""
  });

  useEffect(() => {
    const unsubscribe = subscribeToDataDesa((data) => {
      const formattedData = data.map(item => ({
        ...item,
        createdAt: item.createdAt.toDate(),
        updatedAt: item.updatedAt.toDate()
      })) as DataDesa[];
      setDataWarga(formattedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-set filter berdasarkan daerah user jika kepala_dusun
  useEffect(() => {
    if (currentUser?.role === 'kepala_dusun' && currentUser?.nik) {
      // Cari daerah user dari data warga
      const userData = dataWarga.find(d => d.nik === currentUser.nik);
      if (userData?.daerah) {
        setUserDaerah(userData.daerah);
        setFilterBanjar(userData.daerah); // Auto-set filter ke daerah user
      }
    }
  }, [currentUser, dataWarga]);

  const resetForm = () => {
    setFormData({
      noKK: "",
      namaLengkap: "",
      nik: "",
      jenisKelamin: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      daerah: "",
      statusNikah: "",
      agama: "",
      sukuBangsa: "",
      kewarganegaraan: "",
      pendidikanTerakhir: "",
      pekerjaan: "",
      penghasilan: "",
      golonganDarah: "",
      shdk: "",
      desil: ""
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi format tanggal lahir DD/MM/YYYY
    if (formData.tanggalLahir) {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
      if (!dateRegex.test(formData.tanggalLahir)) {
        alert("Format tanggal lahir tidak valid! Gunakan format DD/MM/YYYY (contoh: 15/08/1990)");
        return;
      }
      
      // Validasi tanggal yang valid
      const [day, month, year] = formData.tanggalLahir.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        alert("Tanggal lahir tidak valid! Periksa kembali tanggal yang Anda masukkan.");
        return;
      }
      
      // Validasi tahun (tidak boleh lebih dari tahun sekarang dan minimal 1900)
      const currentYear = new Date().getFullYear();
      if (year > currentYear || year < 1900) {
        alert(`Tahun lahir harus antara 1900 dan ${currentYear}`);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (editingId) {
        await updateDataDesa(editingId, formData);
        alert("Data warga berhasil diperbarui!");
      } else {
        await addDataDesa(formData);
        alert("Data warga berhasil ditambahkan!");
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Terjadi kesalahan saat menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: DataDesa) => {
    setFormData({
      noKK: item.noKK,
      namaLengkap: item.namaLengkap,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir,
      alamat: item.alamat,
      daerah: item.daerah,
      statusNikah: item.statusNikah,
      agama: item.agama,
      sukuBangsa: item.sukuBangsa,
      kewarganegaraan: item.kewarganegaraan,
      pendidikanTerakhir: item.pendidikanTerakhir,
      pekerjaan: item.pekerjaan,
      penghasilan: item.penghasilan,
      golonganDarah: item.golonganDarah,
      shdk: item.shdk,
      desil: item.desil
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDataDesa(id);
        alert("Data berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting data:", error);
        alert("Terjadi kesalahan saat menghapus data!");
      }
    }
  };

  // Filter data berdasarkan search term dan banjar yang dipilih
  const filteredData = dataWarga.filter(item => {
    const matchesSearch = item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.noKK.includes(searchTerm);
    
    const matchesBanjar = filterBanjar === "all" || item.daerah === filterBanjar;
    
    return matchesSearch && matchesBanjar;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBanjar]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Dapatkan daftar daerah/banjar unik dari data yang ada
  const uniqueDaerah = [...new Set(dataWarga.map(item => item.daerah).filter(daerah => daerah && daerah.trim() !== ''))].sort();

  // Group data by No KK for card view (using paginated data)
  const groupedByKK = paginatedData.reduce((groups, warga) => {
    const noKK = warga.noKK || 'Tanpa KK';
    if (!groups[noKK]) {
      groups[noKK] = [];
    }
    groups[noKK].push(warga);
    return groups;
  }, {} as Record<string, DataDesa[]>);

  // Calculate statistics (from full filtered data, not paginated)
  const totalKepalaKeluarga = filteredData.filter(item => item.shdk?.toLowerCase().includes('kepala')).length;
  const totalKK = Object.keys(filteredData.reduce((groups, warga) => {
    const noKK = warga.noKK || 'Tanpa KK';
    if (!groups[noKK]) {
      groups[noKK] = [];
    }
    groups[noKK].push(warga);
    return groups;
  }, {} as Record<string, DataDesa[]>)).filter(kk => kk !== 'Tanpa KK').length;

  // Detect duplicate NIK
  const duplicateNIK = dataWarga.reduce((acc, item) => {
    if (item.nik && item.nik.trim() !== '') {
      const nik = item.nik.trim();
      if (!acc[nik]) {
        acc[nik] = [];
      }
      acc[nik].push(item);
    }
    return acc;
  }, {} as Record<string, DataDesa[]>);

  const duplicates = Object.entries(duplicateNIK)
    .filter(([_, items]) => items.length > 1)
    .map(([nik, items]) => ({ nik, count: items.length, items }));

  const totalDuplicates = duplicates.reduce((sum, dup) => sum + (dup.count - 1), 0);

  return (
    <>
      {/* Inject CSS styles */}
      <style>{customStyles}</style>
      <style dangerouslySetInnerHTML={{ __html: modernModalStyles }} />
      
      {/* Loading Screen */}
      {userLoading && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Memuat data pengguna...</p>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {!userLoading && (
        <AdminLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-3 sm:p-4 md:p-6 safe-area-padding">
            <div className="max-w-7xl mx-auto">
              {/* Custom Header */}
              <div 
                className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8"
                style={{ animation: 'slideUp 0.5s ease-out' }}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                    Data Desa
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-white/90 ml-0 sm:ml-14">
                  Kelola data kependudukan dan informasi warga desa
                </p>
              </div>

              {/* Statistics Cards */}
              <div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
                style={{ animation: 'fadeIn 0.5s ease-out 0.1s backwards' }}
              >
                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <div className="bg-white/20 rounded-lg px-2 py-1">
                      <span className="text-xs sm:text-sm font-semibold">Total</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 mb-1">Total Warga</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold"><AnimatedCounter value={filteredData.length} duration={2000} delay={50} /></p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <div className="bg-white/20 rounded-lg px-2 py-1">
                      <span className="text-xs sm:text-sm font-semibold">KK</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 mb-1">Kepala Keluarga</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold"><AnimatedCounter value={totalKepalaKeluarga} duration={2000} delay={50} /></p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <Home className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <div className="bg-white/20 rounded-lg px-2 py-1">
                      <span className="text-xs sm:text-sm font-semibold">KK</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 mb-1">Total KK</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold"><AnimatedCounter value={totalKK} duration={2000} delay={50} /></p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <div className="bg-white/20 rounded-lg px-2 py-1">
                      <span className="text-xs sm:text-sm font-semibold">NIK</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 mb-1">Duplikat NIK</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalDuplicates}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div 
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
                style={{ animation: 'cardEntrance 0.6s ease-out 0.2s backwards' }}
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Search and Filter Row */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari nama atau NIK..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900"
                      />
                    </div>
                    <select
                      value={filterBanjar}
                      onChange={(e) => setFilterBanjar(e.target.value)}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none transition-colors font-medium text-sm sm:text-base text-gray-900 bg-white min-w-[160px]"
                    >
                      <option value="all">Semua Daerah</option>
                      {uniqueDaerah.map((daerah) => (
                        <option key={daerah} value={daerah}>
                          {daerah}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Action Buttons Row */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button 
                      onClick={() => {
                        resetForm();
                        setShowModal(true);
                      }}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      Tambah Data
                    </button>
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      Upload Excel
                    </button>
                    
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === 'cards'
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                        <span className="hidden sm:inline">Cards</span>
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === 'list'
                            ? 'bg-white text-red-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="hidden sm:inline">List</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area - Cards or Table View */}
              {viewMode === 'cards' ? (
                <>
                  {/* Duplicate Data Information */}
                  {duplicates.length > 0 && (
                    <div 
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm"
                      style={{ animation: 'cardEntrance 0.6s ease-out 0.3s backwards' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-gray-800">
                            Informasi: Ditemukan <span className="text-orange-600 font-bold">{totalDuplicates}</span> data duplikat berdasarkan NIK yang sama ({duplicates.length} NIK duplikat)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cards View - Per KK */}
                  {paginatedData.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                        <p className="text-gray-700 mb-4 font-medium">
                          Mulai dengan menambahkan data penduduk pertama
                          {currentUser && (currentUser.role === 'administrator' || currentUser.role === 'super_admin') && ' atau gunakan fitur upload Excel'}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedByKK).map(([noKK, keluargaMembers]) => (
                        <KKCard key={noKK} noKK={noKK} members={keluargaMembers} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // List View - Simple list display
                <>
                  {paginatedData.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                        <p className="text-gray-700 mb-4 font-medium">
                          Mulai dengan menambahkan data penduduk pertama
                          {currentUser && (currentUser.role === 'administrator' || currentUser.role === 'super_admin') && ' atau gunakan fitur upload Excel'}.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedData.map((warga) => (
                        <div 
                          key={warga.id} 
                          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <div className="p-4 sm:p-5">
                            <div className="flex items-start gap-4">
                              {/* Icon/Badge */}
                              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg ${
                                warga.shdk?.toLowerCase().includes('kepala') 
                                  ? 'bg-gradient-to-br from-red-500 to-rose-600' 
                                  : warga.jenisKelamin === 'Laki-laki'
                                  ? 'bg-gradient-to-br from-red-400 to-red-500'
                                  : 'bg-gradient-to-br from-pink-400 to-pink-500'
                              }`}>
                                {warga.shdk?.toLowerCase().includes('kepala') ? (
                                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : (
                                  <span>{warga.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</span>
                                )}
                              </div>

                              {/* Main Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                                      {warga.namaLengkap}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-mono mb-1">{warga.nik}</p>
                                  </div>
                                  {warga.shdk?.toLowerCase().includes('kepala') && (
                                    <span className="flex-shrink-0 px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                      Kepala Keluarga
                                    </span>
                                  )}
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                                  <div className="flex items-start gap-2">
                                    <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs text-gray-500">No. Kartu Keluarga</p>
                                      <p className="text-sm font-semibold text-gray-900 font-mono truncate">{warga.noKK}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div className="min-w-0">
                                      <p className="text-xs text-gray-500">Tempat, Tanggal Lahir</p>
                                      <p className="text-sm font-semibold text-gray-900 truncate">{warga.tempatLahir}, {warga.tanggalLahir}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs text-gray-500">Status Hubungan</p>
                                      <p className="text-sm font-semibold text-gray-900 truncate">{warga.shdk}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <div className="min-w-0">
                                      <p className="text-xs text-gray-500">Pekerjaan</p>
                                      <p className="text-sm font-semibold text-gray-900 truncate">{warga.pekerjaan}</p>
                                    </div>
                                  </div>

                                  {warga.desil && (
                                    <div className="flex items-start gap-2">
                                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                      <div className="min-w-0">
                                        <p className="text-xs text-gray-500">Desil</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{warga.desil}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Alamat & Daerah */}
                                <div className="flex items-start gap-2 mb-3">
                                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-500">Alamat</p>
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{warga.alamat}</p>
                                  </div>
                                </div>

                                {/* Footer with Daerah and Actions */}
                                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                                  <div>
                                    {warga.daerah && (
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-lg">
                                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span className="text-xs font-semibold text-red-700">{warga.daerah}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(warga)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Edit Data"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span className="hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(warga.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Hapus Data"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span className="hidden sm:inline">Hapus</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    currentPage === 1 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Sebelumnya
                </button>

                <div className="flex items-center space-x-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    const isCurrentPage = pageNum === currentPage;
                    const shouldShow = pageNum === 1 || 
                                     pageNum === totalPages || 
                                     (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);

                    if (!shouldShow) {
                      if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                        return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          isCurrentPage
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    currentPage === totalPages 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Selanjutnya
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

            {/* Upload Excel Component - single instance, preserve state */}
        {(showUploadModal || isUploadMinimized) && (
          <UploadExcel 
            isMinimizedFromParent={isUploadMinimized}
            onUploadComplete={() => {
              setShowUploadModal(false);
              setIsUploadMinimized(false);
            }}
            onMinimize={() => {
              setIsUploadMinimized(true);
              setShowUploadModal(false);
            }}
            onMaximize={() => {
              setIsUploadMinimized(false);
              setShowUploadModal(true);
            }}
          />
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Data Warga' : 'Tambah Data Warga'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      No KK
                    </label>
                    <input
                      type="text"
                      value={formData.noKK}
                      onChange={(e) => setFormData(prev => ({...prev, noKK: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 font-semibold"
                      placeholder="Masukkan No KK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Agama
                    </label>
                    <input
                      type="text"
                      value={formData.agama}
                      onChange={(e) => setFormData(prev => ({...prev, agama: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Agama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.namaLengkap}
                      onChange={(e) => setFormData(prev => ({...prev, namaLengkap: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Nama Lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Suku Bangsa
                    </label>
                    <input
                      type="text"
                      value={formData.sukuBangsa}
                      onChange={(e) => setFormData(prev => ({...prev, sukuBangsa: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Suku Bangsa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      NIK
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData(prev => ({...prev, nik: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 font-semibold"
                      placeholder="Masukkan NIK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Kewarganegaraan
                    </label>
                    <input
                      type="text"
                      value={formData.kewarganegaraan}
                      onChange={(e) => setFormData(prev => ({...prev, kewarganegaraan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Kewarganegaraan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData(prev => ({...prev, jenisKelamin: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                    >
                      <option value="" className="text-gray-500">Pilih Jenis Kelamin</option>
                      <option value="Laki-laki" className="text-gray-900">Laki-laki</option>
                      <option value="Perempuan" className="text-gray-900">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Pendidikan Terakhir
                    </label>
                    <input
                      type="text"
                      value={formData.pendidikanTerakhir}
                      onChange={(e) => setFormData(prev => ({...prev, pendidikanTerakhir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Pendidikan Terakhir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData(prev => ({...prev, tempatLahir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Tempat Lahir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Pekerjaan
                    </label>
                    <input
                      type="text"
                      value={formData.pekerjaan}
                      onChange={(e) => setFormData(prev => ({...prev, pekerjaan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Pekerjaan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tanggalLahir}
                      onChange={(e) => {
                        // Allow only numbers and slashes
                        let value = e.target.value.replace(/[^0-9/]/g, '');
                        
                        // Parse current parts
                        const parts = value.split('/');
                        let day = parts[0] || '';
                        let month = parts[1] || '';
                        let year = parts[2] || '';
                        
                        // Function to get max days in a month
                        const getMaxDaysInMonth = (m: number, y: number) => {
                          if (m === 2) {
                            // February - check leap year
                            if (y && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
                              return 29; // Leap year
                            }
                            return 28; // Non-leap year
                          } else if ([4, 6, 9, 11].includes(m)) {
                            return 30; // April, June, September, November
                          }
                          return 31; // January, March, May, July, August, October, December
                        };
                        
                        // Validate and correct month (01-12)
                        if (month) {
                          const monthNum = parseInt(month);
                          if (monthNum > 12) {
                            month = '12';
                          } else if (monthNum === 0 && month.length === 2) {
                            month = '01';
                          }
                        }
                        
                        // Validate and correct day based on month
                        if (day) {
                          let dayNum = parseInt(day);
                          const monthNum = parseInt(month) || 1;
                          const yearNum = parseInt(year) || new Date().getFullYear();
                          const maxDays = getMaxDaysInMonth(monthNum, yearNum);
                          
                          if (dayNum > maxDays) {
                            day = maxDays.toString().padStart(2, '0');
                          } else if (dayNum === 0 && day.length === 2) {
                            day = '01';
                          }
                        }
                        
                        // Reconstruct value
                        const newParts = [day, month, year].filter((p, i) => {
                          // Keep part if it's not empty or if we're still building the date
                          if (i === 0) return true; // Always keep day
                          if (i === 1) return parts.length > 1; // Keep month if user typed /
                          if (i === 2) return parts.length > 2; // Keep year if user typed second /
                          return false;
                        });
                        
                        value = newParts.join('/');
                        
                        // Auto-add slashes after day (2 digits) and month (2 digits)
                        const cleanValue = value.replace(/\//g, '');
                        if (cleanValue.length >= 2 && value.split('/').length === 1) {
                          value = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
                        }
                        if (cleanValue.length >= 4 && value.split('/').length === 2) {
                          const p = value.split('/');
                          value = p[0] + '/' + p[1].substring(0, 2) + '/' + p[1].substring(2);
                        }
                        
                        // Limit to DD/MM/YYYY format (10 characters)
                        if (value.length <= 10) {
                          setFormData(prev => ({...prev, tanggalLahir: value}));
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace to delete slashes
                        if (e.key === 'Backspace') {
                          const cursorPos = e.currentTarget.selectionStart || 0;
                          const value = e.currentTarget.value;
                          
                          // If cursor is right after a slash, remove the slash
                          if (cursorPos > 0 && value[cursorPos - 1] === '/') {
                            e.preventDefault();
                            const newValue = value.substring(0, cursorPos - 1) + value.substring(cursorPos);
                            setFormData(prev => ({...prev, tanggalLahir: newValue}));
                            // Set cursor position after the deletion
                            setTimeout(() => {
                              e.currentTarget.setSelectionRange(cursorPos - 1, cursorPos - 1);
                            }, 0);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format: DD/MM/YYYY (contoh: 15/08/1990). Hari otomatis disesuaikan dengan bulan.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Penghasilan
                    </label>
                    <input
                      type="text"
                      value={formData.penghasilan}
                      onChange={(e) => setFormData(prev => ({...prev, penghasilan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Penghasilan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Alamat
                    </label>
                    <textarea
                      rows={3}
                      value={formData.alamat}
                      onChange={(e) => setFormData(prev => ({...prev, alamat: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Alamat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Golongan Darah
                    </label>
                    <input
                      type="text"
                      value={formData.golonganDarah}
                      onChange={(e) => setFormData(prev => ({...prev, golonganDarah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Golongan Darah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Daerah
                    </label>
                    <input
                      type="text"
                      value={formData.daerah}
                      onChange={(e) => setFormData(prev => ({...prev, daerah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Daerah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      SHDK
                    </label>
                    <input
                      type="text"
                      value={formData.shdk}
                      onChange={(e) => setFormData(prev => ({...prev, shdk: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan SHDK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Status Nikah
                    </label>
                    <input
                      type="text"
                      value={formData.statusNikah}
                      onChange={(e) => setFormData(prev => ({...prev, statusNikah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Status Nikah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Desil
                    </label>
                    <input
                      type="text"
                      value={formData.desil}
                      onChange={(e) => setFormData(prev => ({...prev, desil: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                      placeholder="Masukkan Desil"
                    />
                  </div>

                </div>

                <div className="flex justify-center mt-8 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-xs px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
        </AdminLayout>
      )}
    </>
  );
}