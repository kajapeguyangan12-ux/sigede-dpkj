"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from "../../../components/BottomNavigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { canAccessDataDesaAnalisis } from "@/lib/rolePermissions";
import { UserRole } from "../../lib/useCurrentUser";
import { getDataDesa, DataDesaItem } from "@/lib/dataDesaService";
import { useCountUp } from "@/hooks/useCountUp";

// Add keyframes for SaaS-style animations
const styles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.97);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      max-height: 2000px;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
      max-height: 2000px;
    }
    to {
      opacity: 0;
      transform: translateY(-30px) scale(0.97);
      max-height: 0;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.92);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    50% {
      box-shadow: 0 0 35px rgba(59, 130, 246, 0.6);
    }
  }
  
  .animate-slideDown {
    animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .animate-shimmer {
    animation: shimmer 3s infinite;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200% 100%;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .gradient-border {
    position: relative;
    background: white;
    border-radius: 24px;
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

interface FilterState {
  daerah: string;
  jenisKelamin: string;
  agama: string;
  sukuBangsa: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  kewarganegaraan: string;
  statusNikah: string;
}

interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export default function AnalisisDataPage() {
  const router = useRouter();
  
  // Access control check
  useEffect(() => {
    const checkAccess = () => {
      try {
        const storedUser = localStorage.getItem('sigede_auth_user');
        if (!storedUser) {
          router.push('/masyarakat/login');
          return;
        }
        
        const userData = JSON.parse(storedUser);
        const userRole = userData.role as UserRole;
        
        if (!canAccessDataDesaAnalisis(userRole)) {
          console.log('❌ Access denied to data analisis for role:', userRole);
          router.push('/masyarakat/data-desa');
          return;
        }
        
        console.log('✅ Access granted to data analisis for role:', userRole);
      } catch (error) {
        console.error('❌ Error checking analisis access:', error);
        router.push('/masyarakat/login');
      }
    };
    
    checkAccess();
  }, [router]);
  
  const [allData, setAllData] = useState<DataDesaItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataDesaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetAge, setTargetAge] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showPredictionResult, setShowPredictionResult] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    daerah: "",
    jenisKelamin: "",
    agama: "",
    sukuBangsa: "",
    pendidikanTerakhir: "",
    pekerjaan: "",
    kewarganegaraan: "",
    statusNikah: "",
  });

  // Dynamic filter options - akan diisi dari data
  const [filterOptions, setFilterOptions] = useState({
    daerah: [] as string[],
    jenisKelamin: [] as string[],
    agama: [] as string[],
    sukuBangsa: [] as string[],
    pendidikanTerakhir: [] as string[],
    pekerjaan: [] as string[],
    kewarganegaraan: [] as string[],
    statusNikah: [] as string[],
  });

  useEffect(() => {
    fetchAllDataDesa();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allData]);

  useEffect(() => {
    if (filteredData.length > 0) {
      calculateAgeGroups();
    }
  }, [filteredData]);

  // Generate dynamic filter options from data
  useEffect(() => {
    if (allData.length > 0) {
      const options = {
        daerah: [...new Set(allData.map(item => item.daerah).filter(Boolean))].sort() as string[],
        jenisKelamin: [...new Set(allData.map(item => item.jenisKelamin).filter(Boolean))].sort() as string[],
        agama: [...new Set(allData.map(item => item.agama).filter(Boolean))].sort() as string[],
        sukuBangsa: [...new Set(allData.map(item => item.sukuBangsa).filter(Boolean))].sort() as string[],
        pendidikanTerakhir: [...new Set(allData.map(item => item.pendidikanTerakhir).filter(Boolean))].sort() as string[],
        pekerjaan: [...new Set(allData.map(item => item.pekerjaan).filter(Boolean))].sort() as string[],
        kewarganegaraan: [...new Set(allData.map(item => item.kewarganegaraan).filter(Boolean))].sort() as string[],
        statusNikah: [...new Set(allData.map(item => item.statusNikah).filter(Boolean))].sort() as string[],
      };
      setFilterOptions(options);
    }
  }, [allData]);

  const handleToggleFilter = () => {
    if (showFilterPanel) {
      // Trigger closing animation
      setIsClosing(true);
      setTimeout(() => {
        setShowFilterPanel(false);
        setIsClosing(false);
      }, 400); // Match animation duration
    } else {
      // Open immediately
      setShowFilterPanel(true);
    }
  };

  const fetchAllDataDesa = async () => {
    try {
      setLoading(true);
      const data = await getDataDesa();
      
      console.log('Data loaded from data-desa:', data.length, 'records');
      setAllData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error loading data-desa:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  };

  const calculateAgeGroups = () => {
    const groups = [
      { range: "0-5", min: 0, max: 5, count: 0 },
      { range: "6-12", min: 6, max: 12, count: 0 },
      { range: "13-17", min: 13, max: 17, count: 0 },
      { range: "18-25", min: 18, max: 25, count: 0 },
      { range: "26-35", min: 26, max: 35, count: 0 },
      { range: "36-45", min: 36, max: 45, count: 0 },
      { range: "46-55", min: 46, max: 55, count: 0 },
      { range: "56-65", min: 56, max: 65, count: 0 },
      { range: ">65", min: 66, max: 999, count: 0 },
    ];

    filteredData.forEach(person => {
      if (person.tanggalLahir) {
        const age = calculateAge(person.tanggalLahir);
        const group = groups.find(g => age >= g.min && age <= g.max);
        if (group) group.count++;
      }
    });

    const total = filteredData.length;
    const ageGroupsWithPercentage = groups.map(g => ({
      range: g.range,
      count: g.count,
      percentage: total > 0 ? (g.count / total) * 100 : 0,
    }));

    setAgeGroups(ageGroupsWithPercentage);
  };

  const applyFilters = () => {
    let result = [...allData];

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => {
          const itemValue = item[key as keyof DataDesaItem];
          return itemValue?.toString().toLowerCase() === value.toLowerCase();
        });
      }
    });

    setFilteredData(result);
  };

  const resetFilters = () => {
    setFilters({
      daerah: "",
      jenisKelamin: "",
      agama: "",
      sukuBangsa: "",
      pendidikanTerakhir: "",
      pekerjaan: "",
      kewarganegaraan: "",
      statusNikah: "",
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

  const predictAgeCount = () => {
    if (!targetAge) return 0;
    
    const targetAgeNum = parseInt(targetAge);
    if (isNaN(targetAgeNum)) return 0;

    return filteredData.filter(person => {
      if (!person.tanggalLahir) return false;
      const age = calculateAge(person.tanggalLahir);
      return age === targetAgeNum;
    }).length;
  };

  const handleConfirmPrediction = () => {
    if (targetAge && selectedDate) {
      setShowPredictionResult(true);
    }
  };

  const handleResetPrediction = () => {
    setTargetAge("");
    setSelectedDate("");
    setShowPredictionResult(false);
  };

  // Count up animation for prediction result
  const predictionCount = predictAgeCount();
  const { count: animatedCount } = useCountUp({
    end: predictionCount,
    duration: 1500,
    enableScrollSpy: false,
    preserveValue: false,
  });

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4">
          <HeaderCard title="Analisis Data" backUrl="/masyarakat/data-desa" showBackButton={true} />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent mx-auto absolute top-0 left-1/2 -translate-x-1/2"></div>
              </div>
              <p className="text-gray-600 mt-4 font-medium">Memuat data analisis...</p>
              <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative mx-auto w-full max-w-md px-4 pb-20 pt-4">
        <HeaderCard title="Analisis Data" backUrl="/masyarakat/data-desa" showBackButton={true} />

        {/* Summary Card - SaaS Style */}
        <div className="mb-6 relative group animate-scaleIn">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative glass-effect rounded-3xl p-8 shadow-2xl border border-white/40">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-2xl mb-5 animate-float">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200/50">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Penduduk</span>
                </div>
              </div>
              <div className="relative">
                <div className="text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 leading-none">
                  {filteredData.length.toLocaleString()}
                </div>
              </div>
              <div className="text-base text-gray-600 font-semibold">Jiwa</div>
              
              {activeFiltersCount > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-200/50 animate-fadeIn">
                  <div className="flex items-center justify-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                      </svg>
                      {activeFiltersCount} Filter
                    </div>
                    <div className="text-gray-400 font-medium">dari</div>
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm">
                      {allData.length.toLocaleString()} Total
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel Toggle - SaaS Style */}
        <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleToggleFilter}
            className="w-full group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between px-6 py-5 glass-effect rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 group-hover:border-blue-300/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-bold text-gray-800 block text-lg">Filter & Analisis</span>
                  <span className="text-xs text-gray-500 font-medium">Saring data berdasarkan kategori</span>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="ml-3 animate-scaleIn">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-full font-bold shadow-lg flex items-center gap-1.5">
                      <span>{activeFiltersCount}</span>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-semibold hidden sm:block">
                  {showFilterPanel ? 'Tutup' : 'Tampilkan'}
                </span>
                <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-500 ${showFilterPanel ? 'rotate-180' : 'rotate-0'}`}>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Filter Panel - SaaS Style with smooth animation */}
        {showFilterPanel && (
          <div className={`mb-6 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-blue-100/50 overflow-hidden ${isClosing ? 'animate-slideUp' : 'animate-slideDown'}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-7 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">Filter Data</h3>
                    <p className="text-xs text-gray-500 font-medium">Terapkan filter sesuai kebutuhan</p>
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="group/btn px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-scaleIn flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5">
                {/* Daerah */}
                <div className="group animate-fadeIn" style={{ animationDelay: '0.05s' }}>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    DAERAH
                  </label>
                  <select
                    value={filters.daerah}
                    onChange={(e) => setFilters({ ...filters, daerah: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300 shadow-sm appearance-none cursor-pointer"
                    style={{ color: filters.daerah ? '#1f2937' : '#9ca3af' }}
                  >
                    <option value="" className="text-gray-400">Pilih Daerah</option>
                    {filterOptions.daerah.map((option: string) => (
                      <option key={option} value={option} className="text-gray-700">{option}</option>
                    ))}
                  </select>
                </div>

              {/* Jenis Kelamin */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  JENIS KELAMIN
                </label>
                <select
                  value={filters.jenisKelamin}
                  onChange={(e) => setFilters({ ...filters, jenisKelamin: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.jenisKelamin ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Jenis Kelamin</option>
                  {filterOptions.jenisKelamin.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Agama */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  AGAMA
                </label>
                <select
                  value={filters.agama}
                  onChange={(e) => setFilters({ ...filters, agama: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.agama ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Agama</option>
                  {filterOptions.agama.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Suku Bangsa */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                  SUKU BANGSA
                </label>
                <select
                  value={filters.sukuBangsa}
                  onChange={(e) => setFilters({ ...filters, sukuBangsa: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all hover:border-pink-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.sukuBangsa ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Suku Bangsa</option>
                  {filterOptions.sukuBangsa.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Pendidikan */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.25s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  PENDIDIKAN
                </label>
                <select
                  value={filters.pendidikanTerakhir}
                  onChange={(e) => setFilters({ ...filters, pendidikanTerakhir: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-green-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.pendidikanTerakhir ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Pendidikan</option>
                  {filterOptions.pendidikanTerakhir.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Pekerjaan */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  PEKERJAAN
                </label>
                <select
                  value={filters.pekerjaan}
                  onChange={(e) => setFilters({ ...filters, pekerjaan: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all hover:border-yellow-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.pekerjaan ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Pekerjaan</option>
                  {filterOptions.pekerjaan.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Warga Negara */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.35s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  WARGA NEGARA
                </label>
                <select
                  value={filters.kewarganegaraan}
                  onChange={(e) => setFilters({ ...filters, kewarganegaraan: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.kewarganegaraan ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Kewarganegaraan</option>
                  {filterOptions.kewarganegaraan.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Status Pernikahan */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  STATUS PERNIKAHAN
                </label>
                <select
                  value={filters.statusNikah}
                  onChange={(e) => setFilters({ ...filters, statusNikah: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-orange-300 shadow-sm appearance-none cursor-pointer"
                  style={{ color: filters.statusNikah ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Pilih Status Pernikahan</option>
                  {filterOptions.statusNikah.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Prediksi Usia Penduduk - Enhanced */}
        <div className="mb-6 bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-3xl p-6 shadow-2xl border border-purple-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Prediksi Usia Penduduk</h3>
              <p className="text-xs text-gray-500">Analisis usia berdasarkan tanggal tertentu</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Pilih Tanggal dan Target Usia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  PILIH TANGGAL
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-white to-purple-50 border-2 border-purple-200 rounded-xl text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 shadow-sm"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                  </svg>
                  TARGET USIA
                </label>
                <input
                  type="number"
                  value={targetAge}
                  onChange={(e) => setTargetAge(e.target.value)}
                  placeholder="Masukkan usia"
                  min="0"
                  max="120"
                  className="w-full px-4 py-3 bg-gradient-to-r from-white to-pink-50 border-2 border-pink-200 rounded-xl text-base font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all hover:border-pink-300 shadow-sm"
                />
              </div>
            </div>

            {/* Buttons - Show when any field is filled */}
            {(targetAge || selectedDate) && (
              <div className="flex gap-3 animate-fadeIn">
                <button
                  onClick={handleConfirmPrediction}
                  disabled={!targetAge || !selectedDate}
                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 hover:from-purple-600 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Konfirmasi
                </button>
                <button
                  onClick={handleResetPrediction}
                  className="px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            )}

            {showPredictionResult && targetAge && selectedDate && (
              <div className="mt-5 p-6 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl border border-white/20 animate-scaleIn">
                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                    </svg>
                    <div className="text-xs font-bold uppercase tracking-wide opacity-90">Hasil Pencarian</div>
                  </div>
                  <div className="text-sm mb-2 font-medium">Jumlah Penduduk Usia {targetAge} Tahun</div>
                  <div className="text-sm mb-3 font-medium opacity-90">Per Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div className="text-5xl font-extrabold my-3 drop-shadow-lg">{animatedCount}</div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div className="text-sm font-semibold">
                      {filteredData.length > 0 
                        ? ((predictionCount / filteredData.length) * 100).toFixed(1) + "% dari total"
                        : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Distribusi Kelompok Usia - Enhanced */}
        <div className="mb-6 bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 rounded-3xl p-6 shadow-2xl border border-indigo-100/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Distribusi Kelompok Usia</h3>
              <p className="text-xs text-gray-500">Visualisasi sebaran usia penduduk</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {ageGroups.map((group, index) => {
              // Gradient colors untuk setiap kelompok usia
              const gradients = [
                'from-red-400 to-red-600',
                'from-orange-400 to-orange-600',
                'from-amber-400 to-amber-600',
                'from-yellow-400 to-yellow-600',
                'from-lime-400 to-lime-600',
                'from-green-400 to-green-600',
                'from-emerald-400 to-emerald-600',
                'from-teal-400 to-teal-600',
                'from-cyan-400 to-cyan-600',
                'from-sky-400 to-sky-600',
                'from-blue-400 to-blue-600',
                'from-indigo-400 to-indigo-600',
                'from-violet-400 to-violet-600',
                'from-purple-400 to-purple-600',
                'from-fuchsia-400 to-fuchsia-600'
              ];
              
              return (
                <div key={index} className="group hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{group.range} tahun</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                        {group.count} orang
                      </span>
                    </div>
                    <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {group.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className={`bg-gradient-to-r ${gradients[index % gradients.length]} h-full rounded-full transition-all duration-700 shadow-lg`}
                      style={{ width: group.percentage + "%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
