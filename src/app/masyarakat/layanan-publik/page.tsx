"use client";

import { useMemo, useState, useEffect } from "react";
import type { JSX } from "react";
import Link from "next/link";
import HeaderCard from "@/app/components/HeaderCard";
import BottomNavigation from "@/app/components/BottomNavigation";
import FormLayanan from "./components/FormLayanan";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSubmissions, LayananPublik } from "@/lib/layananPublikService";


type ServiceItem = {
  title: string;
  icon: JSX.Element;
  category: string;
};

export default function LayananPublikPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [submissions, setSubmissions] = useState<LayananPublik[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<LayananPublik | null>(null);
  
  const { user } = useAuth();

  const services = useMemo((): ServiceItem[] => [
    {
      title: "Surat Kelakuan Baik",
      icon: <ConductIcon className="h-12 w-12 text-blue-600" />,
      category: "Umum",
    },
    {
      title: "Surat Keterangan Belum Bekerja",
      icon: <EmploymentIcon className="h-12 w-12 text-emerald-600" />,
      category: "Umum",
    },
    {
      title: "Surat Keterangan Kematian",
      icon: <CertificateIcon className="h-12 w-12 text-gray-600" />,
      category: "Kependudukan",
    },
    {
      title: "Surat Keterangan Berpergian",
      icon: <TravelIcon className="h-12 w-12 text-indigo-600" />,
      category: "Umum",
    },
    {
      title: "Form Taring Dukcapil",
      icon: <CommunityIcon className="h-12 w-12 text-amber-600" />,
      category: "Form Taring Dukcapil",
    },
  ], []);

  const categories = useMemo(() => [
    "Semua",
    ...Array.from(new Set(services.map((service) => service.category))),
  ], [services]);

  // Fetch user submissions
  useEffect(() => {
    if (user?.uid) {
      fetchSubmissions();
    }
  }, [user?.uid]);

  const fetchSubmissions = async () => {
    if (!user?.uid) return;
    
    try {
      const userSubmissions = await getUserSubmissions(user.uid);
      setSubmissions(userSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const getStatusLabel = (status: LayananPublik['status']) => {
    switch (status) {
      case 'pending_kadus':
        return 'Menunggu Persetujuan Kepala Dusun';
      case 'approved_kadus':
        return 'Disetujui Kadus - Menunggu Admin Desa';
      case 'approved_admin':
        return 'Disetujui Admin Desa - Surat Siap Diambil';
      case 'completed':
        return 'Selesai - Dokumen Telah Diambil';
      case 'ditolak':
        return 'Ditolak';
      case 'auto_approved':
        return 'Disetujui Otomatis';
      default:
        return status;
    }
  };

  const getStatusColor = (status: LayananPublik['status']) => {
    switch (status) {
      case 'pending_kadus':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved_kadus':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approved_admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ditolak':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'auto_approved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return services.filter((service) => {
      const matchCategory =
        selectedCategory === "Semua" || service.category === selectedCategory;
      const matchQuery =
        normalizedQuery.length === 0 ||
        service.title.toLowerCase().includes(normalizedQuery);

      return matchCategory && matchQuery;
    });
  }, [query, selectedCategory]);

  // Handle back from form
  const handleBackFromForm = () => {
    setShowForm(false);
    setSelectedService("");
  };

  // Show form if a service is selected
  if (showForm && selectedService) {
    return <FormLayanan jenisLayanan={selectedService} onBack={handleBackFromForm} />;
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800">
      {isFilterOpen ? (
        <button
          type="button"
          aria-label="Tutup menu filter"
          className="fixed inset-0 z-10 cursor-default bg-blue-500/10"
          onClick={() => setIsFilterOpen(false)}
        />
      ) : null}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <div className="max-w-7xl mx-auto">
        <HeaderCard 
          title="Layanan Publik" 
          subtitle="Administrasi & Kependudukan"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Tracking Status Button */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <button
            onClick={() => setShowTrackingModal(true)}
            className="w-full flex items-center justify-between gap-3 sm:gap-4 lg:gap-5 rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-blue-100/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 rounded-full bg-white/20">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg">Tracking Status</h3>
                <p className="text-white/80 text-xs sm:text-sm lg:text-base">Lihat status permohonan Anda</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              {submissions.length > 0 && (
                <span className="bg-white/20 rounded-full px-2 py-1 text-xs font-medium">
                  {submissions.length}
                </span>
              )}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        <section className="mb-6 sm:mb-8 lg:mb-10 space-y-4 sm:space-y-5 lg:space-y-6">
          <div className="relative flex items-center gap-3 sm:gap-4">
            <label className="flex flex-1 items-center gap-3 sm:gap-4 rounded-full border border-blue-100 bg-white/95 backdrop-blur-sm px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 shadow-lg ring-1 ring-blue-100/50 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-300/50">
              <SearchIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-500" />
              <span className="sr-only">Cari layanan</span>
              <input
                type="search"
                className="w-full bg-transparent text-sm sm:text-base lg:text-lg text-gray-800 outline-none placeholder:text-gray-400"
                placeholder="Cari layanan"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-blue-100 bg-white/95 backdrop-blur-sm px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 text-sm sm:text-base lg:text-lg font-semibold text-gray-800 shadow-lg ring-1 ring-blue-100/50 transition-all duration-300 hover:bg-blue-50 hover:ring-2 hover:ring-blue-300/50"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                aria-haspopup="true"
              >
                <span>
                  {selectedCategory === "Semua" ? "Filter" : selectedCategory}
                </span>
                <FilterIcon className="h-4 w-4 text-blue-500" />
              </button>
              {isFilterOpen ? (
                <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-2xl border border-blue-100 bg-white/95 backdrop-blur-sm p-3 text-left text-sm shadow-2xl ring-1 ring-blue-100/50">
                  <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wide text-blue-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Kategori
                  </p>
                  <ul className="space-y-1">
                    {categories.map((category) => {
                      const isSelected = selectedCategory === category;
                      return (
                        <li key={category}>
                          <button
                            type="button"
                            className={`w-full rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 font-semibold shadow-md"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsFilterOpen(false);
                            }}
                          >
                            {category}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 shadow-lg ring-1 ring-blue-100/50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 mb-1 sm:mb-2">Penting!</p>
                <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-blue-700/90">
                  Untuk layanan pemohon dapat menyiapkan berkas sesuai persyaratan
                  dan mengajukan permohonan langsung melalui sistem desa.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 sm:space-y-5 lg:space-y-6">
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredServices.map((service, index) => {
                const gradients = [
                  "from-blue-50 to-blue-100/50",
                  "from-purple-50 to-purple-100/50", 
                  "from-emerald-50 to-emerald-100/50",
                  "from-rose-50 to-rose-100/50",
                  "from-gray-50 to-gray-100/50",
                  "from-indigo-50 to-indigo-100/50",
                  "from-amber-50 to-amber-100/50"
                ];
                const hoverGradients = [
                  "group-hover:from-blue-100 group-hover:to-blue-200/50",
                  "group-hover:from-purple-100 group-hover:to-purple-200/50",
                  "group-hover:from-emerald-100 group-hover:to-emerald-200/50",
                  "group-hover:from-rose-100 group-hover:to-rose-200/50",
                  "group-hover:from-gray-100 group-hover:to-gray-200/50",
                  "group-hover:from-indigo-100 group-hover:to-indigo-200/50",
                  "group-hover:from-amber-100 group-hover:to-amber-200/50"
                ];
                const borderColors = [
                  "border-blue-100 hover:border-blue-200 ring-blue-100/50",
                  "border-purple-100 hover:border-purple-200 ring-purple-100/50",
                  "border-emerald-100 hover:border-emerald-200 ring-emerald-100/50",
                  "border-rose-100 hover:border-rose-200 ring-rose-100/50",
                  "border-gray-100 hover:border-gray-200 ring-gray-100/50",
                  "border-indigo-100 hover:border-indigo-200 ring-indigo-100/50",
                  "border-amber-100 hover:border-amber-200 ring-amber-100/50"
                ];
                
                // Jika Form Taring Dukcapil, redirect ke halaman pilihan
                if (service.title === "Form Taring Dukcapil") {
                  return (
                    <Link
                      key={service.title}
                      href="/masyarakat/layanan-publik/pelayanan-taring-dukcapil"
                      className={`group relative flex h-full flex-col items-center justify-between gap-3 sm:gap-4 lg:gap-5 overflow-hidden rounded-2xl sm:rounded-3xl border ${borderColors[index]} bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm px-3 sm:px-4 lg:px-5 py-4 sm:py-5 lg:py-6 text-center shadow-lg ring-1 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 transition-all duration-500 group-hover:opacity-100`} />
                      <div className={`relative grid h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 place-items-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradients[index]} transition-all duration-500 ${hoverGradients[index]} shadow-lg group-hover:shadow-xl group-hover:scale-110`}>
                        {service.icon}
                      </div>
                      <span className="relative text-xs sm:text-sm lg:text-base font-semibold leading-snug text-gray-800 transition duration-300 group-hover:text-gray-900">
                        {service.title}
                      </span>
                      <span className="relative text-[10px] sm:text-[11px] lg:text-xs font-medium uppercase tracking-wide text-gray-500 transition duration-300 group-hover:text-gray-600">
                        {service.category}
                      </span>
                    </Link>
                  );
                }
                
                return (
                <button
                  key={service.title}
                  onClick={() => {
                    setSelectedService(service.title);
                    setShowForm(true);
                  }}
                  className={`group relative flex h-full flex-col items-center justify-between gap-3 sm:gap-4 lg:gap-5 overflow-hidden rounded-2xl sm:rounded-3xl border ${borderColors[index]} bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm px-3 sm:px-4 lg:px-5 py-4 sm:py-5 lg:py-6 text-center shadow-lg ring-1 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 transition-all duration-500 group-hover:opacity-100`} />
                  <div className={`relative grid h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 place-items-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradients[index]} transition-all duration-500 ${hoverGradients[index]} shadow-lg group-hover:shadow-xl group-hover:scale-110`}>
                    {service.icon}
                  </div>
                  <span className="relative text-xs sm:text-sm lg:text-base font-semibold leading-snug text-gray-800 transition duration-300 group-hover:text-gray-900">
                    {service.title}
                  </span>
                  <span className="relative text-[10px] sm:text-[11px] lg:text-xs font-medium uppercase tracking-wide text-gray-500 transition duration-300 group-hover:text-gray-600">
                    {service.category}
                  </span>
                </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl border border-dashed border-red-200 bg-white/80 px-6 sm:px-8 lg:px-10 py-10 sm:py-12 lg:py-14 text-center text-sm sm:text-base lg:text-lg text-gray-600">
              <p className="font-semibold text-red-600">Tidak ditemukan</p>
              <p className="mt-1 sm:mt-2">
                Silakan ubah kata kunci pencarian atau pilih kategori lain.
              </p>
            </div>
          )}
        </section>
        </div>
      </div>

      {/* Tracking Status Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Status Permohonan</h3>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {submissions.length > 0 ? (
                <div className="p-4 space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {submission.jenisLayanan}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {submission.namaLengkap}
                          </p>
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                            {getStatusLabel(submission.status)}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Diajukan: {submission.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}
                          </div>
                          
                          {/* Workflow Progress */}
                          <div className="mt-3 space-y-2">
                            <div className="text-xs font-medium text-gray-700">Progress Approval:</div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${['pending_kadus', 'approved_kadus', 'approved_admin', 'completed'].includes(submission.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600">Kepala Dusun</span>
                              <div className="flex-1 h-0.5 bg-gray-300">
                                <div className={`h-full ${['approved_kadus', 'approved_admin', 'completed'].includes(submission.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${['approved_admin', 'completed'].includes(submission.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600">Admin Desa</span>
                              <div className="flex-1 h-0.5 bg-gray-300">
                                <div className={`h-full ${['completed'].includes(submission.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              </div>
                              <div className={`w-3 h-3 rounded-full ${['completed'].includes(submission.status) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-xs text-gray-600">Selesai</span>
                            </div>
                          </div>

                          {/* Bukti Approval untuk status completed */}
                          {submission.status === 'approved_admin' && submission.buktiApproval && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-green-800">Permohonan Disetujui!</span>
                              </div>
                              <p className="text-sm text-green-700">
                                Bukti Approval: <span className="font-mono">{submission.buktiApproval}</span>
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                Silakan ambil dokumen di Kantor Kepala Desa dalam 7 hari
                              </p>
                            </div>
                          )}

                          {/* Show rejection reason if ditolak */}
                          {submission.status === 'ditolak' && submission.alasanTolak && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm font-medium text-red-800">Alasan Penolakan:</p>
                              <p className="text-sm text-red-700">{submission.alasanTolak}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Belum Ada Permohonan</h4>
                  <p className="text-sm text-gray-600">Anda belum pernah mengajukan permohonan layanan.</p>
                </div>
              )}
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

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.65" y1="16.65" x2="21" y2="21" />
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
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

function HomeIcon({ className }: IconProps) {
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
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 12.5v8.5h13v-8.5" />
      <path d="M9.5 21v-6h5v6" />
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
      strokeWidth={1.8}
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
      strokeWidth={1.8}
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

function ConductIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
      <circle cx="12" cy="8" r="2" fill="currentColor" />
      <path d="M8 16h8" strokeWidth={2} />
    </svg>
  );
}

function SingleStatusIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <rect x="16" y="2" width="6" height="6" rx="2" fill="none" />
      <path d="M19 5h-3" strokeWidth={2} />
      <circle cx="19" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function EmploymentIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <circle cx="9" cy="9" r="2" />
      <path d="M7 15h4v-2c0-1.1-.9-2-2-2s-2 .9-2 2v2z" />
      <path d="M15 10h2M15 12h3M15 14h2" />
    </svg>
  );
}

function MarriageIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="7" r="2.5" />
      <circle cx="15.5" cy="7" r="2.5" />
      <path d="M6 21v-2a4 4 0 0 1 2.5-3.7" />
      <path d="M18 21v-2a4 4 0 0 0-2.5-3.7" />
      <circle cx="12" cy="13" r="2" fill="currentColor" />
      <path d="M9.5 17.5c1.5 1.5 3 1.5 5 0" />
      <path d="M14 2l2 2-2 2" />
      <path d="M10 2L8 4l2 2" />
    </svg>
  );
}

function CertificateIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <circle cx="10" cy="13" r="2" />
      <path d="M8 21v-1a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <path d="M6 11h4M6 15h2" />
      <path d="M16 4v4h4" strokeWidth={2} />
    </svg>
  );
}

function TravelIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v8M8 12h8" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" strokeWidth={1} />
    </svg>
  );
}

function CommunityIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <rect x="12" y="2" width="8" height="6" rx="2" fill="none" />
      <path d="M14 5h4M14 7h3" strokeWidth={1} />
    </svg>
  );
}

function BackIcon({ className }: IconProps) {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
