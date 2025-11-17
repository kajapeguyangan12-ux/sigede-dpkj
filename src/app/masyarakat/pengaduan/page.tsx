"use client";

import { useState, useEffect, useMemo } from "react";
import BottomNavigation from '../../components/BottomNavigation';
import Image from "next/image";
import Link from "next/link";
import HeaderCard from "../../components/HeaderCard";
import { getLaporanByUser, subscribeToUserLaporan } from "../../../lib/laporanPengaduanService";
import type { LaporanPengaduan } from "../../../lib/laporanPengaduanService";
import { useAuth } from "../../../contexts/AuthContext";

const DesaLogo = "/logo/LOGO_DPKJ.png";
const BgdLogo = "/logo/Logo_BGD.png";

type FilterType = "All" | "Infrastruktur" | "Keamanan" | "Lingkungan" | "Pelayanan" | "Lainnya";
type SortType = "Terbaru" | "Terlama" | "Status" | "Prioritas";

type ComplaintItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  status: "Menunggu" | "Diproses" | "Selesai" | "Ditolak";
  description: string;
  image: string;
  priority: "Rendah" | "Sedang" | "Tinggi";
  location: string;
};



const getStatusColor = (status: string) => {
  switch (status) {
    case "menunggu": return "bg-yellow-100 text-yellow-700";
    case "approved_admin": return "bg-blue-100 text-blue-700";
    case "approved_kadus": return "bg-cyan-100 text-cyan-700";
    case "diproses": return "bg-purple-100 text-purple-700";
    case "disetujui": return "bg-green-100 text-green-700";
    case "selesai": return "bg-green-100 text-green-700";
    case "ditolak": return "bg-red-100 text-red-700";
    case "Menunggu": return "bg-yellow-100 text-yellow-700";
    case "Diproses": return "bg-blue-100 text-blue-700";
    case "Selesai": return "bg-green-100 text-green-700";
    case "Ditolak": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Rendah": return "bg-gray-100 text-gray-600";
    case "Sedang": return "bg-orange-100 text-orange-600";
    case "Tinggi": return "bg-red-100 text-red-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

export default function PengaduanPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [activeSort, setActiveSort] = useState<SortType>("Terbaru");
  const [laporanData, setLaporanData] = useState<LaporanPengaduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanPengaduan | null>(null);

  const complaintData = useMemo((): ComplaintItem[] => [
    {
      id: "1",
      title: "Jalan Berlubang di Gang Mawar",
      category: "Infrastruktur",
      date: "15 Nov 2025",
      status: "Diproses",
      description: "Jalan berlubang parah mengganggu akses kendaraan warga",
      image: "/api/placeholder/200/150",
      priority: "Tinggi",
      location: "Gang Mawar RT 02/RW 01"
    },
    {
      id: "2",
      title: "Lampu Jalan Mati",
      category: "Infrastruktur",
      date: "14 Nov 2025",
      status: "Menunggu",
      description: "Lampu jalan di depan rumah tidak menyala selama 3 hari",
      image: "/api/placeholder/200/150",
      priority: "Sedang",
      location: "Jl. Peguyangan Kaja No. 25"
    },
    {
      id: "3",
      title: "Sampah Menumpuk",
      category: "Lingkungan",
      date: "13 Nov 2025",
      status: "Selesai",
      description: "Tumpukan sampah di pinggir jalan belum diangkut",
      image: "/api/placeholder/200/150",
      priority: "Sedang",
      location: "Jl. Raya Peguyangan"
    },
    {
      id: "4",
      title: "Pelayanan Administrasi Lambat",
      category: "Pelayanan",
      date: "12 Nov 2025",
      status: "Ditolak",
      description: "Antrian pelayanan di kantor desa terlalu lama",
      image: "/api/placeholder/200/150",
      priority: "Rendah",
      location: "Kantor Desa Peguyangan"
    }
  ], []);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      // Setup real-time listener
      const unsubscribe = subscribeToUserLaporan(user.uid, (data) => {
        setLaporanData(data);
        setLoading(false);
      });

      // Cleanup listener on component unmount
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [authLoading, user]);

  const filteredData = laporanData.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.isi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || item.kategori === activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (activeSort) {
      case "Terbaru": 
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      case "Terlama": 
        const aTimeOld = a.createdAt?.seconds || 0;
        const bTimeOld = b.createdAt?.seconds || 0;
        return aTimeOld - bTimeOld;
      case "Status": return a.status.localeCompare(b.status);
      case "Prioritas": return 0; // Priority tidak ada di LaporanPengaduan
      default: return 0;
    }
  });

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-900">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
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
              className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-red-100 bg-white/95 shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex gap-2">
          <select
            className="flex-1 px-4 py-2 rounded-2xl border border-red-100 bg-white/95 shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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

          <select
            className="flex-1 px-4 py-2 rounded-2xl border border-red-100 bg-white/95 shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as SortType)}
          >
            <option value="Terbaru">Urutkan</option>
            <option value="Terbaru">Terbaru</option>
            <option value="Terlama">Terlama</option>
            <option value="Status">Status</option>
            <option value="Prioritas">Prioritas</option>
          </select>
        </div>

        {/* Buat Laporan Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/masyarakat/pengaduan/create'}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg transition-colors"
          >
            + Buat Laporan Baru
          </button>
        </div>

        {/* Latest Reports Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Data Laporan Terbaru</h3>

          <div className="space-y-4">
            {filteredData.map((item) => (
              <div key={item.id} className="group">
                <div className="rounded-3xl bg-white/95 shadow-lg ring-1 ring-red-100 overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02]">
                  {/* Image Section */}
                  <div className="relative h-32 bg-gradient-to-br from-red-100 to-red-200 overflow-hidden">
                    {item.fotoUrl ? (
                      <Image
                        src={item.fotoUrl}
                        alt={item.judul}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-red-600">
                          <ImageIcon className="mx-auto h-8 w-8 mb-1 opacity-50" />
                          <div className="text-xs font-medium">Foto</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h4 className="font-bold text-gray-900 mb-1">{item.judul}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                          {item.kategori}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-red-500" />
                        <span>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('id-ID') : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LocationIcon className="h-4 w-4 text-red-500" />
                        <span>{item.alamat || 'Desa Dauh Puri Kaja'}</span>
                      </div>
                      {item.noTelepon && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-red-500" />
                          <span>{item.noTelepon}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'menunggu' ? 'Menunggu Approval Admin' :
                         item.status === 'approved_admin' ? 'Approved Admin - Menunggu Kepala Dusun' :
                         item.status === 'approved_kadus' ? 'Approved Kepala Dusun' :
                         item.status === 'diproses' ? 'Diproses' :
                         item.status === 'selesai' || item.status === 'disetujui' ? 'Selesai' :
                         item.status === 'ditolak' ? 'Ditolak' : item.status}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedLaporan(item);
                          setShowDetailModal(true);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
              <SearchIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <div className="text-lg font-semibold text-gray-700 mb-2">Tidak ada laporan ditemukan</div>
              <div className="text-sm text-gray-600">Coba ubah kata kunci pencarian atau filter</div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in-0"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Detail Laporan</h2>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white/90`}>
                    {selectedLaporan.status === 'menunggu' ? 'Menunggu Approval Admin' :
                     selectedLaporan.status === 'approved_admin' ? 'Approved Admin - Menunggu Kepala Dusun' :
                     selectedLaporan.status === 'approved_kadus' ? 'Approved Kepala Dusun' :
                     selectedLaporan.status === 'diproses' ? 'Diproses' :
                     selectedLaporan.status === 'selesai' || selectedLaporan.status === 'disetujui' ? 'Selesai' :
                     'Ditolak'}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Photo */}
                {selectedLaporan.fotoUrl && (
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      src={selectedLaporan.fotoUrl}
                      alt={selectedLaporan.judul}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Title & Category */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedLaporan.judul}</h3>
                  <div className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {selectedLaporan.kategori}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Isi Laporan</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedLaporan.isi}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Tanggal</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedLaporan.createdAt?.toDate ? selectedLaporan.createdAt.toDate().toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Pelapor</p>
                      <p className="text-sm font-bold text-gray-900">{selectedLaporan.userName}</p>
                    </div>
                  </div>

                  {selectedLaporan.noTelepon && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <PhoneIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Telepon</p>
                        <p className="text-sm font-bold text-gray-900">{selectedLaporan.noTelepon}</p>
                      </div>
                    </div>
                  )}

                  {selectedLaporan.alamat && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <LocationIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">Alamat</p>
                        <p className="text-sm font-bold text-gray-900">{selectedLaporan.alamat}</p>
                      </div>
                    </div>
                  )}

                  {selectedLaporan.tanggapan && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Tanggapan Admin
                      </h4>
                      <p className="text-blue-800 text-sm">{selectedLaporan.tanggapan}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

function ImageIcon({ className }: IconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

function PlusIcon({ className }: IconProps) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
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
      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
