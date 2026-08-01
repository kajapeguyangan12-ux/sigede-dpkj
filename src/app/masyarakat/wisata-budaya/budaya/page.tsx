"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';
import { getAllBudaya, BudayaItem } from '../../../../lib/wisataBudayaService';

type FilterType = "All" | "Tari" | "Upacara" | "Kerajinan" | "Musik" | "Tradisi";

export default function BudayaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [budayaList, setBudayaList] = useState<BudayaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudaya();
  }, []);

  const fetchBudaya = async () => {
    try {
      setLoading(true);
      const data = await getAllBudaya();
      setBudayaList(data);
    } catch (error) {
      console.error('Error fetching budaya:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = budayaList.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || item.kategori === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-900">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <HeaderCard 
          title="Budaya"
          subtitle="Warisan Tradisional"
          backUrl="/masyarakat/wisata-budaya"
          showBackButton={true}
        />

        {/* Search Bar */}
        <div className="mb-4 sm:mb-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base border border-red-100 bg-white/95 shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-5 sm:mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["All", "Seni", "Upacara", "Sejarah", "Kerajinan"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-white/80 text-gray-700 ring-1 ring-red-200 hover:bg-white hover:shadow-md"
              }`}
            >
              {filter}
            </button>
          ))}
          <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/80 text-gray-700 ring-1 ring-red-200 hover:bg-white hover:shadow-md">
            <FilterIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Culture Listings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm sm:text-base">Memuat data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="rounded-2xl sm:rounded-3xl bg-white/90 p-6 sm:p-8 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
                <SearchIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                <div className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Tidak ada hasil ditemukan</div>
                <div className="text-xs sm:text-sm text-gray-600">Coba ubah kata kunci pencarian atau filter</div>
              </div>
            </div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} className="group">
                <div className="rounded-2xl sm:rounded-3xl bg-white/95 shadow-lg ring-1 ring-red-100 overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                    {item.fotoUrl ? (
                      <img src={item.fotoUrl} alt={item.judul} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-red-600">
                        <CultureIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-2 opacity-50" />
                        <div className="text-xs sm:text-sm font-medium">Foto</div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <div className="mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">{item.judul}</h3>
                      <div className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        {item.kategori}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3 flex-1">{item.deskripsi}</p>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-red-500 text-white py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium hover:bg-red-600 transition">
                        Pelajari
                      </button>
                      <Link href={`/masyarakat/wisata-budaya/budaya/detail/${item.id}`} className="bg-gray-100 text-gray-700 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-200 transition">
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}

type IconProps = {
  className?: string;
};

function HomeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 11v9h14v-9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function HistoryIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v6h6" />
      <path d="M21 12a9 9 0 1 0-3.27 6.92" />
      <path d="M12 7v5l3 1.5" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c2-4 6-6 8-6s6 2 8 6" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function FilterIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}



function CultureIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 5 9h14z" />
      <path d="M6 9v9h12V9" />
      <path d="M9 18v3h6v-3" />
    </svg>
  );
}

function LocationIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MapIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
