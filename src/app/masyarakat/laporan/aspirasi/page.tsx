"use client";

import { useState, useEffect } from "react";
import BottomNavigation from '../../../components/BottomNavigation';
import HeaderCard from "../../../components/HeaderCard";
import Link from "next/link";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../contexts/AuthContext";

interface AspirasiData {
  id: string;
  judulAspirasi: string;
  isiAspirasi: string;
  kategoriAspirasi: string;
  tanggalAspirasi: Timestamp;
  userId: string;
  status: "menunggu" | "ditinjau" | "diterima" | "ditolak";
  catatanAdmin?: string;
}

type FilterType = "All" | "Pembangunan" | "Pendidikan" | "Kesehatan" | "Ekonomi" | "Sosial" | "Lainnya";
type SortType = "Terbaru" | "Terlama" | "Status";

const getStatusColor = (status: string) => {
  switch (status) {
    case "menunggu": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "ditinjau": return "bg-blue-100 text-blue-700 border-blue-200";
    case "diterima": return "bg-green-100 text-green-700 border-green-200";
    case "ditolak": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "menunggu": return "⏳";
    case "ditinjau": return "👀";
    case "diterima": return "✅";
    case "ditolak": return "❌";
    default: return "💡";
  }
};

export default function LaporanAspirasiPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [activeSort, setActiveSort] = useState<SortType>("Terbaru");
  const [aspirasiData, setAspirasiData] = useState<AspirasiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAspirasiData();
    }
  }, [authLoading, user]);

  const fetchAspirasiData = async () => {
    if (authLoading || !user) {
      return;
    }
    
    setLoading(true);
    try {
      const userId = user.uid;
      if (!userId) {
        console.log('No user ID found');
        setAspirasiData([]);
        setLoading(false);
        return;
      }

      const aspirasiRef = collection(db, 'aspirasi-masyarakat');
      const q = query(
        aspirasiRef,
        where('userId', '==', userId),
        orderBy('tanggalAspirasi', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AspirasiData[];
      
      setAspirasiData(data);
    } catch (error) {
      console.error('Error fetching aspirasi:', error);
      setAspirasiData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = aspirasiData.filter(item => {
    const matchesSearch = item.judulAspirasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.isiAspirasi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || item.kategoriAspirasi === activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (activeSort) {
      case "Terbaru": 
        const aTime = a.tanggalAspirasi?.seconds || 0;
        const bTime = b.tanggalAspirasi?.seconds || 0;
        return bTime - aTime;
      case "Terlama": 
        const aTimeOld = a.tanggalAspirasi?.seconds || 0;
        const bTimeOld = b.tanggalAspirasi?.seconds || 0;
        return aTimeOld - bTimeOld;
      case "Status": return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-gray-900">
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {/* Header Card */}
        <HeaderCard 
          title="Aspirasi"
          subtitle="Sampaikan Ide & Saran Anda"
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
              className="block w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1">
            <select
              className="w-full px-4 py-3 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium text-gray-700 transition-all"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
            >
              <option value="All">Kategori</option>
              <option value="Pembangunan">Pembangunan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Ekonomi">Ekonomi</option>
              <option value="Sosial">Sosial</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="flex-1">
            <select
              className="w-full px-4 py-3 rounded-2xl border-0 bg-white/95 shadow-lg ring-1 ring-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium text-gray-700 transition-all"
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

        {/* Buat Aspirasi Button */}
        <Link href="/masyarakat/laporan/aspirasi/buat">
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-6">
            <div className="flex items-center justify-center gap-2">
              <LightbulbIcon className="h-5 w-5" />
              <span>Sampaikan Aspirasi Baru</span>
            </div>
          </button>
        </Link>

        {/* Latest Aspirasi Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
            Data Aspirasi Terbaru
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
              <div className="rounded-3xl bg-white/90 p-10 shadow-xl ring-1 ring-blue-200/50 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                  <LightbulbIcon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-lg font-bold text-gray-800 mb-2">Tidak ada aspirasi ditemukan</div>
                <div className="text-sm text-gray-600">Coba ubah kata kunci pencarian atau filter</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item) => (
                <Link key={item.id} href={`/masyarakat/laporan/aspirasi/${item.id}`}>
                  <div className="group cursor-pointer">
                    <div className="rounded-3xl bg-white/95 shadow-lg ring-1 ring-blue-100/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:ring-2 hover:ring-blue-400">
                      {/* Content Section */}
                      <div className="p-5">
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-bold text-gray-900 text-base leading-tight flex-1 group-hover:text-blue-600 transition-colors">
                              {item.judulAspirasi}
                            </h4>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(item.status)} whitespace-nowrap`}>
                              <span>{getStatusIcon(item.status)}</span>
                              <span className="capitalize">{item.status}</span>
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                            <CategoryIcon className="h-3.5 w-3.5" />
                            <span>{item.kategoriAspirasi}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {item.isiAspirasi}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">
                            {item.tanggalAspirasi?.toDate ? item.tanggalAspirasi.toDate().toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) : 'N/A'}
                          </span>
                        </div>

                        {item.catatanAdmin && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                              <InfoIcon className="h-3.5 w-3.5" />
                              Catatan Admin
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{item.catatanAdmin}</p>
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                          <span className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
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

function LightbulbIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
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

function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
