"use client";

import React, { useMemo, useState, useEffect } from "react";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import { BarChart3, TrendingUp, Loader2 } from "lucide-react";
import { subscribeToDetailedAPB, DetailedAPBData } from "../../../lib/keuanganService";

type FinanceCategory = "pendapatan" | "belanja" | "pembiayaan";
type DatasetKey = "anggaran" | "realisasi" | "lebihKurang";

type FinanceRow = {
  label: string;
  amount: number;
};

const getAvailableYears = (apbData: DetailedAPBData[]): number[] => {
  const years = [...new Set(apbData.map(item => item.tahun))].sort((a, b) => b - a);
  return years.length > 0 ? years : [new Date().getFullYear()];
};

const categoryLabels: Record<FinanceCategory, string> = {
  pendapatan: "Pendapatan",
  belanja: "Belanja",
  pembiayaan: "Pembiayaan",
};

const datasetLabels: Record<DatasetKey, string> = {
  anggaran: "Anggaran",
  realisasi: "Realisasi",
  lebihKurang: "Lebih/Kurang",
};

// Helper function to process APB data
const processAPBData = (apbData: DetailedAPBData[]) => {
  const financeData: Record<
    FinanceCategory,
    Record<number, { anggaran: FinanceRow[]; realisasi: FinanceRow[] }>
  > = {
    pendapatan: {},
    belanja: {},
    pembiayaan: {}
  };

  apbData.forEach(item => {
    const category = item.kategori.toLowerCase() as FinanceCategory;
    const year = item.tahun;
    
    if (!financeData[category][year]) {
      financeData[category][year] = { anggaran: [], realisasi: [] };
    }
    
    // Each DetailedAPBData is a single line item, so add it directly
    financeData[category][year].anggaran.push({
      label: item.subKategori,
      amount: item.anggaran
    });
    financeData[category][year].realisasi.push({
      label: item.subKategori,
      amount: item.realisasi
    });
  });

  return financeData;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function KeuanganMasyarakatPage() {
  const [activeCategory, setActiveCategory] = useState<FinanceCategory>("pendapatan");
  const [activeDataset, setActiveDataset] = useState<DatasetKey>("anggaran");
  const [apbData, setApbData] = useState<DetailedAPBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailData, setSelectedDetailData] = useState<FinanceRow[]>([]);
  const [detailModalTitle, setDetailModalTitle] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'original'>('original');
  const itemsPerPage = 3;

  // Load data from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDetailedAPB((data) => {
      setApbData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const yearOptions = useMemo(() => getAvailableYears(apbData), [apbData]);
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0] || new Date().getFullYear());
  
  // Update selectedYear when yearOptions change
  useEffect(() => {
    if (yearOptions.length > 0 && !yearOptions.includes(selectedYear)) {
      setSelectedYear(yearOptions[0]);
    }
  }, [yearOptions]);

  const financeData = useMemo(() => processAPBData(apbData), [apbData]);
  
  const sectionForYear = financeData[activeCategory]?.[selectedYear] ?? { anggaran: [], realisasi: [] };

  const differenceRows = useMemo<FinanceRow[]>(() => {
    const realisasiMap = new Map(
      sectionForYear.realisasi.map((row: FinanceRow) => [row.label, row.amount])
    );

    return sectionForYear.anggaran.map((row: FinanceRow) => ({
      label: row.label,
      amount: (realisasiMap.get(row.label) ?? 0) - row.amount,
    }));
  }, [sectionForYear]);

  const chartRows =
    activeDataset === "lebihKurang"
      ? differenceRows
      : activeDataset === "anggaran"
      ? sectionForYear.anggaran
      : sectionForYear.realisasi;

  const maxChartValue =
    chartRows.length > 0
      ? Math.max(...chartRows.map((row: FinanceRow) => Math.abs(row.amount)))
      : 1;

  const totalAnggaran = sectionForYear.anggaran.reduce(
    (sum: number, row: FinanceRow) => sum + row.amount,
    0
  );
  const totalRealisasi = sectionForYear.realisasi.reduce(
    (sum: number, row: FinanceRow) => sum + row.amount,
    0
  );
  const totalDifference = totalRealisasi - totalAnggaran;

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800">
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
          <HeaderCard 
            title="Keuangan" 
            subtitle="Informasi Keuangan Desa"
            backUrl="/masyarakat/home"
            showBackButton={true}
          />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Memuat data keuangan...</p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard 
          title="Keuangan" 
          subtitle="Informasi Keuangan Desa"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Analisis Keuangan Card */}
        <div className="mb-4 rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Analisis Keuangan</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Analisa Realisasi Keuangan</span>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 border border-gray-300">
              <BarChart3 className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Grafik Ringkasan Keuangan */}
        <div className="mb-4 rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Keuangan Tahun {selectedYear}</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(["pendapatan", "belanja", "pembiayaan"] as FinanceCategory[]).map((category) => {
              const categoryData = financeData[category]?.[selectedYear];
              const totalAnggaran = categoryData?.anggaran.reduce((sum, item) => sum + item.amount, 0) || 0;
              const totalRealisasi = categoryData?.realisasi.reduce((sum, item) => sum + item.amount, 0) || 0;
              const percentage = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
              
              return (
                <div 
                  key={category} 
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    activeCategory === category 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 mb-1">{categoryLabels[category]}</p>
                    <p className="text-sm font-bold text-gray-800">Rp {totalRealisasi.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}% realisasi</p>
                    
                    {/* Progress bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          category === 'pendapatan' ? 'bg-green-500' :
                          category === 'belanja' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Bar Chart Visual */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Perbandingan Anggaran vs Realisasi</h3>
            {(["pendapatan", "belanja", "pembiayaan"] as FinanceCategory[]).map((category) => {
              const categoryData = financeData[category]?.[selectedYear];
              const totalAnggaran = categoryData?.anggaran.reduce((sum, item) => sum + item.amount, 0) || 0;
              const totalRealisasi = categoryData?.realisasi.reduce((sum, item) => sum + item.amount, 0) || 0;
              const maxAmount = Math.max(totalAnggaran, totalRealisasi);
              const anggaranPercent = maxAmount > 0 ? (totalAnggaran / maxAmount) * 100 : 0;
              const realisasiPercent = maxAmount > 0 ? (totalRealisasi / maxAmount) * 100 : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{categoryLabels[category]}</span>
                    <span className="text-xs text-gray-500">
                      {totalRealisasi > 0 && `Rp ${totalRealisasi.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="relative">
                    {/* Anggaran bar (background) */}
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                      <div 
                        className="h-full bg-gray-400 rounded-full"
                        style={{ width: `${anggaranPercent}%` }}
                      ></div>
                    </div>
                    {/* Realisasi bar (foreground) */}
                    <div className="absolute top-0 w-full h-4 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          category === 'pendapatan' ? 'bg-green-500' :
                          category === 'belanja' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${realisasiPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Anggaran: Rp {totalAnggaran.toLocaleString('id-ID')}</span>
                    <span>Realisasi: Rp {totalRealisasi.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APBD Section */}
        <div className="mb-4 rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">APBD Desa Tahun {selectedYear}</h2>
              <p className="text-sm text-gray-600">{categoryLabels[activeCategory]}</p>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1">Filter Tahun:</label>
              <select
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-gray-400 focus:outline-none"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
              >
                {yearOptions.map((year: number) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(Object.keys(categoryLabels) as FinanceCategory[]).map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-red-300 bg-red-200 text-red-800 shadow"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              );
            })}
          </div>

          {/* Grafik Section */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
              Grafik {datasetLabels[activeDataset]} - {categoryLabels[activeCategory]}
            </h3>
            
            {chartRows.length > 0 ? (
              <div className="space-y-3">
                {chartRows.slice(0, 5).map((row: FinanceRow, index: number) => {
                  const percentage = maxChartValue > 0 ? Math.abs((row.amount / maxChartValue) * 100) : 0;
                  const isNegative = row.amount < 0;
                  
                  return (
                    <div key={`chart-${row.label}-${index}`} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 truncate max-w-[60%]">{row.label}</span>
                        <span className={`font-semibold ${isNegative ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatCurrency(row.amount)}
                        </span>
                      </div>
                      
                      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isNegative 
                              ? 'bg-red-500' 
                              : activeCategory === 'pendapatan' 
                                ? 'bg-green-500' 
                                : activeCategory === 'belanja' 
                                  ? 'bg-red-500' 
                                  : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
                
                {chartRows.length > 5 && (
                  <div className="text-center py-2 border-t border-gray-300">
                    <span className="text-xs text-gray-500">
                      Menampilkan 5 dari {chartRows.length} item terbesar
                    </span>
                  </div>
                )}
                
                {/* Summary Info */}
                <div className="mt-4 pt-3 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total {datasetLabels[activeDataset]}</p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatCurrency(chartRows.reduce((sum, item) => sum + item.amount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rata-rata</p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatCurrency(chartRows.reduce((sum, item) => sum + item.amount, 0) / chartRows.length || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Tidak ada data untuk ditampilkan</p>
                  <p className="text-xs text-gray-400">Pilih kategori dan dataset yang berbeda</p>
                </div>
              </div>
            )}
          </div>

          {/* Dataset Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(datasetLabels) as DatasetKey[]).map((dataset) => {
              const isActive = dataset === activeDataset;
              return (
                <button
                  key={dataset}
                  type="button"
                  onClick={() => setActiveDataset(dataset)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-red-300 bg-red-200 text-red-800 shadow"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {datasetLabels[dataset]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards Section */}
        <div className="space-y-4">
          {sectionForYear.anggaran.length === 0 && sectionForYear.realisasi.length === 0 ? (
            <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Belum Ada Data</h4>
                <p className="text-xs text-gray-500">
                  Data keuangan untuk kategori {categoryLabels[activeCategory]} tahun {selectedYear} belum tersedia.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Card Anggaran */}
              {sectionForYear.anggaran.length > 0 && (
                <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Data Anggaran</h4>
                        <p className="text-sm text-gray-600">{sectionForYear.anggaran.length} item</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDetailData(sectionForYear.anggaran);
                        setDetailModalTitle(`Detail Anggaran ${categoryLabels[activeCategory]} ${selectedYear}`);
                        setShowDetailModal(true);
                        setCurrentPage(1);
                        setSortOrder('original');
                      }}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Lihat Detail
                    </button>
                  </div>
                  
                  {/* Preview 3 items */}
                  <div className="space-y-2">
                    {sectionForYear.anggaran.slice(0, 3).map((row: FinanceRow, index: number) => (
                      <div key={`anggaran-${row.label}-${index}`} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{row.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.amount)}</span>
                      </div>
                    ))}
                    {sectionForYear.anggaran.length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500">
                          dan {sectionForYear.anggaran.length - 3} item lainnya
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Anggaran:</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(sectionForYear.anggaran.reduce((sum, item) => sum + item.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Realisasi */}
              {sectionForYear.realisasi.length > 0 && (
                <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">Data Realisasi</h4>
                        <p className="text-sm text-gray-600">{sectionForYear.realisasi.length} item</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDetailData(sectionForYear.realisasi);
                        setDetailModalTitle(`Detail Realisasi ${categoryLabels[activeCategory]} ${selectedYear}`);
                        setShowDetailModal(true);
                        setCurrentPage(1);
                        setSortOrder('original');
                      }}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Lihat Detail
                    </button>
                  </div>
                  
                  {/* Preview 3 items */}
                  <div className="space-y-2">
                    {sectionForYear.realisasi.slice(0, 3).map((row: FinanceRow, index: number) => (
                      <div key={`realisasi-${row.label}-${index}`} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{row.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.amount)}</span>
                      </div>
                    ))}
                    {sectionForYear.realisasi.length > 3 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500">
                          dan {sectionForYear.realisasi.length - 3} item lainnya
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Realisasi:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(sectionForYear.realisasi.reduce((sum, item) => sum + item.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Detail dengan Pagination */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{detailModalTitle}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-600">{selectedDetailData.length} total items</p>
                    
                    {/* Sort Controls */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Urutkan:</span>
                      <button
                        onClick={() => {
                          setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                          setCurrentPage(1);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        {sortOrder === 'original' ? 'Default' : sortOrder === 'asc' ? 'Terendah' : 'Tertinggi'}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors ml-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                // Sort data based on sortOrder
                const sortedData = [...selectedDetailData];
                if (sortOrder === 'asc') {
                  sortedData.sort((a, b) => a.amount - b.amount);
                } else if (sortOrder === 'desc') {
                  sortedData.sort((a, b) => b.amount - a.amount);
                }
                
                const totalPages = Math.ceil(sortedData.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    <div className="space-y-3">
                      {paginatedData.map((row: FinanceRow, index: number) => (
                        <div key={`detail-${row.label}-${startIndex + index}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">{row.label}</h4>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Item #{startIndex + index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(row.amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Prev
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Total ({selectedDetailData.length} items):
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(selectedDetailData.reduce((sum, item) => sum + item.amount, 0))}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Halaman {currentPage} dari {totalPages}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </main>
  );
}