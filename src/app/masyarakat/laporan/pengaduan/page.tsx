"use client";

import { useState, useEffect } from "react";
import BottomNavigation from '../../../components/BottomNavigation';
import HeaderCard from "../../../components/HeaderCard";
import { getLaporanByUser } from "../../../../lib/laporanService";
import type { LaporanMasyarakat } from "../../../../lib/laporanService";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";

type FilterType = "All" | "Infrastruktur" | "Keamanan" | "Lingkungan" | "Pelayanan" | "Lainnya";
type SortType = "Terbaru" | "Terlama" | "Status";

const getStatusColor = (status: string) => {
  switch (status) {
    case "menunggu": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "diproses": return "bg-blue-100 text-blue-700 border-blue-200";
    case "disetujui": return "bg-green-100 text-green-700 border-green-200";
    case "selesai": return "bg-green-100 text-green-700 border-green-200";
    case "ditolak": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "menunggu": return "⏳";
    case "diproses": return "⚙️";
    case "disetujui": return "✅";
    case "selesai": return "✅";
    case "ditolak": return "❌";
    default: return "📋";
  }
};

export default function LaporanPengaduanPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [activeSort, setActiveSort] = useState<SortType>("Terbaru");
  const [laporanData, setLaporanData] = useState<LaporanMasyarakat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchLaporanData();
    }
  }, [authLoading, user]);

  const fetchLaporanData = async () => {
    if (authLoading || !user) {
      return;
    }
    
    setLoading(true);
    try {
      const userId = user.uid;
      if (!userId) {
        console.log('No user ID found');
        setLaporanData([]);
        setLoading(false);
        return;
      }
      const data = await getLaporanByUser(userId);
      setLaporanData(data);
    } catch (error) {
      console.error('Error fetching laporan:', error);
      setLaporanData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = laporanData.filter(item => {
    const matchesSearch = item.judulLaporan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.isiLaporan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || item.kategoriLaporan === activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (activeSort) {
      case "Terbaru": 
        const aTime = a.tanggalLaporan?.seconds || 0;
        const bTime = b.tanggalLaporan?.seconds || 0;
        return bTime - aTime;
      case "Terlama": 
        const aTimeOld = a.tanggalLaporan?.seconds || 0;
        const bTimeOld = b.tanggalLaporan?.seconds || 0;
        return aTimeOld - bTimeOld;
      case "Status": return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-pink-50 to-red-50 text-gray-900">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        {/* Header Card */}
        <HeaderCard 
          title="Pengaduan"
          subtitle="Layanan Aspirasi Masyarakat"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1">
            <select
              className="w-full px-4 py-3 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-medium text-gray-700 transition-all"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
            >
              <option value="All">Kategori</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Lingkungan">Lingkungan</option>
              <option value="Pelayanan">Pelayanan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="flex-1">
            <select
              className="w-full px-4 py-3 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-medium text-gray-700 transition-all"
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as SortType)}
            >
              <option value="Terbaru">Urutkan</option>
              <option value="Terbaru">Terbaru</option>
              <option value="Terlama">Terlama</option>
              <option value="Status">Status</option>
            </select>
          </div>
        </div>

        {/* Buat Laporan Button */}
        <Link href="/masyarakat/laporan/pengaduan/buat">
          <button className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-6">
            <div className="flex items-center justify-center gap-2">
              <PlusIcon className="h-5 w-5" />
              <span>Buat Laporan Baru</span>
            </div>
          </button>
        </Link>

        {/* Latest Reports Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></span>
            Data Laporan Terbaru
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl bg-white/80 shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-3xl bg-white/90 p-10 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mb-4">
                  <SearchIcon className="h-8 w-8 text-red-400" />
                </div>
                <div className="text-lg font-bold text-gray-800 mb-2">Tidak ada laporan ditemukan</div>
                <div className="text-sm text-gray-600">Coba ubah kata kunci pencarian atau filter</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <Link key={item.id} href={`/masyarakat/laporan/pengaduan/${item.id}`}>
                  <div className="group cursor-pointer">
                    <div className="rounded-3xl bg-white/95 shadow-lg ring-1 ring-red-100/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:ring-2 hover:ring-red-400">
                      {/* Content Section */}
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-bold text-gray-900 text-base leading-tight flex-1 group-hover:text-red-600 transition-colors">
                              {item.judulLaporan}
                            </h4>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(item.status)} whitespace-nowrap`}>
                              <span>{getStatusIcon(item.status)}</span>
                              <span>{item.status}</span>
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold">
                            <CategoryIcon className="h-3.5 w-3.5" />
                            <span>{item.kategoriLaporan}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {item.isiLaporan}
                        </p>

                        <div className="space-y-2.5 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                              <CalendarIcon className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="font-medium">
                              {item.tanggalLaporan?.toDate ? item.tanggalLaporan.toDate().toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                              <LocationIcon className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="font-medium line-clamp-1">{item.alamat}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                          <span className="text-red-600 hover:text-red-700 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                            Lihat Detail
                            <ArrowRightIcon className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </div>
        </div>

        <BottomNavigation />
      </main>
  );
}

// Icons
type IconProps = { className?: string };

function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LocationIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CategoryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
