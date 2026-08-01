"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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

// CSS untuk modal modern dengan optimasi mobile
const modernModalStyles = `
  /* Prevent zoom on input focus for iOS */
  input, select, textarea {
    font-size: 16px !important; /* iOS requires 16px minimum to prevent auto-zoom */
  }

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
    padding: 0 !important;
    animation: modalFadeIn 0.3s ease-out !important;
    overflow: hidden !important;
  }
  
  @media (min-width: 768px) {
    .modern-modal-overlay {
      padding: 20px !important;
    }
  }
  
  .modern-modal-container {
    background: white !important;
    border-radius: 0 !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    animation: modalSlideUp 0.3s ease-out !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    -webkit-overflow-scrolling: touch !important; /* Smooth scrolling on iOS */
  }
  
  @media (min-width: 768px) {
    .modern-modal-container {
      border-radius: 16px !important;
      max-width: 900px !important;
      max-height: 90vh !important;
      height: auto !important;
    }
  }
  
  .close-button {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border: none !important;
    border-radius: 50% !important;
    width: 44px !important; /* Larger for mobile touch */
    height: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    z-index: 10 !important;
    touch-action: manipulation !important; /* Prevent double-tap zoom */
  }
  
  @media (min-width: 768px) {
    .close-button {
      top: 20px !important;
      right: 24px !important;
      width: 40px !important;
      height: 40px !important;
    }
  }
  
  .close-button:hover {
    background: rgba(0, 0, 0, 0.7) !important;
  }
  
  @media (min-width: 768px) {
    .close-button:hover {
      transform: rotate(90deg) !important;
    }
  }

  .modern-modal-content {
    padding: 12px !important;
    padding-top: 60px !important;
    padding-bottom: 80px !important; /* Extra space for mobile keyboard */
    flex: 1 !important;
    overflow-y: auto !important;
    scroll-behavior: smooth !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  @media (min-width: 768px) {
    .modern-modal-content {
      padding: 20px !important;
      padding-top: 60px !important;
      padding-bottom: 20px !important;
    }
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
    pendidikan: "",
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

  const resetForm = useCallback(() => {
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
      pendidikan: "",
      pekerjaan: "",
      penghasilan: "",
      golonganDarah: "",
      shdk: "",
      desil: ""
    });
    setEditingId(null);
  }, []);

  // Optimized input handler
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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
      pendidikan: item.pendidikanTerakhir || "",
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Memuat data pengguna...</p>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {!userLoading && (
        <AdminLayout>
          <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 p-3 sm:p-4 md:p-6 safe-area-padding">
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

        {/* Add/Edit Modal - Professional UI/UX */}
        {showModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-none md:rounded-2xl w-full h-full md:max-w-5xl md:w-full md:max-h-[92vh] md:h-auto overflow-hidden shadow-2xl border-0 md:border md:border-gray-200/50 animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300">
              {/* Premium Header with Gradient */}
              <div className="sticky top-0 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 z-10 p-5 md:p-7 shadow-lg safe-area-padding">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-2xl font-bold text-white">
                        {editingId ? 'Edit Data Warga' : 'Tambah Data Warga'}
                      </h3>
                      <p className="text-xs md:text-sm text-blue-100 mt-0.5">
                        Lengkapi formulir di bawah dengan data yang valid
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all duration-200 hover:rotate-90 touch-manipulation"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 md:p-8 overflow-y-auto h-[calc(100vh-140px)] md:max-h-[calc(92vh-180px)] bg-gradient-to-b from-gray-50/50 to-white safe-area-padding">
                
                {/* Section 1: Identitas Keluarga */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Identitas Keluarga</h4>
                      <p className="text-xs md:text-sm text-gray-500">Data kartu keluarga dan hubungan keluarga</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          No KK <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.noKK}
                          onChange={(e) => handleInputChange('noKK', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="16 digit nomor KK"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          SHDK
                        </label>
                        <input
                          type="text"
                          value={formData.shdk}
                          onChange={(e) => handleInputChange('shdk', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Kepala Keluarga / Istri / Anak"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Identitas Pribadi */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Identitas Pribadi</h4>
                      <p className="text-xs md:text-sm text-gray-500">Data diri dan identitas warga</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          autoComplete="name"
                          value={formData.namaLengkap}
                          onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Nama lengkap sesuai KTP"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          NIK <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          value={formData.nik}
                          onChange={(e) => handleInputChange('nik', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="16 digit NIK"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Jenis Kelamin
                        </label>
                        <select
                          value={formData.jenisKelamin}
                          onChange={(e) => handleInputChange('jenisKelamin', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Jenis Kelamin</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                          </svg>
                          Status Nikah
                        </label>
                        <input
                          type="text"
                          value={formData.statusNikah}
                          onChange={(e) => handleInputChange('statusNikah', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Belum Kawin / Kawin / Cerai"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Tempat & Tanggal Lahir */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Tempat & Tanggal Lahir</h4>
                      <p className="text-xs md:text-sm text-gray-500">Informasi kelahiran warga</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={formData.tempatLahir}
                          onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Kota/Kabupaten tempat lahir"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Tanggal Lahir
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={formData.tanggalLahir}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9/]/g, '');
                            const cleanValue = value.replace(/\//g, '');
                            if (cleanValue.length >= 2) {
                              value = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
                            }
                            if (cleanValue.length >= 4) {
                              value = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4) + '/' + cleanValue.substring(4, 8);
                            }
                            if (value.length <= 10) {
                              setFormData(prev => ({...prev, tanggalLahir: value}));
                            }
                          }}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="DD/MM/YYYY"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Pekerjaan & Ekonomi */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Pekerjaan & Ekonomi</h4>
                      <p className="text-xs md:text-sm text-gray-500">Informasi pekerjaan dan ekonomi</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Pekerjaan
                        </label>
                        <input
                          type="text"
                          value={formData.pekerjaan}
                          onChange={(e) => handleInputChange('pekerjaan', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Pekerjaan saat ini"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Penghasilan
                        </label>
                        <select
                          value={formData.penghasilan}
                          onChange={(e) => handleInputChange('penghasilan', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Range Penghasilan</option>
                          <option value="< Rp 500.000">&lt; Rp 500.000</option>
                          <option value="Rp 500.000 - Rp 1.000.000">Rp 500.000 - Rp 1.000.000</option>
                          <option value="Rp 1.000.000 - Rp 2.000.000">Rp 1.000.000 - Rp 2.000.000</option>
                          <option value="Rp 2.000.000 - Rp 5.000.000">Rp 2.000.000 - Rp 5.000.000</option>
                          <option value="> Rp 5.000.000">&gt; Rp 5.000.000</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Desil
                        </label>
                        <select
                          value={formData.desil}
                          onChange={(e) => handleInputChange('desil', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Desil</option>
                          <option value="1">1 (Sangat Miskin)</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10">10 (Sangat Kaya)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Pendidikan Terakhir
                        </label>
                        <select
                          value={formData.pendidikan}
                          onChange={(e) => handleInputChange('pendidikan', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Pendidikan</option>
                          <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                          <option value="SD/Sederajat">SD/Sederajat</option>
                          <option value="SMP/Sederajat">SMP/Sederajat</option>
                          <option value="SMA/Sederajat">SMA/Sederajat</option>
                          <option value="D1/D2/D3">D1/D2/D3</option>
                          <option value="D4/S1">D4/S1</option>
                          <option value="S2">S2</option>
                          <option value="S3">S3</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Alamat & Lokasi */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Alamat & Lokasi</h4>
                      <p className="text-xs md:text-sm text-gray-500">Informasi alamat tempat tinggal</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Alamat Lengkap
                        </label>
                        <textarea
                          value={formData.alamat}
                          onChange={(e) => handleInputChange('alamat', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation resize-none"
                          placeholder="Jalan, RT/RW, Dusun, dll"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          Daerah
                        </label>
                        <input
                          type="text"
                          value={formData.daerah}
                          onChange={(e) => handleInputChange('daerah', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Nama daerah/dusun"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 6: Data Lainnya */}
                <div className="mb-4 md:mb-5">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-gray-900">Data Lainnya</h4>
                      <p className="text-xs md:text-sm text-gray-500">Informasi tambahan warga</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200/60 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          Agama
                        </label>
                        <select
                          value={formData.agama}
                          onChange={(e) => handleInputChange('agama', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Agama</option>
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Suku Bangsa
                        </label>
                        <input
                          type="text"
                          value={formData.sukuBangsa}
                          onChange={(e) => handleInputChange('sukuBangsa', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                          placeholder="Contoh: Jawa, Sunda, Batak, dll"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                          Kewarganegaraan
                        </label>
                        <select
                          value={formData.kewarganegaraan}
                          onChange={(e) => handleInputChange('kewarganegaraan', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Kewarganegaraan</option>
                          <option value="WNI">WNI (Warga Negara Indonesia)</option>
                          <option value="WNA">WNA (Warga Negara Asing)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Golongan Darah
                        </label>
                        <select
                          value={formData.golonganDarah}
                          onChange={(e) => handleInputChange('golonganDarah', e.target.value)}
                          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 font-medium bg-gray-50/50 hover:bg-white transition-all duration-200 touch-manipulation"
                        >
                          <option value="">Pilih Golongan Darah</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                          <option value="Tidak Tahu">Tidak Tahu</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Submit Button - Professional Design */}
                <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-3 pb-3 md:relative md:bg-none md:pt-0 md:pb-0 safe-area-padding border-t border-gray-200 md:border-0">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 md:gap-3 px-4 md:px-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="w-full md:w-auto px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-50 active:bg-gray-100 transition-all shadow-sm hover:shadow-md touch-manipulation flex items-center justify-center gap-2 order-2 md:order-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Batal</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto min-w-[200px] px-8 py-3 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white rounded-xl font-bold text-base hover:from-red-700 hover:via-red-800 hover:to-rose-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl touch-manipulation flex items-center justify-center gap-2 order-1 md:order-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Simpan Data</span>
                        </>
                      )}
                    </button>
                  </div>
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



