"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { useCurrentUser } from '../../masyarakat/lib/useCurrentUser';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, {
  AdminHeaderSearchBar,
  AdminHeaderAccount,
} from "../../components/AdminHeaderCard";
import { addDataDesa, updateDataDesa, deleteDataDesa, subscribeToDataDesa, DataDesaItem } from "../../../lib/dataDesaService";
import UploadExcel from "./components/UploadExcelNew";
import KKCard from "./components/KKCard";
import AnimatedCounter from "./components/AnimatedCounter";

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
  createdAt: Date;
  updatedAt: Date;
}

export default function DataDesaPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [dataWarga, setDataWarga] = useState<DataDesa[]>([]);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadMinimized, setIsUploadMinimized] = useState(false); // Track minimize state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBanjar, setFilterBanjar] = useState("all");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default ke cards
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  
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
    shdk: ""
  });

  const handleLogout = async () => {
    try {
      await logout('admin');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
      shdk: ""
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      shdk: item.shdk
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

  return (
    <>
      {/* Inject CSS styles for modern modal */}
      <style dangerouslySetInnerHTML={{ __html: modernModalStyles }} />
      
      {/* Loading Screen */}
      {userLoading && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Memuat data pengguna...</p>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {!userLoading && (
        <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Enhanced Header */}
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 mb-8 sm:mb-10 relative z-40 overflow-hidden max-w-7xl mx-auto mt-6">
          {/* Floating Background Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-sky-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-sky-400/10 to-cyan-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-cyan-400/5 to-blue-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

          {/* Enhanced AdminHeaderCard with better styling */}
          <div className="w-full bg-gradient-to-r from-white via-blue-50/30 to-sky-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
            {/* Enhanced Title Section */}
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-blue-800 to-sky-800 bg-clip-text text-transparent mb-2">
                  Data Desa
                </h1>
                <p className="text-slate-600 font-medium text-lg">
                  Kelola data kependudukan dan informasi warga desa
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <AnimatedCounter value={totalKepalaKeluarga} duration={2500} delay={50} /> Kepala Keluarga
                  </div>
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-semibold">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <AnimatedCounter value={totalKK} duration={2500} delay={50} /> Total KK
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Controls Section */}
            <div className="flex items-center gap-6 relative z-10">
              {/* Enhanced Search Bar */}
              <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
                <input
                  type="text"
                  placeholder="Cari data warga..."
                  className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
                />
                <svg
                  className="ml-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer shadow-md">
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
                  onClick={handleLogout}
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Data Desa Dauh Puri Kaja
            </h1>
            <p className="text-lg text-gray-700 font-medium">
              Kelola data kependudukan dan informasi warga desa
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau NIK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 bg-white"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterBanjar}
                    onChange={(e) => setFilterBanjar(e.target.value)}
                    className="px-6 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer transition-all min-w-[160px] text-gray-900 font-medium"
                  >
                    <option value="all" className="text-gray-900 bg-white">Semua Daerah</option>
                    {uniqueDaerah.map((daerah) => (
                      <option key={daerah} value={daerah} className="text-gray-900 bg-white">
                        {daerah}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Kartu KK
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2" />
                    </svg>
                    Tabel
                  </button>
                </div>

                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Excel
                </button>
                
                <button 
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Tambah Data Warga
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Penduduk</p>
                  <p className="text-2xl font-bold text-blue-600">
                    <AnimatedCounter value={filteredData.length} duration={2000} delay={100} />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Laki-laki</p>
                  <p className="text-2xl font-bold text-green-600">
                    <AnimatedCounter 
                      value={filteredData.filter(item => item.jenisKelamin === 'Laki-laki').length} 
                      duration={2200} 
                      delay={200} 
                    />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Perempuan</p>
                  <p className="text-2xl font-bold text-pink-600">
                    <AnimatedCounter 
                      value={filteredData.filter(item => item.jenisKelamin === 'Perempuan').length} 
                      duration={2400} 
                      delay={300} 
                    />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Kepala Keluarga</p>
                  <p className="text-2xl font-bold text-purple-600">
                    <AnimatedCounter 
                      value={filteredData.filter(item => item.shdk?.toLowerCase().includes('kepala')).length} 
                      duration={2600} 
                      delay={400} 
                    />
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total KK</p>
                  <p className="text-2xl font-bold text-orange-600">
                    <AnimatedCounter 
                      value={totalKK} 
                      duration={2800} 
                      delay={500} 
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Info */}
          {totalItems > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-900 font-semibold">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} data
                </span>
                <span className="text-gray-700 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
              </div>
            </div>
          )}

          {/* Data Display */}
          {viewMode === 'cards' ? (
            // Card View for KK
            paginatedData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                  <p className="text-gray-700 mb-4 font-medium">Mulai dengan menambahkan data penduduk pertama atau gunakan fitur upload Excel.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByKK).map(([noKK, keluargaMembers]) => (
                  <KKCard key={noKK} noKK={noKK} members={keluargaMembers} />
                ))}
              </div>
            )
          ) : (
            // Table View
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Data Penduduk</h3>
              </div>
              
              {paginatedData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                <p className="text-gray-700 mb-4 font-medium">Mulai dengan menambahkan data penduduk pertama atau gunakan fitur upload Excel.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">No KK</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Nama Lengkap</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">NIK</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Jenis Kelamin</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Pekerjaan</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status Nikah</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-bold font-mono">{item.noKK}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-900">{item.namaLengkap}</div>
                            <div className="text-sm text-gray-600 font-medium">{item.tempatLahir}, {item.tanggalLahir}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-bold font-mono">{item.nik}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {item.jenisKelamin}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.pekerjaan}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.statusNikah}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
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
                            ? 'bg-blue-600 text-white shadow-sm'
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
        </div>

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
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData(prev => ({...prev, tanggalLahir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-semibold"
                    />
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
      </AdminLayout>
      )}
    </>
  );
}