"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from "../../components/BottomNavigation";
import { getDataDesa, DataDesaItem } from "../../../lib/dataDesaService";
import { canAccessDataDesaAnalisis } from "../../../lib/rolePermissions";
import { UserRole } from "../lib/useCurrentUser";
import PopulationStats from "./components/PopulationStats";
import DataChart from "./components/DataChart";
import AnimatedCounter from "./components/AnimatedCounter";

interface DaerahOption {
  id: string;
  name: string;
}

interface KategoriOption {
  id: string;
  name: string;
  items: string[];
}

export default function DataDesaPage() {
  const [dataWarga, setDataWarga] = useState<DataDesaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesa, setSelectedDesa] = useState<string>("");
  const [selectedKategori, setSelectedKategori] = useState<string>("");
  const [showDesaDropdown, setShowDesaDropdown] = useState(false);
  const [showKategoriDropdown, setShowKategoriDropdown] = useState(false);
  const [daerahOptions, setDaerahOptions] = useState<DaerahOption[]>([]);
  const [canAccessAnalisis, setCanAccessAnalisis] = useState(false);
  
  const desaDropdownRef = useRef<HTMLDivElement>(null);
  const kategoriDropdownRef = useRef<HTMLDivElement>(null);

  // Function to fetch daerah data from data-desa database
  const fetchDaerahData = async () => {
    try {
      const dataWargaTemp = await getDataDesa();
      console.log("🔍 Data warga sample:", dataWargaTemp.slice(0, 3)); // Log first 3 items to see structure
      
      // Debug: Check what education fields are available and their values
      const educationSample = dataWargaTemp.slice(0, 10).map(item => ({
        nama: item.namaLengkap,
        pendidikanTerakhir: item.pendidikanTerakhir,
        // Check other possible field names
        pendidikan: (item as any).pendidikan,
        education: (item as any).education
      }));
      console.log("🎓 Education data sample:", educationSample);
      
      // Get unique education values to see what's actually in the database
      const uniqueEducation = [...new Set(dataWargaTemp.map(item => item.pendidikanTerakhir).filter(edu => edu && edu.trim() !== ''))];
      console.log("📚 Unique education values in database:", uniqueEducation);
      
      const uniqueDaerah = [...new Set(dataWargaTemp.map(item => item.daerah).filter(daerah => daerah && daerah.trim() !== ''))].sort();
      console.log("🏘️ Unique daerah found:", uniqueDaerah); // Log unique daerah values
      
      // Create mapping from codes to actual daerah names
      const daerahMapping: { [key: string]: string } = {
        "1": "LUMINTANG",
        "2": "WANASARI", 
        "3": "MEKAR SARI",
        "4": "LELANGON",
        "5": "WANGAYA KELOD",
        "6": "TARUNA SARI",
        "7": "MEKAR SARI",
        // Add more mappings as needed based on your database codes
      };
      
      const daerahList: DaerahOption[] = [
        { id: "all", name: "Semua Daerah" }
      ];
      
      // Use a Set to track used codes to prevent duplicates
      const usedCodes = new Set<string>();
      
      uniqueDaerah.forEach((daerah) => {
        // Skip if daerah is empty or undefined
        if (!daerah) return;
        
        // Handle cases where daerah might be stored as "6 TARUNA SARI" or just "6"
        let code = daerah;
        let displayName = "";
        
        // If the daerah contains both code and name (e.g., "6 TARUNA SARI")
        if (daerah.includes(' ')) {
          const parts = daerah.split(' ');
          code = parts[0]; // Extract the code part
          displayName = parts.slice(1).join(' '); // Extract the name part
        } else {
          // If it's just a code, use the mapping to get full name
          code = daerah;
          displayName = daerahMapping[daerah] || daerah;
        }
        
        // Skip if we've already added this code
        if (usedCodes.has(code)) {
          return;
        }
        usedCodes.add(code);
        
        // Use only the clean display name (without code duplication)
        const finalDisplayName = displayName || daerah;
        
        daerahList.push({
          id: code, // Use code as ID for filtering
          name: finalDisplayName // Show only clean name
        });
      });
      
      console.log("📋 Final daerah options:", daerahList); // Log final options
      setDaerahOptions(daerahList);
    } catch (error) {
      console.error("Error fetching daerah data:", error);
      // Fallback to default data if error occurs
      const fallbackList: DaerahOption[] = [
        { id: "all", name: "Semua Daerah" }
      ];
      
      setDaerahOptions(fallbackList);
    }
  };

  const kategoriOptions: KategoriOption[] = [
    { 
      id: "agama", 
      name: "Agama",
      items: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]
    },
    { 
      id: "pekerjaan", 
      name: "Pekerjaan",
      items: ["Petani", "Pedagang", "PNS", "Swasta", "Wiraswasta", "Pelajar", "Tidak Bekerja"]
    },
    { 
      id: "suku-bangsa", 
      name: "Suku Bangsa",
      items: ["Bali", "Jawa", "Sunda", "Batak", "Minang", "Bugis", "Lainnya"]
    },
    { 
      id: "pendidikan", 
      name: "Pendidikan",
      items: ["Tidak bersekolah", "Tamat SD/Sederajat", "SLTP/Sederajat", "SLTA/Sederajat", "Diploma/Sederajat", "Sarjana/Sederajat"]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDataDesa();
        setDataWarga(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch daerah data from database
    fetchDaerahData();
    fetchData();
  }, []);
  
  // Check access to analisis data
  useEffect(() => {
    const checkAnalisisAccess = () => {
      try {
        const storedUser = localStorage.getItem('sigede_auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const userRole = userData.role as UserRole;
          setCanAccessAnalisis(canAccessDataDesaAnalisis(userRole));
        } else {
          setCanAccessAnalisis(false);
        }
      } catch (error) {
        console.error('Error checking analisis access:', error);
        setCanAccessAnalisis(false);
      }
    };
    
    checkAnalisisAccess();
  }, []);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desaDropdownRef.current && !desaDropdownRef.current.contains(event.target as Node)) {
        setShowDesaDropdown(false);
      }
      if (kategoriDropdownRef.current && !kategoriDropdownRef.current.contains(event.target as Node)) {
        setShowKategoriDropdown(false);
      }
    };

    if (showDesaDropdown || showKategoriDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDesaDropdown, showKategoriDropdown]);

  // Calculate basic statistics and chart data
  const totalPenduduk = dataWarga.length;

  // Filter data based on selected desa and kategori
  const filteredData = dataWarga.filter(item => {
    if (selectedDesa === "all" || selectedDesa === "") {
      return true;
    }
    
    // Extract code from item.daerah (handle both "6" and "6 TARUNA SARI" formats)
    let itemDaerahCode = item.daerah;
    if (item.daerah && item.daerah.includes(' ')) {
      // If daerah is stored as "6 TARUNA SARI", extract the code part
      itemDaerahCode = item.daerah.split(' ')[0];
    }
    
    // Now selectedDesa is just the code (e.g., "6"), so we can directly compare
    const matchesDesa = itemDaerahCode === selectedDesa;
    return matchesDesa;
  });

  // Generate chart data based on selected category
  const getChartData = () => {
    if (!selectedKategori || filteredData.length === 0) return null;

    const selectedKategoriObj = kategoriOptions.find(k => k.id === selectedKategori);
    if (!selectedKategoriObj) return null;

    let fieldName = '';
    switch (selectedKategori) {
      case 'agama':
        fieldName = 'agama';
        break;
      case 'jenis-kelamin':
        fieldName = 'jenisKelamin';
        break;
      case 'pekerjaan':
        fieldName = 'pekerjaan';
        break;
      case 'suku-bangsa':
        fieldName = 'sukuBangsa';
        break;
      case 'pendidikan':
        fieldName = 'pendidikanTerakhir';
        break;
      default:
        return null;
    }

    // Define education order
    const educationOrder = [
      "Tidak bersekolah",
      "Tidak/Belum Sekolah", 
      "Tamat SD/Sederajat",
      "SD/Sederajat",
      "SLTP/Sederajat",
      "SMP/SLTP/Sederajat",
      "SLTA/Sederajat", 
      "SMA/SLTA sederajat",
      "Diploma/Sederajat",
      "DIPLOMA",
      "Sarjana/Sederajat",
      "SARJANA"
    ];

    // Count occurrences with case-insensitive normalization
    const counts: { [key: string]: number } = {};
    const normalizedToOriginal: { [key: string]: string } = {}; // Map normalized keys to original display values
    
    // Debug: log some sample education data to understand the format
    if (fieldName === 'pendidikanTerakhir') {
      console.log("🎓 Sample education data:", filteredData.slice(0, 5).map(item => ({
        nama: (item as any).namaLengkap,
        pendidikan: (item as any)[fieldName]
      })));
    }
    
    filteredData.forEach(item => {
      let rawValue = (item as any)[fieldName] || 'Tidak Diketahui';
      
      // Special handling for education data - normalize to standard categories
      if (fieldName === 'pendidikanTerakhir') {
        const lowerValue = rawValue.toString().toLowerCase();
        
        // Group "Belum tamat" and "Belum sekolah" into "Tidak/Belum Sekolah"
        if (lowerValue.includes('belum tamat') || lowerValue.includes('belum sekolah') || lowerValue.includes('tidak bersekolah')) {
          rawValue = 'Tidak/Belum Sekolah';
        }
        // Group all diploma variants into "Diploma/Sederajat"
        else if (lowerValue.includes('diploma') && !lowerValue.includes('sarjana') && !lowerValue.includes('strata')) {
          rawValue = 'Diploma/Sederajat';
        }
        // Group all sarjana and higher education variants into "Sarjana/Sederajat"
        else if (lowerValue.includes('sarjana') || lowerValue.includes('strata') || lowerValue.includes('s1') || lowerValue.includes('s2') || lowerValue.includes('s3') || 
                 lowerValue.includes('magister') || lowerValue.includes('master') || lowerValue.includes('doktor') || lowerValue.includes('profesor') ||
                 lowerValue.includes('diploma iv') || lowerValue.includes('diploma 4')) {
          rawValue = 'Sarjana/Sederajat';
        }
        // Standardize SD
        else if (lowerValue.includes('sd') || lowerValue.includes('sekolah dasar') || lowerValue.includes('tamat sd')) {
          rawValue = 'Tamat SD/Sederajat';
        }
        // Standardize SMP/SLTP
        else if (lowerValue.includes('smp') || lowerValue.includes('sltp') || lowerValue.includes('sekolah menengah pertama')) {
          rawValue = 'SLTP/Sederajat';
        }
        // Standardize SMA/SLTA
        else if (lowerValue.includes('sma') || lowerValue.includes('slta') || lowerValue.includes('sekolah menengah atas')) {
          rawValue = 'SLTA/Sederajat';
        }
      }
      
      const normalizedKey = rawValue.toString().trim().toLowerCase();
      
      // Keep track of the original display value (prefer the one that appears first)
      if (!normalizedToOriginal[normalizedKey]) {
        // For education data, preserve original case since it has specific formatting
        if (fieldName === 'pendidikanTerakhir') {
          normalizedToOriginal[normalizedKey] = rawValue.toString().trim();
        } else {
          // Capitalize first letter for better display
          normalizedToOriginal[normalizedKey] = rawValue.toString().trim()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }
      
      counts[normalizedKey] = (counts[normalizedKey] || 0) + 1;
    });

    let sortedEntries;
    
    // Special sorting for education data
    if (fieldName === 'pendidikanTerakhir') {
      // Map entries to education order
      const educationEntries = Object.entries(counts).map(([normalizedKey, count]) => {
        const originalValue = normalizedToOriginal[normalizedKey];
        // Find order index, default to high number if not found
        let orderIndex = educationOrder.findIndex(edu => 
          edu.toLowerCase() === originalValue.toLowerCase() ||
          originalValue.toLowerCase().includes(edu.toLowerCase()) ||
          edu.toLowerCase().includes(originalValue.toLowerCase())
        );
        
        if (orderIndex === -1) {
          orderIndex = 999; // Put unmatched items at the end
        }
        
        return { normalizedKey, count, originalValue, orderIndex };
      });
      
      // Sort by education order, then by count
      educationEntries.sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) {
          return a.orderIndex - b.orderIndex;
        }
        return b.count - a.count;
      });
      
      sortedEntries = educationEntries.map(entry => [entry.normalizedKey, entry.count] as [string, number]);
    } else {
      // Sort by count for other categories
      sortedEntries = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8); // Show top 8 categories
    }

    return {
      labels: sortedEntries.map(([normalizedKey]) => normalizedToOriginal[normalizedKey]),
      values: sortedEntries.map(([,count]) => count)
    };
  };

  const chartData = useMemo(() => getChartData(), [selectedKategori, filteredData.length, selectedDesa]);

  const getSelectedDaerahName = () => {
    const daerah = daerahOptions.find(d => d.id === selectedDesa);
    return daerah ? daerah.name : "Pilih Daerah";
  };

  const getSelectedKategoriName = () => {
    const kategori = kategoriOptions.find(k => k.id === selectedKategori);
    return kategori ? kategori.name : "Pilih Kategori";
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <HeaderCard 
          title="Data Desa"
          subtitle=""
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Filter Section */}
        <div className="mb-6 sm:mb-8 lg:mb-10 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200 overflow-visible relative z-20">
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-700 mb-4 sm:mb-5 lg:mb-6">Filter Kategori</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
            {/* Pilih Desa Dropdown */}
            <div className="relative" ref={desaDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowDesaDropdown(!showDesaDropdown);
                  setShowKategoriDropdown(false);
                }}
                className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 bg-gray-50 border border-gray-200 rounded-xl text-left text-sm sm:text-base lg:text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span>{getSelectedDaerahName()}</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDesaDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-48 sm:max-h-56 lg:max-h-64 overflow-y-auto">
                  <div className="py-1">
                    {daerahOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          console.log('Desa selected:', option.id, option.name);
                          setSelectedDesa(option.id);
                          setShowDesaDropdown(false);
                        }}
                        className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 text-left text-sm sm:text-base lg:text-lg text-gray-700 hover:bg-gray-50 transition-colors block"
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pilih Kategori Dropdown */}
            <div className="relative" ref={kategoriDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setShowKategoriDropdown(!showKategoriDropdown);
                  setShowDesaDropdown(false);
                }}
                className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 bg-gray-50 border border-gray-200 rounded-xl text-left text-sm sm:text-base lg:text-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span>{getSelectedKategoriName()}</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showKategoriDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 w-64 sm:w-72 lg:w-80 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    {kategoriOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          console.log('Kategori selected:', option.id, option.name);
                          setSelectedKategori(option.id);
                          setShowKategoriDropdown(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors block"
                      >
                        <div className="font-medium text-gray-900">{option.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1 space-y-1">
                          {option.items.slice(0, 3).map((item, idx) => (
                            <div key={idx}>{item}</div>
                          ))}
                          {option.items.length > 3 && (
                            <div className="text-blue-500">+{option.items.length - 3} lainnya</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Population Summary */}
        {/* Population Statistics */}
        <PopulationStats data={filteredData} />

        {/* Analysis Button - Only show if user has access */}
        {canAccessAnalisis && (
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <Link 
              href="/masyarakat/data-desa/analisis"
              className="block w-full py-3 sm:py-4 lg:py-5 px-4 sm:px-6 lg:px-8 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-sm transition-colors text-center text-sm sm:text-base lg:text-lg"
            >
              Analisis Data
            </Link>
          </div>
        )}

        {/* Charts Section */}
        <div className="space-y-6 sm:space-y-8 lg:space-y-10 relative z-0">
          {/* Bar Chart */}
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-700 mb-4 sm:mb-5 lg:mb-6">Grafik Batang</h3>
            {selectedDesa && selectedKategori && chartData ? (
              <DataChart
                type="bar"
                data={{
                  labels: chartData.labels,
                  values: chartData.values
                }}
                title={`Data ${getSelectedKategoriName()}`}
              />
            ) : (
              <div className="h-48 sm:h-56 lg:h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm sm:text-base lg:text-lg">Tentukan Desa dan Kategori untuk menampilkan grafik</p>
                </div>
              </div>
            )}
          </div>

          {/* Donut Chart */}
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-700 mb-4 sm:mb-5 lg:mb-6">Grafik Donut</h3>
            {selectedDesa && selectedKategori && chartData ? (
              <div className="h-64 sm:h-72 lg:h-80">
                <DataChart
                  type="doughnut"
                  data={{
                    labels: chartData.labels,
                    values: chartData.values
                  }}
                  title={`Distribusi ${getSelectedKategoriName()}`}
                  height={250}
                />
              </div>
            ) : (
              <div className="h-48 sm:h-56 lg:h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  <p className="text-sm sm:text-base lg:text-lg">Tentukan Desa dan Kategori untuk menampilkan grafik</p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
