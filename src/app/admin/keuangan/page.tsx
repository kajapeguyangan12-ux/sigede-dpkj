"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addDetailedAPB, subscribeToDetailedAPB, deleteDetailedAPB, DetailedAPBData } from "../../../lib/keuanganService";
import AdminLayout from "../components/AdminLayout";
import { Wallet, Plus, Trash2, Eye, X, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

interface FinancialItem {
  id: string;
  title: string;
  date: string;
  category: string;
  amount?: number;
  description?: string;
}

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

export default function KeuanganPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [formData, setFormData] = useState({ 
    title: "", 
    date: "",
    amount: "",
    description: "",
    category: "pendapatan", // Default ke pendapatan
    tahun: new Date().getFullYear().toString() // Default ke tahun sekarang
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1); // 1: Anggaran, 2: Realisasi, 3: Preview
  const [anggaranData, setAnggaranData] = useState<{[key: string]: string}>({});
  const [realisasiData, setRealisasiData] = useState<{[key: string]: string}>({});
  // Ubah data awal menjadi kosong untuk menunjukkan state empty
  const [financialItems, setFinancialItems] = useState<FinancialItem[]>([]);
  const [apbData, setApbData] = useState<DetailedAPBData[]>([]);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [selectedYearData, setSelectedYearData] = useState<DetailedAPBData[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailModalYear, setDetailModalYear] = useState<number>(0);

  // Load data from Firestore
  React.useEffect(() => {
    const unsubscribe = subscribeToDetailedAPB((data) => {
      setApbData(data);
      // Convert APB data to financial items for backward compatibility
      const items: FinancialItem[] = data.map(item => ({
        id: item.id || '',
        title: `${item.kategori} - ${item.subKategori} ${item.tahun}`,
        date: item.createdAt.toISOString().split('T')[0],
        category: item.kategori,
        amount: item.realisasi,
        description: `Anggaran: Rp ${item.anggaran.toLocaleString('id-ID')}, Realisasi: Rp ${item.realisasi.toLocaleString('id-ID')} - ${item.uraian}`
      }));
      setFinancialItems(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get available years from APB data
  const availableYears = React.useMemo(() => {
    const years = Array.from(new Set(apbData.map(item => item.tahun))).sort((a, b) => b - a);
    return years;
  }, [apbData]);

  // Group APB data by year for card display
  const apbByYear = React.useMemo(() => {
    const grouped: Record<number, DetailedAPBData[]> = {};
    
    apbData.forEach(item => {
      if (!grouped[item.tahun]) {
        grouped[item.tahun] = [];
      }
      grouped[item.tahun].push(item);
    });
    
    // Filter by selected year if not "all"
    if (selectedYear !== "all") {
      const year = parseInt(selectedYear);
      return { [year]: grouped[year] || [] };
    }
    
    return grouped;
  }, [apbData, selectedYear]);

  // Filter cards by search term
  const filteredApbByYear = React.useMemo(() => {
    if (!searchTerm) return apbByYear;
    
    const filtered: Record<number, DetailedAPBData[]> = {};
    
    Object.entries(apbByYear).forEach(([year, items]) => {
      const filteredItems = items.filter(item => 
        item.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subKategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uraian.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredItems.length > 0) {
        filtered[parseInt(year)] = filteredItems;
      }
    });
    
    return filtered;
  }, [apbByYear, searchTerm]);

  const categories = [
    {
      id: "pendapatan",
      name: "Pendapatan",
      description: "Kelola pendapatan desa",
      icon: "💰",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    },
    {
      id: "belanja",
      name: "Belanja",
      description: "Kelola belanja desa",
      icon: "🛒",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
    },
    {
      id: "pembiayaan",
      name: "Pembiayaan",
      description: "Kelola pembiayaan desa",
      icon: "💳",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
    },
  ];

  // Sub kategori untuk setiap kategori utama
  const subCategories = {
    pendapatan: [
      { id: 'pendapatan_asli', label: 'Pendapatan Asli Desa', placeholder: 'Data Pendapatan' },
      { id: 'dana_desa', label: 'Dana Desa', placeholder: 'Data Dana Desa' },
      { id: 'bagi_pajak', label: 'Bagi Hasil Pajak Daerah', placeholder: 'Data Bagi Pajak' },
      { id: 'bagi_retrebusi', label: 'Bagi Hasil Retrebusi Daerah', placeholder: 'Data Retrebusi' },
      { id: 'alokasi_dana', label: 'Alokasi Dana Desa', placeholder: 'Data Alokasi Dana Desa' },
      { id: 'bantuan_denpasar', label: 'Bantuan Keuangan Khusus Kota Denpasar', placeholder: 'Data Bantuan Khusus Kota Denpasar' },
      { id: 'bantuan_bali', label: 'Bantuan Keuangan Khusus Prov. Bali', placeholder: 'Data Bantuan Khusus Prov. Bali' },
      { id: 'pendapatan_lain', label: 'Pendapatan Lain-lain', placeholder: 'Data Pendapatan Lain-lain' },
    ],
    belanja: [
      { id: 'bidang_penyelenggaraan', label: 'Pemerintahan Desa', placeholder: 'Data Pemerintahan Desa' },
      { id: 'bidang_pembangunan', label: 'Pelaksanaan Pembangunan Desa', placeholder: 'Data Pelaksanaan Pembangunan Desa' },
      { id: 'bidang_pembinaan', label: 'Pembinaan Kemasyarakatan Desa', placeholder: 'Data Pembinaan Kemasyarakatan Desa' },
      { id: 'bidang_pemberdayaan', label: 'Pemberdayaan Masyarakat Desa', placeholder: 'Data Pemberdayaan Masyarakat Desa' },
      { id: 'bidang_penanggulangan', label: 'Penanggulangan Bencana Dan Keadaan', placeholder: 'Data Penanggulangan Bencana Dan Keadaan' },
    ],
    pembiayaan: [
      { id: 'penerimaan_pembiayaan', label: 'Penerimaan Pembiayaan', placeholder: 'Data Pembiayaan' },
      { id: 'pengeluaran_pembiayaan', label: 'Pengeluaran Pembiayaan', placeholder: 'Data Pengeluaran' },
    ]
  };

  const handleAddData = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.date && formData.category) {
      const newItem: FinancialItem = {
        id: Date.now().toString(),
        title: formData.title,
        date: formData.date,
        category: formData.category,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        description: formData.description,
      };
      setFinancialItems([...financialItems, newItem]);
      setFormData({ title: "", date: "", amount: "", description: "", category: "pendapatan", tahun: new Date().getFullYear().toString() });
      setShowAddModal(false);
    }
  };

  // Helper function untuk format number dengan pemisah ribuan
  const formatNumberWithDots = (value: string) => {
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/\D/g, '');
    
    // Format dengan pemisah ribuan
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper function untuk parse number dari string dengan dots
  const parseNumberFromDots = (value: string) => {
    return value.replace(/\./g, '');
  };

  const resetForm = () => {
    setFormData({ title: "", date: "", amount: "", description: "", category: "pendapatan", tahun: new Date().getFullYear().toString() });
    setCurrentStep(1);
    setAnggaranData({});
    setRealisasiData({});
    setSelectedCategory("");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryModal(false);
    setShowAddModal(true);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handler untuk input anggaran dengan format
  const handleAnggaranChange = (subCatId: string, value: string) => {
    const formattedValue = formatNumberWithDots(value);
    setAnggaranData(prev => ({
      ...prev,
      [subCatId]: formattedValue
    }));
  };

  // Handler untuk input realisasi dengan format
  const handleRealisasiChange = (subCatId: string, value: string) => {
    const formattedValue = formatNumberWithDots(value);
    setRealisasiData(prev => ({
      ...prev,
      [subCatId]: formattedValue
    }));
  };

  // Update calculateTotal untuk handle format dengan dots
  const calculateTotal = (data: {[key: string]: string}) => {
    return Object.values(data).reduce((sum, value) => {
      const numericValue = parseFloat(parseNumberFromDots(value) || '0');
      return sum + numericValue;
    }, 0);
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      const totalAnggaran = calculateTotal(anggaranData);
      const totalRealisasi = calculateTotal(realisasiData);
      
      // Prepare subcategories data
      const subCategoriesData = subCategories[selectedCategory as keyof typeof subCategories]?.map(subCat => ({
        id: subCat.id,
        label: subCat.label,
        anggaran: parseFloat(parseNumberFromDots(anggaranData[subCat.id] || '0')),
        realisasi: parseFloat(parseNumberFromDots(realisasiData[subCat.id] || '0')),
      })) || [];

      // Save each sub-category as separate DetailedAPBData records
      for (const subCat of subCategoriesData) {
        const detailedData: Omit<DetailedAPBData, "id" | "createdAt" | "updatedAt"> = {
          kategori: selectedCategory as 'PENDAPATAN' | 'BELANJA' | 'PEMBIAYAAN',
          subKategori: subCat.label,
          kodeRekening: subCat.id,
          uraian: subCat.label,
          tahun: parseInt(formData.tahun),
          anggaran: subCat.anggaran,
          realisasi: subCat.realisasi,
          keterangan: `Data APB ${selectedCategory} - ${subCat.label}`,
        };
        
        await addDetailedAPB(detailedData);
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving APB data:', error);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Filter data berdasarkan search dan tahun
  const filteredItems = financialItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const itemYear = new Date(item.date).getFullYear().toString();
    const matchesYear = selectedYear === "all" || itemYear === selectedYear;
    return matchesSearch && matchesYear;
  });

  const handleDeleteData = async (id: string) => {
    try {
      await deleteDetailedAPB(id);
    } catch (error) {
      console.error('Error deleting APB data:', error);
      alert('Gagal menghapus data. Silakan coba lagi.');
    }
  };

  const handleDeleteAllYearData = async (year: number) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus SEMUA data keuangan tahun ${year}? Tindakan ini tidak dapat dibatalkan.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      const yearData = apbByYear[year] || [];
      
      // Delete all data for the specified year
      await Promise.all(
        yearData.map(item => deleteDetailedAPB(item.id || ''))
      );
      
      alert(`Berhasil menghapus ${yearData.length} data keuangan tahun ${year}.`);
    } catch (error) {
      console.error('Error deleting all year data:', error);
      alert('Gagal menghapus data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-3 sm:p-4 md:p-6 safe-area-padding">
        <div className="max-w-7xl mx-auto">
          {/* Custom Header */}
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8"
            style={{ animation: 'slideUp 0.5s ease-out' }}
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Manajemen Keuangan Desa
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/90 ml-0 sm:ml-14">
              Kelola data keuangan dan APB Desa
            </p>
          </div>

          {/* Statistics Cards */}
          <div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
            style={{ animation: 'fadeIn 0.5s ease-out 0.1s backwards' }}
          >
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs sm:text-sm font-semibold">Total</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Total Data</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{apbData.length}</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs sm:text-sm font-semibold">Tahun</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Tahun Tersedia</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{availableYears.length}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs sm:text-sm font-semibold">APB</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Anggaran</p>
              <p className="text-base sm:text-lg md:text-xl font-bold truncate">Rp {apbData.reduce((sum, item) => sum + item.anggaran, 0).toLocaleString('id-ID')}</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                <div className="bg-white/20 rounded-lg px-2 py-1">
                  <span className="text-xs sm:text-sm font-semibold">Real</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">Realisasi</p>
              <p className="text-base sm:text-lg md:text-xl font-bold truncate">Rp {apbData.reduce((sum, item) => sum + item.realisasi, 0).toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
            style={{ animation: 'cardEntrance 0.6s ease-out 0.2s backwards' }}
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
                    placeholder="Cari data keuangan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors font-medium text-sm sm:text-base text-gray-900 bg-white min-w-[160px]"
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Tambah Data Keuangan
              </button>
            </div>
          </div>

          {/* Area untuk menampilkan ketika data kosong */}
          {Object.keys(apbByYear).length === 0 && (
            <div 
              className="text-center bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-sm"
              style={{ animation: 'cardEntrance 0.6s ease-out 0.3s backwards' }}
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Belum Ada Data APB Desa
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Belum ada data keuangan yang tersimpan. Mulai dengan menambahkan data APB Desa.
                </p>
              </div>
            </div>
          )}

          {/* Area untuk menampilkan data yang sudah ada - Card per tahun */}
          {Object.keys(filteredApbByYear).length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(filteredApbByYear)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, yearData]) => {
                  const totalAnggaran = yearData.reduce((sum, item) => sum + item.anggaran, 0);
                  const totalRealisasi = yearData.reduce((sum, item) => sum + item.realisasi, 0);
                  const totalItems = yearData.length;
                  
                  return (
                    <div 
                      key={year} 
                      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      style={{ animation: 'cardEntrance 0.6s ease-out' }}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Anggaran Tahun {year}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">{totalItems} item data keuangan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              onClick={() => handleDeleteAllYearData(parseInt(year))}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-[0.98] transition-all font-medium text-xs sm:text-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Hapus Semua</span>
                              <span className="sm:hidden">Hapus</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedYearData(yearData);
                                setDetailModalYear(parseInt(year));
                                setShowDetailModal(true);
                              }}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:scale-[0.98] transition-all font-medium text-xs sm:text-sm"
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Lihat Detail</span>
                              <span className="sm:hidden">Detail</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-green-700">Total Anggaran</p>
                                <p className="text-base sm:text-lg font-bold text-green-800 truncate">Rp {totalAnggaran.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-blue-700">Total Realisasi</p>
                                <p className="text-base sm:text-lg font-bold text-blue-800 truncate">Rp {totalRealisasi.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-600 font-medium">Selisih:</span>
                            <span className={`font-bold ${totalRealisasi >= totalAnggaran ? 'text-green-600' : 'text-red-600'}`}>
                              Rp {Math.abs(totalRealisasi - totalAnggaran).toLocaleString('id-ID')} 
                              {totalRealisasi >= totalAnggaran ? ' (Surplus)' : ' (Defisit)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Area untuk menampilkan ketika pencarian tidak menemukan hasil */}
          {Object.keys(apbByYear).length > 0 && Object.keys(filteredApbByYear).length === 0 && (
            <div 
              className="text-center bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-sm"
              style={{ animation: 'cardEntrance 0.6s ease-out 0.3s backwards' }}
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
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
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Tidak Ada Data Ditemukan
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Tidak ada data yang sesuai dengan pencarian "{searchTerm}" 
                  {selectedYear !== "all" && ` untuk tahun ${selectedYear}`}.
                </p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedYear("all");
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-medium text-sm sm:text-base rounded-lg hover:bg-green-600 active:scale-[0.98] transition-all"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal untuk memilih kategori */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Pilih Kategori Keuangan</h3>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className="text-gray-400 hover:text-gray-600 active:scale-[0.98] transition-all"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${category.borderColor} p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-xl active:scale-[0.98] ${category.bgColor}`}
                  >
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${category.bgColor} mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl sm:text-3xl">{category.icon}</span>
                      </div>
                      <h4 className={`text-base sm:text-xl font-bold ${category.textColor} mb-1 sm:mb-2`}>{category.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{category.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal untuk menambah data */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100">
              {/* Header dengan Progress Bar */}
              <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 border-b border-gray-100">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Category Icon */}
                    <div className={`w-12 h-12 rounded-xl ${categories.find(cat => cat.id === selectedCategory)?.bgColor} flex items-center justify-center`}>
                      <span className="text-2xl">{categories.find(cat => cat.id === selectedCategory)?.icon}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {categories.find(cat => cat.id === selectedCategory)?.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-base font-medium text-gray-700">
                          {currentStep === 1 && "Formulir Anggaran"}
                          {currentStep === 2 && "Formulir Realisasi"}
                          {currentStep === 3 && "Preview & Konfirmasi"}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                step <= currentStep 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm bg-white px-3 py-1 rounded-full text-gray-600 border">
                          Langkah {currentStep} dari 3
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-2 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-8 bg-gray-50/30 overflow-y-auto max-h-[calc(95vh-200px)]">
                {/* Step 1: Formulir Anggaran */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-700">Masukkan Data Anggaran</span>
                      </div>
                      <p className="text-gray-600 mt-2">Silakan isi nominal anggaran untuk setiap kategori di bawah ini</p>
                    </div>
                    
                    {/* Field Tahun */}
                    <div className="bg-white rounded-xl p-6 border-2 border-blue-200 mb-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <label className="text-lg font-semibold text-gray-900 block mb-1">
                            Tahun Anggaran
                          </label>
                          <p className="text-sm text-gray-600">Pilih tahun untuk data keuangan ini</p>
                        </div>
                      </div>
                      <select
                        value={formData.tahun}
                        onChange={(e) => setFormData(prev => ({...prev, tahun: e.target.value}))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg text-gray-900"
                        required
                      >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() + i - 2).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {subCategories[selectedCategory as keyof typeof subCategories]?.map((subCat, index) => (
                        <div key={subCat.id} className="group">
                          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">
                                  {subCat.label}
                                </label>
                                <p className="text-xs text-gray-500 mb-3">{subCat.placeholder}</p>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                Rp
                              </div>
                              <input
                                type="text"
                                placeholder="0"
                                value={anggaranData[subCat.id] || ""}
                                onChange={(e) => handleAnggaranChange(subCat.id, e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-medium bg-gray-50 focus:bg-white text-gray-900"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Formulir Realisasi */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">Masukkan Data Realisasi</span>
                      </div>
                      <p className="text-gray-600 mt-2">Silakan isi nominal realisasi untuk setiap kategori yang telah dianggarkan</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {subCategories[selectedCategory as keyof typeof subCategories]?.map((subCat, index) => (
                        <div key={subCat.id} className="group">
                          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-semibold text-sm group-hover:bg-green-500 group-hover:text-white transition-colors">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">
                                  {subCat.label}
                                </label>
                                <div className="flex items-center gap-2 mb-3">
                                  <p className="text-xs text-gray-500">{subCat.placeholder}</p>
                                  {anggaranData[subCat.id] && (
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                      Anggaran: Rp {parseInt(anggaranData[subCat.id]).toLocaleString('id-ID')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                Rp
                              </div>
                              <input
                                type="text"
                                placeholder="0"
                                value={realisasiData[subCat.id] || ""}
                                onChange={(e) => handleRealisasiChange(subCat.id, e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg font-medium bg-gray-50 focus:bg-white text-gray-900"
                              />
                              {anggaranData[subCat.id] && realisasiData[subCat.id] && (
                                <div className="mt-2 text-xs">
                                  {parseInt(realisasiData[subCat.id]) > parseInt(anggaranData[subCat.id]) ? (
                                    <span className="text-red-600 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                      Melebihi anggaran
                                    </span>
                                  ) : (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Dalam batas anggaran
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Preview */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm font-medium text-purple-700">Preview & Konfirmasi</span>
                      </div>
                      <p className="text-gray-600 mt-2">Review kembali data yang telah diinput sebelum menyimpan</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900">Total Anggaran</h4>
                            <p className="text-blue-600 text-sm">Rencana Keuangan</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          Rp {calculateTotal(anggaranData).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-green-900">Total Realisasi</h4>
                            <p className="text-green-600 text-sm">Penggunaan Aktual</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          Rp {calculateTotal(realisasiData).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className={`bg-gradient-to-br rounded-2xl p-6 border ${
                        calculateTotal(realisasiData) > calculateTotal(anggaranData) 
                          ? 'from-red-50 to-red-100 border-red-200' 
                          : 'from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            calculateTotal(realisasiData) > calculateTotal(anggaranData)
                              ? 'bg-red-500' 
                              : 'bg-gray-500'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div>
                            <h4 className={`font-bold ${
                              calculateTotal(realisasiData) > calculateTotal(anggaranData)
                                ? 'text-red-900' 
                                : 'text-gray-900'
                            }`}>Selisih</h4>
                            <p className={`text-sm ${
                              calculateTotal(realisasiData) > calculateTotal(anggaranData)
                                ? 'text-red-600' 
                                : 'text-gray-600'
                            }`}>
                              {calculateTotal(realisasiData) > calculateTotal(anggaranData) ? 'Over Budget' : 'Dalam Anggaran'}
                            </p>
                          </div>
                        </div>
                        <p className={`text-2xl font-bold ${
                          calculateTotal(realisasiData) > calculateTotal(anggaranData)
                            ? 'text-red-900' 
                            : 'text-gray-900'
                        }`}>
                          Rp {Math.abs(calculateTotal(anggaranData) - calculateTotal(realisasiData)).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h4 className="font-bold text-gray-900">Rincian Detail</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kategori</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Anggaran</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Realisasi</th>
                              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Selisih</th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {subCategories[selectedCategory as keyof typeof subCategories]?.map((subCat, index) => {
                              const anggaran = parseInt(anggaranData[subCat.id] || '0');
                              const realisasi = parseInt(realisasiData[subCat.id] || '0');
                              const selisih = anggaran - realisasi;
                              return (
                                <tr key={subCat.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-semibold text-gray-600">
                                        {index + 1}
                                      </div>
                                      <span className="font-medium text-gray-900">{subCat.label}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-blue-600">
                                    Rp {anggaran.toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-green-600">
                                    Rp {realisasi.toLocaleString('id-ID')}
                                  </td>
                                  <td className={`px-6 py-4 text-right font-mono ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {selisih >= 0 ? '+' : ''}Rp {selisih.toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {realisasi <= anggaran ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Normal
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        ⚠ Over
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="bg-white border-t border-gray-200 px-8 py-6">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={currentStep === 1 ? () => {
                        setShowAddModal(false);
                        setShowCategoryModal(true);
                      } : handlePrevStep}
                      className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      {currentStep === 1 ? "Pilih Kategori" : "Sebelumnya"}
                    </button>
                    
                    <div className="flex items-center gap-4">
                      {/* Step Indicator */}
                      <div className="hidden sm:flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                              step < currentStep 
                                ? 'bg-green-500 text-white' 
                                : step === currentStep 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {step < currentStep ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                step
                              )}
                            </div>
                            {step < 3 && (
                              <div className={`w-8 h-0.5 mx-1 ${
                                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {currentStep < 3 ? (
                        <button
                          onClick={handleNextStep}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Selanjutnya
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={handleFinalSubmit}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan Data
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Data per Tahun */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Detail Anggaran Tahun {detailModalYear}</h3>
                      <p className="text-gray-600">{selectedYearData.length} item data keuangan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-2 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const totalAnggaran = selectedYearData.reduce((sum, item) => sum + item.anggaran, 0);
                    const totalRealisasi = selectedYearData.reduce((sum, item) => sum + item.realisasi, 0);
                    const selisih = totalRealisasi - totalAnggaran;
                    
                    return (
                      <>
                        {/* Total Anggaran Card */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-700">Total Anggaran</p>
                              <p className="text-xs text-blue-600 mb-1">Rencana Keuangan</p>
                              <p className="text-lg font-bold text-blue-800">Rp {totalAnggaran.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Total Realisasi Card */}
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-700">Total Realisasi</p>
                              <p className="text-xs text-green-600 mb-1">Penggunaan Aktual</p>
                              <p className="text-lg font-bold text-green-800">Rp {totalRealisasi.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Selisih Card */}
                        <div className={`rounded-xl p-4 border ${selisih >= 0 ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selisih >= 0 ? 'bg-gray-100' : 'bg-red-100'}`}>
                              <svg className={`w-6 h-6 ${selisih >= 0 ? 'text-gray-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${selisih >= 0 ? 'text-gray-700' : 'text-red-700'}`}>Selisih</p>
                              <p className={`text-xs mb-1 ${selisih >= 0 ? 'text-gray-600' : 'text-red-600'}`}>Dalam Anggaran</p>
                              <p className={`text-lg font-bold ${selisih >= 0 ? 'text-gray-800' : 'text-red-800'}`}>
                                Rp {Math.abs(selisih).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                <div className="space-y-4">
                  {selectedYearData.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">{item.subKategori}</h4>
                            <p className="text-sm text-gray-600 mb-2">{item.uraian}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                item.kategori === 'PENDAPATAN' ? 'bg-green-100 text-green-800' :
                                item.kategori === 'BELANJA' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.kategori}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.kodeRekening}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-xs font-medium text-green-700 mb-1">Anggaran</p>
                                <p className="text-sm font-bold text-green-800">Rp {item.anggaran.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-xs font-medium text-blue-700 mb-1">Realisasi</p>
                                <p className="text-sm font-bold text-blue-800">Rp {item.realisasi.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            
                            {item.keterangan && (
                              <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                                <p className="text-xs text-gray-600">{item.keterangan}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteData(item.id || '')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
