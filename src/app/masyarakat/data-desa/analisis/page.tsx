"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  desa: string;
  daerah: string;
  jenisKelamin: string;
  agama: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
}

interface AgeGroup {
  range: string;
  label: string;
  count: number;
  percentage: number;
}

export default function AnalisisDataPage() {
  const router = useRouter();
  
  // Strict access control - ONLY kepala_desa allowed
  const [accessDenied, setAccessDenied] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    const checkAccess = () => {
      try {
        const storedUser = localStorage.getItem('sigede_auth_user');
        if (!storedUser) {
          console.log('❌ No user found in localStorage');
          router.push('/masyarakat/login');
          return;
        }
        
        const userData = JSON.parse(storedUser);
        const userRole = userData.role as UserRole;
        
        // STRICT CHECK: Only kepala_desa allowed, no bypass
        if (userRole !== 'kepala_desa') {
          console.log('❌ Access DENIED to data analisis. Role:', userRole, '| Required: kepala_desa');
          setAccessDenied(true);
          setTimeout(() => {
            router.push('/masyarakat/data-desa');
          }, 2000);
          return;
        }
        
        // Double check with permission function
        if (!canAccessDataDesaAnalisis(userRole)) {
          console.log('❌ Permission check FAILED for role:', userRole);
          setAccessDenied(true);
          setTimeout(() => {
            router.push('/masyarakat/data-desa');
          }, 2000);
          return;
        }
        
        console.log('✅ Access GRANTED to data analisis for kepala_desa');
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Error checking analisis access:', error);
        setAccessDenied(true);
        setTimeout(() => {
          router.push('/masyarakat/login');
        }, 2000);
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
  const [predictedPeople, setPredictedPeople] = useState<DataDesaItem[]>([]); // Array penduduk yang match prediksi
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Age Group Detail states
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [ageGroupPeople, setAgeGroupPeople] = useState<DataDesaItem[]>([]);
  const [showAgeGroupDetail, setShowAgeGroupDetail] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Pagination states for age group detail
  const [ageGroupCurrentPage, setAgeGroupCurrentPage] = useState(1);
  const [ageGroupItemsPerPage, setAgeGroupItemsPerPage] = useState(10);
  const [ageGroupSearchQuery, setAgeGroupSearchQuery] = useState("");
  const [debouncedAgeGroupSearchQuery, setDebouncedAgeGroupSearchQuery] = useState("");

  const [filters, setFilters] = useState<FilterState>({
    desa: "",
    daerah: "",
    jenisKelamin: "",
    agama: "",
    pendidikanTerakhir: "",
    pekerjaan: "",
  });

  // Dynamic filter options - akan diisi dari data
  const [filterOptions, setFilterOptions] = useState({
    daerah: [] as string[],
    jenisKelamin: [] as string[],
    agama: [] as string[],
    pendidikanTerakhir: [] as string[],
    pekerjaan: [] as string[],
  });

  useEffect(() => {
    setLoading(true);
    
    // Mobile detection for aggressive cache clearing
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Mobile device detected - clearing stale data');
      // Reset states to force fresh data
      setAgeGroups([]);
      setPredictedPeople([]);
    }
    
    fetchAllDataDesa();
    
    // Auto-refresh data every 5 minutes to keep it updated
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...');
      fetchAllDataDesa();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allData]);

  useEffect(() => {
    // Always calculate age groups, even if empty (will show 0s)
    console.log('🔄 useEffect triggered for calculateAgeGroups, filteredData.length:', filteredData.length);
    console.log('🔄 filteredData is array?', Array.isArray(filteredData));
    console.log('🔄 calculateAgeGroups function exists?', typeof calculateAgeGroups === 'function');
    
    // Mobile optimization: ensure filteredData is ready before calculating
    if (Array.isArray(filteredData)) {
      calculateAgeGroups();
    } else {
      console.warn('⚠️ filteredData is not an array, skipping calculation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData]);

  // Debounce search queries untuk optimasi performa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAgeGroupSearchQuery(ageGroupSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [ageGroupSearchQuery]);

  // Reset prediction when filters change
  useEffect(() => {
    if (showPredictionResult) {
      // Recalculate prediction when filtered data changes
      setShowPredictionResult(false);
      // Will need to click Konfirmasi again
    }
  }, [filteredData.length]);

  // Auto-recalculate age groups every minute for real-time age updates
  useEffect(() => {
    const ageUpdateInterval = setInterval(() => {
      if (filteredData.length > 0) {
        console.log('⏰ Auto-updating age calculations...');
        calculateAgeGroups();
        // Also update prediction if shown
        if (showPredictionResult && targetAge && selectedDate) {
          // Force re-render to update prediction count
          setShowPredictionResult(false);
          setTimeout(() => setShowPredictionResult(true), 100);
        }
      }
    }, 60 * 1000); // Every 1 minute

    return () => clearInterval(ageUpdateInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, showPredictionResult, targetAge, selectedDate]);

  // Generate dynamic filter options from data
  useEffect(() => {
    if (allData.length > 0) {
      const options = {
        daerah: [...new Set(allData.map(item => item.daerah).filter(Boolean))].sort() as string[],
        jenisKelamin: [...new Set(allData.map(item => item.jenisKelamin).filter(Boolean))].sort() as string[],
        agama: [...new Set(allData.map(item => item.agama).filter(Boolean))].sort() as string[],
        pendidikanTerakhir: [...new Set(allData.map(item => item.pendidikanTerakhir).filter(Boolean))].sort() as string[],
        pekerjaan: [...new Set(allData.map(item => item.pekerjaan).filter(Boolean))].sort() as string[],
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
      setIsRefreshing(true);
      const data = await getDataDesa();
      
      console.log('📊 Data loaded from data-desa:', data.length, 'records');
      console.log('📊 Sample data:', data.slice(0, 2));
      
      setAllData(data);
      setFilteredData(data);
      setLastRefresh(new Date());
      
      // Force calculate age groups immediately after data loaded
      if (data.length > 0) {
        console.log('✅ Data set successfully, total:', data.length);
      } else {
        console.warn('⚠️ No data loaded from getDataDesa()');
      }
    } catch (error) {
      console.error("❌ Error loading data-desa:", error);
      // Set empty arrays to prevent undefined errors
      setAllData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // OPTIMIZED dengan useCallback - fungsi ini dipanggil ribuan kali
  const calculateAge = useCallback((birthDate: string, targetDate?: string): number => {
    if (!birthDate) return 0;
    
    try {
      const birth = new Date(birthDate);
      const referenceDate = targetDate ? new Date(targetDate) : new Date();
      let age = referenceDate.getFullYear() - birth.getFullYear();
      const monthDiff = referenceDate.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  }, []);

  // OPTIMIZED dengan useCallback - PENTING untuk mobile
  const calculateAgeGroups = useCallback(() => {
    console.log('🎯 calculateAgeGroups called with filteredData.length:', filteredData.length);
    console.log('🎯 First 3 people data:', filteredData.slice(0, 3).map(p => ({
      nama: p.namaLengkap,
      tanggalLahir: p.tanggalLahir,
      age: p.tanggalLahir ? calculateAge(p.tanggalLahir) : 'N/A'
    })));
    
    const groups = [
      { range: "0-5 tahun", label: "0-5 tahun", min: 0, max: 5, count: 0 },
      { range: "6-12 tahun", label: "6-12 tahun", min: 6, max: 12, count: 0 },
      { range: "13-17 tahun", label: "13-17 tahun", min: 13, max: 17, count: 0 },
      { range: "18-25 tahun", label: "18-25 tahun", min: 18, max: 25, count: 0 },
      { range: "26-35 tahun", label: "26-35 tahun", min: 26, max: 35, count: 0 },
      { range: "36-45 tahun", label: "36-45 tahun", min: 36, max: 45, count: 0 },
      { range: "46-55 tahun", label: "46-55 tahun", min: 46, max: 55, count: 0 },
      { range: "56-65 tahun", label: "56-65 tahun", min: 56, max: 65, count: 0 },
      { range: ">65 tahun", label: ">65 tahun", min: 66, max: 999, count: 0 },
    ];

    let totalWithBirthDate = 0;
    filteredData.forEach(person => {
      if (person.tanggalLahir) {
        totalWithBirthDate++;
        const age = calculateAge(person.tanggalLahir);
        const group = groups.find(g => age >= g.min && age <= g.max);
        if (group) {
          group.count++;
        } else {
          console.warn('⚠️ Age not in any group:', age, 'for person:', person.namaLengkap);
        }
      }
    });

    const total = filteredData.length;
    const ageGroupsWithPercentage = groups.map(g => ({
      range: g.range,
      label: g.label,
      count: g.count,
      percentage: total > 0 ? (g.count / total) * 100 : 0,
    }));

    console.log('📊 Age Groups Calculated:', {
      total,
      totalWithBirthDate,
      groups: ageGroupsWithPercentage,
      hasData: ageGroupsWithPercentage.some(g => g.count > 0),
      device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
    });

    setAgeGroups(ageGroupsWithPercentage);
  }, [filteredData, calculateAge]);

  // OPTIMIZED dengan useCallback
  const applyFilters = useCallback(() => {
    let result = [...allData];

    // Filter berdasarkan desa (karena desa tidak ada di DataDesaItem, kita skip atau filter by logic lain)
    // Untuk sekarang kita skip filter desa karena semua data sudah dari satu desa
    
    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'desa') { // Skip desa filter
        result = result.filter(item => {
          const itemValue = item[key as keyof DataDesaItem];
          if (!itemValue) return false;
          
          // Handle daerah special case - might have code prefix
          if (key === 'daerah') {
            const itemDaerah = itemValue.toString();
            // Check if it matches directly or if it's part of the string
            return itemDaerah === value || 
                   itemDaerah.toLowerCase().includes(value.toLowerCase()) ||
                   value.toLowerCase().includes(itemDaerah.toLowerCase());
          }
          
          return itemValue.toString().toLowerCase() === value.toLowerCase();
        });
      }
    });

    console.log('🔍 Filter applied:', { 
      filters, 
      originalCount: allData.length, 
      filteredCount: result.length 
    });

    setFilteredData(result);
  }, [allData, filters]);

  // OPTIMIZED dengan useCallback
  const resetFilters = useCallback(() => {
    setFilters({
      desa: "",
      daerah: "",
      jenisKelamin: "",
      agama: "",
      pendidikanTerakhir: "",
      pekerjaan: "",
    });
  }, []);

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

  const predictAgeCount = () => {
    if (!targetAge || !selectedDate) return 0;
    
    const targetAgeNum = parseInt(targetAge);
    if (isNaN(targetAgeNum)) return 0;

    // Calculate age at the selected date for each person in filtered data
    const matchingPeople = filteredData.filter(person => {
      if (!person.tanggalLahir) return false;
      const ageAtDate = calculateAge(person.tanggalLahir, selectedDate);
      return ageAtDate === targetAgeNum;
    });

    console.log('🎯 Prediction:', {
      targetAge: targetAgeNum,
      selectedDate,
      filteredDataCount: filteredData.length,
      matchingCount: matchingPeople.length,
      activeFilters: filters
    });

    return matchingPeople.length;
  };

  // OPTIMIZED dengan useCallback
  const handleConfirmPrediction = useCallback(() => {
    console.log('🎯 handleConfirmPrediction called:', { targetAge, selectedDate, filteredDataLength: filteredData.length });
    
    if (targetAge && selectedDate) {
      const targetAgeNum = parseInt(targetAge);
      if (isNaN(targetAgeNum)) {
        console.log('❌ Invalid targetAge:', targetAge);
        return;
      }

      // Get matching people data
      const matchingPeople = filteredData.filter(person => {
        if (!person.tanggalLahir) return false;
        const ageAtDate = calculateAge(person.tanggalLahir, selectedDate);
        return ageAtDate === targetAgeNum;
      });

      console.log('✅ Matching people found:', matchingPeople.length);
      console.log('📊 Sample:', matchingPeople.slice(0, 2));

      setPredictedPeople(matchingPeople);
      setShowPredictionResult(true);
      setCurrentPage(1); // Reset to first page
      setSearchQuery(""); // Reset search
      
      console.log('✅ State updated: showPredictionResult=true, predictedPeople.length=', matchingPeople.length);
    } else {
      console.log('❌ Missing targetAge or selectedDate');
    }
  }, [targetAge, selectedDate, filteredData]);

  // OPTIMIZED dengan useCallback
  const handleResetPrediction = useCallback(() => {
    setTargetAge("");
    setSelectedDate("");
    setShowPredictionResult(false);
    setPredictedPeople([]);
    setCurrentPage(1);
    setSearchQuery("");
  }, []);

  // Handler untuk klik kelompok usia
  const handleAgeGroupClick = (groupLabel: string, minAge: number, maxAge: number | null) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Filter penduduk berdasarkan kelompok usia
    const peopleInGroup = filteredData.filter(person => {
      if (!person.tanggalLahir) return false;
      
      const birthDate = new Date(person.tanggalLahir);
      let age = currentYear - birthDate.getFullYear();
      const monthDiff = currentMonth - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && currentDay < birthDate.getDate())) {
        age--;
      }

      if (maxAge === null) {
        return age > minAge; // Untuk >65 tahun
      }
      return age >= minAge && age <= maxAge;
    });

    setSelectedAgeGroup(groupLabel);
    setAgeGroupPeople(peopleInGroup);
    setShowAgeGroupDetail(true);
    setAgeGroupCurrentPage(1);
    setAgeGroupSearchQuery("");
    
    // Scroll ke section detail
    setTimeout(() => {
      document.getElementById('age-group-detail-section')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleCloseAgeGroupDetail = () => {
    setShowAgeGroupDetail(false);
    setSelectedAgeGroup(null);
    setAgeGroupPeople([]);
    setAgeGroupCurrentPage(1);
    setAgeGroupSearchQuery("");
  };

  // Filter predicted people by search query - OPTIMIZED dengan useMemo
  const filteredPredictedPeople = useMemo(() => {
    if (!debouncedSearchQuery) return predictedPeople;
    const query = debouncedSearchQuery.toLowerCase();
    return predictedPeople.filter(person => 
      person.nik?.toLowerCase().includes(query) ||
      person.namaLengkap?.toLowerCase().includes(query) ||
      person.daerah?.toLowerCase().includes(query)
    );
  }, [predictedPeople, debouncedSearchQuery]);

  // Pagination calculations - OPTIMIZED dengan useMemo
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredPredictedPeople.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredPredictedPeople.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, currentPageData };
  }, [filteredPredictedPeople, itemsPerPage, currentPage]);

  const { totalPages, startIndex, endIndex, currentPageData } = paginationData;

  // Debug logging for mobile
  console.log('📱 Pagination Debug:', {
    predictedPeopleCount: predictedPeople.length,
    filteredCount: filteredPredictedPeople.length,
    currentPageDataCount: currentPageData.length,
    currentPage,
    totalPages,
    showPredictionResult
  });

  // Debug useEffect untuk mobile render state
  useEffect(() => {
    console.log('📱 Mobile Card View State:', {
      currentPageDataLength: currentPageData.length,
      predictedPeopleLength: predictedPeople.length,
      filteredPredictedPeopleLength: filteredPredictedPeople.length,
      showPredictionResult,
      currentPage,
      totalPages,
      hasData: currentPageData.length > 0
    });
  }, [currentPageData, showPredictionResult, currentPage]);

  // Monitor perubahan showPredictionResult
  useEffect(() => {
    console.log('🎭 showPredictionResult changed to:', showPredictionResult);
  }, [showPredictionResult]);

  // Filter age group people by search query - OPTIMIZED dengan useMemo
  const filteredAgeGroupPeople = useMemo(() => {
    if (!debouncedAgeGroupSearchQuery) return ageGroupPeople;
    const query = debouncedAgeGroupSearchQuery.toLowerCase();
    return ageGroupPeople.filter(person =>
      person.nik?.toLowerCase().includes(query) ||
      person.namaLengkap?.toLowerCase().includes(query) ||
      person.daerah?.toLowerCase().includes(query)
    );
  }, [ageGroupPeople, debouncedAgeGroupSearchQuery]);

  // Pagination calculations for age group - OPTIMIZED dengan useMemo
  const ageGroupPaginationData = useMemo(() => {
    const ageGroupTotalPages = Math.ceil(filteredAgeGroupPeople.length / ageGroupItemsPerPage);
    const ageGroupStartIndex = (ageGroupCurrentPage - 1) * ageGroupItemsPerPage;
    const ageGroupEndIndex = ageGroupStartIndex + ageGroupItemsPerPage;
    const ageGroupCurrentPageData = filteredAgeGroupPeople.slice(ageGroupStartIndex, ageGroupEndIndex);
    
    return { ageGroupTotalPages, ageGroupStartIndex, ageGroupEndIndex, ageGroupCurrentPageData };
  }, [filteredAgeGroupPeople, ageGroupItemsPerPage, ageGroupCurrentPage]);

  const { ageGroupTotalPages, ageGroupStartIndex, ageGroupEndIndex, ageGroupCurrentPageData } = ageGroupPaginationData;

  // Generate page numbers to show - OPTIMIZED dengan useMemo
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
  }, [totalPages, currentPage]);

  // OPTIMIZED dengan useCallback
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top of table
    const tableElement = document.getElementById('people-data-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // OPTIMIZED dengan useCallback
  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Count up animation for prediction result
  const predictionCount = predictAgeCount();
  const { count: animatedCount } = useCountUp({
    end: predictionCount,
    duration: 1500,
    enableScrollSpy: false,
    preserveValue: false,
  });

  // Access Denied Screen
  if (accessDenied) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
          <HeaderCard title="Analisis Data" backUrl="/masyarakat/data-desa" showBackButton={true} />
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Akses Ditolak</h2>
              <p className="text-gray-600 mb-2 font-medium">Halaman ini hanya dapat diakses oleh <span className="font-bold text-red-600">Kepala Desa</span>.</p>
              <p className="text-gray-500 text-sm mb-6">Anda akan dialihkan kembali ke halaman data desa...</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Loading Screen
  if (loading || !isAuthorized) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
          <HeaderCard title="Analisis Data" backUrl="/masyarakat/data-desa" showBackButton={true} />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent mx-auto absolute top-0 left-1/2 -translate-x-1/2"></div>
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

      <div className="relative mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Analisis Data" backUrl="/masyarakat/data-desa" showBackButton={true} />

        {/* Summary Card - SaaS Style */}
        <div className="mb-4 sm:mb-6 relative group animate-scaleIn">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-2xl sm:rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative glass-effect rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-white/40">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 shadow-2xl mb-4 sm:mb-5 animate-float">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="mb-2">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200/50">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 animate-pulse"></span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Total Penduduk</span>
                </div>
              </div>
              <div className="relative">
                <div className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-2 leading-none">
                  {filteredData.length.toLocaleString()}
                </div>
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-semibold">Jiwa</div>
              
              {activeFiltersCount > 0 && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200/50 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                      </svg>
                      {activeFiltersCount} Filter
                    </div>
                    <div className="text-gray-400 font-medium text-xs sm:text-sm">dari</div>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm">
                      {allData.length.toLocaleString()} Total
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Panel Toggle - SaaS Style */}
        <div className="mb-4 sm:mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleToggleFilter}
            className="w-full group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 glass-effect rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 group-hover:border-blue-300/50">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="font-bold text-gray-800 block text-sm sm:text-base md:text-lg">Filter & Analisis</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">Saring data berdasarkan kategori</span>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="ml-2 sm:ml-3 animate-scaleIn">
                    <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs sm:text-sm rounded-full font-bold shadow-lg flex items-center gap-1 sm:gap-1.5">
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
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Filter Panel - SaaS Style with smooth animation */}
        {showFilterPanel && (
          <div className={`mb-4 sm:mb-6 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-blue-100/50 overflow-hidden ${isClosing ? 'animate-slideUp' : 'animate-slideDown'}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-7 animate-fadeIn">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 shadow-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-sm sm:text-base md:text-lg">Filter Data</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">Terapkan filter sesuai kebutuhan</p>
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="group/btn px-5 py-3 md:py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 animate-scaleIn flex items-center gap-2 touch-manipulation"
                    style={{ minHeight: '44px' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>

              {/* Auto-Refresh Indicator */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50 animate-fadeIn">
                <div className="flex items-center gap-2">
                  {isRefreshing ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-blue-700">Memperbarui data...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600">Auto-refresh aktif</span>
                    </>
                  )}
                </div>
                {lastRefresh && (
                  <span className="text-xs text-gray-500">
                    Update: {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Filter Desa */}
                <div className="group animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    DESA
                  </label>
                  <select
                    value={filters.desa}
                    onChange={(e) => setFilters({ ...filters, desa: e.target.value })}
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl text-sm font-bold text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-400 shadow-sm cursor-pointer"
                  >
                    <option value="dauh-puri-kaja">Dauh Puri Kaja</option>
                  </select>
                </div>

                {/* Daerah */}
                <div className="group animate-fadeIn" style={{ animationDelay: '0.05s' }}>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    DAERAH
                  </label>
                  <select
                    value={filters.daerah}
                    onChange={(e) => setFilters({ ...filters, daerah: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm appearance-none cursor-pointer"
                    style={{ color: filters.daerah ? '#1f2937' : '#9ca3af' }}
                  >
                    <option value="" className="text-gray-400">Semua Daerah</option>
                    {filterOptions.daerah.map((option: string) => (
                      <option key={option} value={option} className="text-gray-700">{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jenis Kelamin */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  JENIS KELAMIN
                </label>
                <select
                  value={filters.jenisKelamin}
                  onChange={(e) => setFilters({ ...filters, jenisKelamin: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-green-300 shadow-sm cursor-pointer"
                  style={{ color: filters.jenisKelamin ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Semua Jenis Kelamin</option>
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
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 shadow-sm cursor-pointer"
                  style={{ color: filters.agama ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Semua Agama</option>
                  {filterOptions.agama.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pendidikan */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  PENDIDIKAN
                </label>
                <select
                  value={filters.pendidikanTerakhir}
                  onChange={(e) => setFilters({ ...filters, pendidikanTerakhir: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all hover:border-yellow-300 shadow-sm cursor-pointer"
                  style={{ color: filters.pendidikanTerakhir ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Semua Pendidikan</option>
                  {filterOptions.pendidikanTerakhir.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>

              {/* Pekerjaan */}
              <div className="group animate-fadeIn" style={{ animationDelay: '0.25s' }}>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  PEKERJAAN
                </label>
                <select
                  value={filters.pekerjaan}
                  onChange={(e) => setFilters({ ...filters, pekerjaan: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm cursor-pointer"
                  style={{ color: filters.pekerjaan ? '#1f2937' : '#9ca3af' }}
                >
                  <option value="" className="text-gray-400">Semua Pekerjaan</option>
                  {filterOptions.pekerjaan.map((option: string) => (
                    <option key={option} value={option} className="text-gray-700">{option}</option>
                  ))}
                </select>
              </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Prediksi Usia Penduduk - Enhanced */}
        <div className="mb-6 bg-gradient-to-br from-white via-red-50/40 to-rose-50/30 rounded-3xl p-6 shadow-2xl border border-red-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-600 shadow-lg">
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
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  PILIH TANGGAL
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-4 md:py-3 bg-gradient-to-r from-white to-red-50 border-2 border-red-200 rounded-xl text-sm md:text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm touch-manipulation"
                  style={{ colorScheme: 'light', minHeight: '48px' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-4 py-4 md:py-3 bg-gradient-to-r from-white to-rose-50 border-2 border-rose-200 rounded-xl text-sm md:text-base font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all hover:border-rose-300 shadow-sm touch-manipulation"
                  style={{ minHeight: '48px' }}
                />
              </div>
            </div>

            {/* Buttons - Show when any field is filled */}
            {(targetAge || selectedDate) && (
              <div className="flex gap-3 animate-fadeIn">
                <button
                  onClick={() => {
                    console.log('🔘 Konfirmasi button clicked (mobile/desktop)');
                    handleConfirmPrediction();
                  }}
                  disabled={!targetAge || !selectedDate}
                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 active:scale-95 text-white font-bold py-4 md:py-3.5 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Konfirmasi
                </button>
                <button
                  onClick={handleResetPrediction}
                  className="px-6 py-4 md:py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:scale-95 text-gray-700 font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            )}

            {showPredictionResult && targetAge && selectedDate && (
              <div className="mt-5 space-y-4">
                {/* Card Hasil Prediksi */}
                <div className="p-6 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl shadow-2xl border border-white/20 animate-scaleIn">
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

                {/* Data Penduduk yang Match - Professional UI */}
                {predictedPeople.length > 0 && (
                  <div id="people-data-table" className="p-6 bg-white rounded-2xl shadow-xl border border-red-200 animate-fadeIn">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b-2 border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">Data Penduduk</h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredPredictedPeople.length)} dari {filteredPredictedPeople.length} orang
                            {searchQuery && ` (difilter dari ${predictedPeople.length} total)`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Search & Items Per Page Controls - Mobile Optimized */}
                    <div className="flex flex-col gap-3 mb-5">
                      {/* Search Box */}
                      <div className="w-full">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                            placeholder="Cari NIK, Nama, Daerah..."
                            className="w-full pl-10 sm:pl-11 pr-10 py-3.5 sm:py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm touch-manipulation"
                            style={{ minHeight: '48px' }}
                          />
                          {searchQuery && (
                            <button
                              onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                              }}
                              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items Per Page Selector */}
                      <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <label className="text-xs sm:text-sm font-semibold text-gray-700">Data per halaman:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm cursor-pointer touch-manipulation"
                          style={{ minHeight: '44px' }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    {/* Mobile Card View - Visible on Mobile Only */}
                    <div className="md:hidden space-y-3 mb-5">
                      {currentPageData.length > 0 ? (
                        currentPageData.map((person, index) => {
                          const currentAge = calculateAge(person.tanggalLahir || '');
                          const ageAtDate = calculateAge(person.tanggalLahir || '', selectedDate);
                          const globalIndex = startIndex + index + 1;
                          
                          return (
                            <div key={person.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-md hover:shadow-lg transition-all">
                              {/* Header with Number and Gender */}
                              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white font-bold text-sm">
                                    {globalIndex}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 text-base leading-tight">{person.namaLengkap}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{person.nik}</div>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  person.jenisKelamin === 'Laki-laki' 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                    : 'bg-pink-100 text-pink-800 border-pink-200'
                                }`}>
                                  {person.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                                </span>
                              </div>

                              {/* Data Grid */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">Tanggal Lahir</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {person.tanggalLahir ? new Date(person.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">Usia Saat Ini</span>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    {currentAge} tahun
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">Usia di {new Date(selectedDate).getFullYear()}</span>
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    {ageAtDate} tahun
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-600">Daerah</span>
                                  <span className="text-sm font-medium text-gray-900">{person.daerah || '-'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-gray-500 font-semibold">Tidak ada data yang ditemukan</p>
                          <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian</p>
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View - Hidden on Mobile */}
                    <div className="hidden md:block overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500">
                            <tr>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">NIK</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nama Lengkap</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal Lahir</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Usia Saat Ini</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Usia di {new Date(selectedDate).getFullYear()}</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Daerah</th>
                              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Jenis Kelamin</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {currentPageData.length > 0 ? (
                              currentPageData.map((person, index) => {
                                const currentAge = calculateAge(person.tanggalLahir || '');
                                const ageAtDate = calculateAge(person.tanggalLahir || '', selectedDate);
                                const globalIndex = startIndex + index + 1;
                                
                                return (
                                  <tr key={person.id} className="hover:bg-red-50 transition-colors duration-150">
                                    <td className="px-4 py-4 text-sm text-gray-900 font-bold">
                                      {globalIndex}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900 font-mono font-semibold">
                                      {person.nik}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                                      {person.namaLengkap}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700">
                                      {person.tanggalLahir ? new Date(person.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                        {currentAge} tahun
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                        {ageAtDate} tahun
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                                      {person.daerah || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                        person.jenisKelamin === 'Laki-laki' 
                                          ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                          : 'bg-pink-100 text-pink-800 border-pink-200'
                                      }`}>
                                        {person.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={8} className="px-4 py-12 text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <p className="text-gray-500 font-semibold text-lg">Tidak ada data yang ditemukan</p>
                                    <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Professional Pagination - Mobile Optimized */}
                    {filteredPredictedPeople.length > 0 && (
                      <div className="mt-6 flex flex-col items-center gap-4 pt-5 border-t-2 border-gray-100">
                        {/* Pagination Info */}
                        <div className="text-xs sm:text-sm text-gray-600 font-medium text-center">
                          Menampilkan <span className="font-bold text-red-600">{startIndex + 1}</span> - 
                          <span className="font-bold text-red-600">{Math.min(endIndex, filteredPredictedPeople.length)}</span> dari{' '}
                          <span className="font-bold text-red-600">{filteredPredictedPeople.length}</span> data
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Previous Button */}
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`p-2.5 sm:p-3 rounded-lg font-bold transition-all touch-manipulation ${
                                currentPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg active:scale-95'
                              }`}
                              style={{ minWidth: '44px', minHeight: '44px' }}
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>

                            {/* Page Numbers - Responsive */}
                            <div className="flex items-center gap-1">
                              {pageNumbers.map((page, index) => (
                                page === '...' ? (
                                  <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-2 text-gray-400 font-bold text-sm">
                                    ...
                                  </span>
                                ) : (
                                  <button
                                    key={page}
                                    onClick={() => handlePageChange(page as number)}
                                    className={`min-w-[44px] px-3 sm:px-4 py-2.5 rounded-lg font-bold transition-all touch-manipulation text-sm sm:text-base ${
                                      currentPage === page
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105 sm:scale-110'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 active:scale-95'
                                    }`}
                                    style={{ minHeight: '44px' }}
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
                              className={`p-2.5 sm:p-3 rounded-lg font-bold transition-all touch-manipulation ${
                                currentPage === totalPages
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg active:scale-95'
                              }`}
                              style={{ minWidth: '44px', minHeight: '44px' }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {predictedPeople.length === 0 && (
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-semibold">Tidak ada penduduk yang berusia {targetAge} tahun pada tanggal tersebut</p>
                    <p className="text-gray-500 text-sm mt-1">Coba ubah filter atau tanggal prediksi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Distribusi Kelompok Usia - Ultra Modern & Professional */}
        <div className="mb-4 sm:mb-6 relative">
          {/* Glassmorphism Background Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/40 via-rose-50/30 to-pink-100/40 rounded-3xl sm:rounded-[2rem] blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_8px_32px_rgba(99,102,241,0.12)] border border-white/60 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-200/20 to-rose-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            {/* Header Section */}
            <div className="relative flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative group/icon">
                  {/* Animated Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl blur-xl opacity-50 group-hover/icon:opacity-75 transition-opacity animate-pulse"></div>
                  <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-rose-600 shadow-2xl transform group-hover/icon:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base sm:text-lg md:text-xl tracking-tight">
                    Distribusi Kelompok Usia
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                    Klik untuk melihat detail data penduduk
                  </p>
                </div>
              </div>
              
              {/* Total Count Badge - Mobile Responsive */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl sm:rounded-2xl border-2 border-red-100/50 shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-xs sm:text-sm font-bold text-red-700">
                  {filteredData.length} Total
                </span>
              </div>
            </div>
            
            {/* Age Groups List */}
            <div className="relative space-y-4 sm:space-y-5">
              {ageGroups.map((group, index) => {
                // Enhanced gradient colors dengan shadow
                const gradients = [
                  { bg: 'from-red-500 to-rose-600', glow: 'from-red-500/50 to-rose-600/50', light: 'from-red-50 to-rose-50' },
                  { bg: 'from-orange-500 to-amber-600', glow: 'from-orange-500/50 to-amber-600/50', light: 'from-orange-50 to-amber-50' },
                  { bg: 'from-amber-500 to-yellow-600', glow: 'from-amber-500/50 to-yellow-600/50', light: 'from-amber-50 to-yellow-50' },
                  { bg: 'from-yellow-500 to-amber-500', glow: 'from-yellow-500/50 to-amber-500/50', light: 'from-yellow-50 to-amber-50' },
                  { bg: 'from-lime-500 to-green-600', glow: 'from-lime-500/50 to-green-600/50', light: 'from-lime-50 to-green-50' },
                  { bg: 'from-green-500 to-emerald-600', glow: 'from-green-500/50 to-emerald-600/50', light: 'from-green-50 to-emerald-50' },
                  { bg: 'from-emerald-500 to-teal-600', glow: 'from-emerald-500/50 to-teal-600/50', light: 'from-emerald-50 to-teal-50' },
                  { bg: 'from-teal-500 to-cyan-600', glow: 'from-teal-500/50 to-cyan-600/50', light: 'from-teal-50 to-cyan-50' },
                  { bg: 'from-cyan-500 to-rose-600', glow: 'from-cyan-500/50 to-rose-600/50', light: 'from-cyan-50 to-rose-50' }
                ];
                
                const colorScheme = gradients[index];
                
                // Parse age range dari label
                const parseAgeRange = (label: string): { min: number, max: number | null } => {
                  if (label.includes('>')) {
                    const age = parseInt(label.match(/>(\d+)/)?.[1] || '65');
                    return { min: age, max: null };
                  }
                  const match = label.match(/(\d+)-(\d+)/);
                  return { 
                    min: parseInt(match?.[1] || '0'), 
                    max: parseInt(match?.[2] || '0') 
                  };
                };
                
                const { min, max } = parseAgeRange(group.label);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAgeGroupClick(group.label, min, max)}
                    disabled={group.count === 0}
                    className={`w-full group/item relative transition-all duration-500 ease-out touch-manipulation ${
                      group.count === 0 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Card Container with Neumorphism */}
                    <div className="relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-4 sm:p-5 border-2 border-gray-100/80 shadow-lg group-hover/item:shadow-2xl group-hover/item:border-red-200/60 transition-all duration-500">
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.05),rgba(255,255,255,0))] rounded-2xl pointer-events-none"></div>
                      
                      {/* Hover Glow Effect */}
                      {group.count > 0 && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${colorScheme.glow} rounded-2xl opacity-0 group-hover/item:opacity-20 blur-xl transition-opacity duration-500`}></div>
                      )}
                      
                      {/* Content */}
                      <div className="relative">
                        {/* Top Row: Label, Count, Percentage */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            {/* Color Indicator Dot with Pulse */}
                            <div className="relative">
                              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br ${colorScheme.bg} shadow-lg`}></div>
                              {group.count > 0 && (
                                <div className={`absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br ${colorScheme.bg} animate-ping opacity-75`}></div>
                              )}
                            </div>
                            
                            {/* Age Label */}
                            <span className="text-sm sm:text-base font-bold text-gray-800 group-hover/item:text-red-700 transition-colors duration-300">
                              {group.label}
                            </span>
                            
                            {/* Count Badge - Glassmorphism */}
                            <div className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl backdrop-blur-sm border shadow-sm transition-all duration-300 ${
                              group.count > 0 
                                ? `bg-gradient-to-r ${colorScheme.light} border-white/60 group-hover/item:shadow-md group-hover/item:scale-105` 
                                : 'bg-gray-100 border-gray-200'
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${group.count > 0 ? 'text-gray-700' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span className={`text-xs sm:text-sm font-extrabold tabular-nums ${
                                  group.count > 0 ? 'text-gray-800' : 'text-gray-500'
                                }`}>
                                  {group.count.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Percentage & Arrow */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-base sm:text-lg font-black tabular-nums bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                              {group.percentage.toFixed(1)}%
                            </span>
                            {group.count > 0 && (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300 shadow-sm">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 group-hover/item:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar - 3D Effect */}
                        <div className="relative">
                          {/* Outer Container - Shadow & Border */}
                          <div className="relative w-full h-5 sm:h-6 rounded-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200/80 overflow-hidden group-hover/item:shadow-[inset_0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-500">
                            {/* Shimmer Effect Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000"></div>
                            
                            {/* Progress Fill */}
                            <div className="relative h-full flex items-center">
                              <div
                                className={`relative h-full rounded-full bg-gradient-to-r ${colorScheme.bg} shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-1000 ease-out group-hover/item:shadow-[0_2px_12px_rgba(0,0,0,0.25)]`}
                                style={{ 
                                  width: `${group.percentage}%`,
                                  minWidth: group.count > 0 ? '8%' : '0%'
                                }}
                              >
                                {/* Inner Highlight */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full"></div>
                                
                                {/* Animated Dots Pattern */}
                                <div className="absolute inset-0 bg-[length:20px_20px] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] rounded-full opacity-60"></div>
                                
                                {/* End Cap Glow */}
                                {group.count > 0 && (
                                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 sm:h-5 bg-white/50 rounded-full blur-sm`}></div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Percentage Label Inside Bar (for larger percentages) */}
                          {group.percentage >= 15 && (
                            <div className="absolute inset-0 flex items-center px-3">
                              <span className="text-[10px] sm:text-xs font-black text-white drop-shadow-lg" style={{ width: `${group.percentage}%` }}>
                                <span className="float-right mr-2">{group.percentage.toFixed(1)}%</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Footer Info */}
            <div className="relative mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-gray-100">
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  Klik pada kelompok usia untuk melihat detail lengkap
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Data Kelompok Usia */}
        {showAgeGroupDetail && selectedAgeGroup && (
          <div id="age-group-detail-section" className="mb-4 sm:mb-6 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-red-200 animate-fadeIn">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Data Penduduk: {selectedAgeGroup}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Total {filteredAgeGroupPeople.length} orang
                    {ageGroupSearchQuery && ` (difilter dari ${ageGroupPeople.length} total)`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAgeGroupDetail}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search & Items Per Page Controls */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={ageGroupSearchQuery}
                    onChange={(e) => {
                      setAgeGroupSearchQuery(e.target.value);
                      setAgeGroupCurrentPage(1);
                    }}
                    placeholder="Cari NIK, Nama, Daerah..."
                    className="w-full pl-10 sm:pl-11 pr-10 py-3.5 sm:py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm touch-manipulation"
                    style={{ minHeight: '48px' }}
                  />
                  {ageGroupSearchQuery && (
                    <button
                      onClick={() => {
                        setAgeGroupSearchQuery("");
                        setAgeGroupCurrentPage(1);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 touch-manipulation"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Data per halaman:</label>
                <select
                  value={ageGroupItemsPerPage}
                  onChange={(e) => {
                    setAgeGroupItemsPerPage(Number(e.target.value));
                    setAgeGroupCurrentPage(1);
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all hover:border-red-300 shadow-sm cursor-pointer touch-manipulation"
                  style={{ minHeight: '44px' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 mb-5">
              {ageGroupCurrentPageData.length > 0 ? (
                ageGroupCurrentPageData.map((person, index) => {
                  const currentAge = calculateAge(person.tanggalLahir || '');
                  const globalIndex = ageGroupStartIndex + index + 1;
                  
                  return (
                    <div key={person.id} className="bg-gradient-to-br from-white to-red-50/30 rounded-xl p-4 border-2 border-red-100 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {globalIndex}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-gray-900 text-sm truncate">{person.namaLengkap}</h5>
                          <p className="text-xs text-gray-600 font-mono">{person.nik}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          person.jenisKelamin === 'Laki-laki' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-pink-100 text-pink-800 border-pink-200'
                        }`}>
                          {person.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Tanggal Lahir</span>
                          <span className="text-sm font-medium text-gray-900">
                            {person.tanggalLahir ? new Date(person.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Usia Saat Ini</span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {currentAge} tahun
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Agama</span>
                          <span className="text-sm font-medium text-gray-900">{person.agama || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Pekerjaan</span>
                          <span className="text-sm font-medium text-gray-900">{person.pekerjaan || '-'}</span>
                        </div>
                        {person.desil && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Desil</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200">
                              Desil {person.desil}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">Daerah</span>
                          <span className="text-sm font-medium text-gray-900">{person.daerah || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 font-semibold">Tidak ada data yang ditemukan</p>
                  <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-xl border-2 border-gray-200 shadow-lg mb-5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-600 via-red-500 to-rose-500">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">NIK</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nama Lengkap</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal Lahir</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Usia Saat Ini</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Jenis Kelamin</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Agama</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Pekerjaan</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Desil</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Daerah</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ageGroupCurrentPageData.length > 0 ? (
                      ageGroupCurrentPageData.map((person, index) => {
                        const currentAge = calculateAge(person.tanggalLahir || '');
                        const globalIndex = ageGroupStartIndex + index + 1;
                        
                        return (
                          <tr key={person.id} className="hover:bg-red-50 transition-colors duration-150">
                            <td className="px-4 py-4 text-sm text-gray-900 font-bold">{globalIndex}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 font-mono font-semibold">{person.nik}</td>
                            <td className="px-4 py-4 text-sm text-gray-900 font-semibold">{person.namaLengkap}</td>
                            <td className="px-4 py-4 text-sm text-gray-700">
                              {person.tanggalLahir ? new Date(person.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {currentAge} tahun
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                person.jenisKelamin === 'Laki-laki' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                  : 'bg-pink-100 text-pink-800 border-pink-200'
                              }`}>
                                {person.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 font-medium">{person.agama || '-'}</td>
                            <td className="px-4 py-4 text-sm text-gray-700 font-medium">{person.pekerjaan || '-'}</td>
                            <td className="px-4 py-4 text-sm">
                              {person.desil ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200">
                                  Desil {person.desil}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 font-medium">{person.daerah || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-gray-500 font-semibold text-lg">Tidak ada data yang ditemukan</p>
                            <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian Anda</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredAgeGroupPeople.length > 0 && (
              <div className="mt-6 flex flex-col items-center gap-4 pt-5 border-t-2 border-gray-100">
                <div className="text-xs sm:text-sm text-gray-600 font-medium text-center">
                  Menampilkan <span className="font-bold text-red-600">{ageGroupStartIndex + 1}</span> - 
                  <span className="font-bold text-red-600">{Math.min(ageGroupEndIndex, filteredAgeGroupPeople.length)}</span> dari{' '}
                  <span className="font-bold text-red-600">{filteredAgeGroupPeople.length}</span> data
                </div>

                {ageGroupTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (ageGroupCurrentPage > 1) {
                          setAgeGroupCurrentPage(ageGroupCurrentPage - 1);
                          document.getElementById('age-group-detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      disabled={ageGroupCurrentPage === 1}
                      className={`p-2.5 sm:p-3 rounded-lg font-bold transition-all touch-manipulation ${
                        ageGroupCurrentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg active:scale-95'
                      }`}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1 sm:gap-2">
                      {Array.from({ length: Math.min(5, ageGroupTotalPages) }, (_, i) => {
                        let pageNum;
                        if (ageGroupTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (ageGroupCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (ageGroupCurrentPage >= ageGroupTotalPages - 2) {
                          pageNum = ageGroupTotalPages - 4 + i;
                        } else {
                          pageNum = ageGroupCurrentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setAgeGroupCurrentPage(pageNum);
                              document.getElementById('age-group-detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-bold transition-all touch-manipulation ${
                              ageGroupCurrentPage === pageNum
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg scale-110'
                                : 'bg-white text-gray-700 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300'
                            }`}
                            style={{ minWidth: '44px', minHeight: '44px' }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        if (ageGroupCurrentPage < ageGroupTotalPages) {
                          setAgeGroupCurrentPage(ageGroupCurrentPage + 1);
                          document.getElementById('age-group-detail-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      disabled={ageGroupCurrentPage === ageGroupTotalPages}
                      className={`p-2.5 sm:p-3 rounded-lg font-bold transition-all touch-manipulation ${
                        ageGroupCurrentPage === ageGroupTotalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg active:scale-95'
                      }`}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
