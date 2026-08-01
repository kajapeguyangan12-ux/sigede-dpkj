"use client";

import { useState } from "react";
import type { JSX } from "react";
import BottomNavigation from '../../../components/BottomNavigation';
import HeaderCard from '../../../components/HeaderCard';
import Link from "next/link";
import Image from "next/image";

const DesaLogo = "/logo/LOGO_DPKJ.png";
const BgdLogo = "/logo/Logo_BGD1.png";

type DukcapilService = {
  title: string;
  icon: JSX.Element;
  description: string;
  image: string;
  link: string;
};

const dukcapilServices: DukcapilService[] = [
  {
    title: "Paket Akta Lahir",
    icon: <BirthIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Pembuatan akta kelahiran",
    image: "/layanan/akta-lahir.jpg",
    link: "/masyarakat/layanan-publik/paket-akta-lahir"
  },
  {
    title: "Paket Akta Perkawinan",
    icon: <MarriageIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Pembuatan akta perkawinan",
    image: "/layanan/akta-perkawinan.jpg",
    link: "/masyarakat/layanan-publik/paket-akta-perkawinan"
  },
  {
    title: "Paket Akta Perceraian",
    icon: <DivorceIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Pembuatan akta perceraian",
    image: "/layanan/akta-perceraian.jpg",
    link: "/masyarakat/layanan-publik/paket-akta-perceraian"
  },
  {
    title: "Paket Akta Kematian",
    icon: <DeathIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Pembuatan akta kematian",
    image: "/layanan/akta-kematian.jpg",
    link: "/masyarakat/layanan-publik/paket-akta-kematian"
  },
  {
    title: "Kartu Keluarga",
    icon: <FamilyCardIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Pembuatan kartu keluarga",
    image: "/layanan/kartu-keluarga.jpg",
    link: "/masyarakat/layanan-publik/kartu-keluarga"
  },
  {
    title: "Surat Pindah Domisili",
    icon: <MovingIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Surat pindah domisili",
    image: "/layanan/surat-pindah.jpg",
    link: "/masyarakat/layanan-publik/surat-pindah-domisili"
  },
  {
    title: "Akta/Surat Lainnya",
    icon: <DocumentIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Akta atau surat lainnya",
    image: "/layanan/surat-lainnya.jpg",
    link: "/masyarakat/layanan-publik/akta-surat-lainnya"
  },
  {
    title: "KTP Elektronik Denpasar",
    icon: <KtpIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "KTP Elektronik Denpasar",
    image: "/layanan/ktp-elektronik.jpg",
    link: "/masyarakat/layanan-publik/ktp-elektronik-denpasar"
  },
  {
    title: "KTP Elektronik Luar Denpasar",
    icon: <KtpIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "KTP Elektronik Luar Denpasar",
    image: "/layanan/ktp-luar-denpasar.jpg",
    link: "/masyarakat/layanan-publik/ktp-elektronik-luar-denpasar"
  },
  {
    title: "Kartu Identitas Anak",
    icon: <ChildIdIcon className="h-16 w-16 sm:h-20 sm:w-20" />,
    description: "Kartu identitas anak",
    image: "/layanan/kartu-identitas-anak.jpg",
    link: "/masyarakat/layanan-publik/kartu-identitas-anak"
  }
];

export default function PelayananTaringDukcapilPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = dukcapilServices.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-pink-50 to-red-50">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-32 pt-4">
        {/* Header */}
        <HeaderCard title="Pelayanan Taring Dukcapil" backUrl="/masyarakat/layanan-publik" showBackButton={true} />

        {/* Search */}
        <div className="mb-5 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-2xl border-2 border-red-200 bg-white px-4 py-2.5 sm:py-3 pl-10 sm:pl-11 text-sm sm:text-base shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="Cari layanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-red-500" />
          </div>
        </div>

        {/* Services Grid */}
        <section>
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {filteredServices.map((service) => (
                <Link
                  key={service.title}
                  href={service.link}
                  className="group flex flex-col items-center rounded-2xl sm:rounded-3xl border-2 border-red-100 bg-white p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-red-300 overflow-hidden relative"
                >
                  {/* Gradient Background on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 via-pink-50/0 to-red-50/0 group-hover:from-red-50/80 group-hover:via-pink-50/80 group-hover:to-red-50/80 transition-all duration-300" />
                  
                  {/* Icon Container with Professional Design */}
                  <div className="relative w-full aspect-square mb-3 sm:mb-4 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-red-100 via-pink-100 to-red-200 shadow-md group-hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-105">
                    {/* Inner gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                    {/* Icon with animation */}
                    <div className="relative text-red-600 group-hover:text-red-700 transition-colors duration-300 group-hover:scale-110 transform">
                      {service.icon}
                    </div>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-3xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-red-600/10 to-transparent rounded-tr-3xl" />
                  </div>
                  
                  {/* Title */}
                  <div className="relative w-full text-center">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors duration-300">
                      {service.title}
                    </h3>
                  </div>
                  
                  {/* Hover indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-red-200 bg-white px-6 py-10 sm:py-12 text-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-base sm:text-lg text-red-600 mb-2">Tidak ditemukan</p>
              <p className="text-sm sm:text-base text-gray-600">
                Silakan ubah kata kunci pencarian.
              </p>
            </div>
          )}
        </section>
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

function DocumentIcon({ className }: IconProps) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
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

function BirthIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" />
      <path d="M16 32c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4" />
      <path d="M20 20c1.1-1.1 2.6-1.8 4.2-1.8s3.1.7 4.2 1.8" />
      <path d="M12 40c2.2-4.4 6.6-7.4 11.4-7.4s9.2 3 11.4 7.4" />
    </svg>
  );
}

function MarriageIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="14" r="6" />
      <circle cx="32" cy="14" r="6" />
      <path d="M6 36c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M22 36c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M24 20l3 3 3-3" />
    </svg>
  );
}

function DivorceIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="14" r="6" />
      <circle cx="32" cy="14" r="6" />
      <path d="M6 36c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M22 36c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M24 20l-3-3-3 3" />
      <path d="M30 20l-3-3-3 3" />
    </svg>
  );
}

function DeathIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="14" r="6" />
      <path d="M14 36c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M18 26c2-2.5 6-2.5 8 0" />
      <path d="M20 40c2.2-4.4 6.6-7.4 11.4-7.4s9.2 3 11.4 7.4" />
    </svg>
  );
}

function FamilyCardIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="12" width="32" height="24" rx="2" />
      <path d="M14 18h4" />
      <path d="M14 22h8" />
      <path d="M14 26h6" />
      <path d="M26 18h8" />
      <path d="M26 22h8" />
      <path d="M26 26h6" />
      <circle cx="16" cy="32" r="2" />
      <circle cx="24" cy="32" r="2" />
      <circle cx="32" cy="32" r="2" />
    </svg>
  );
}

function MovingIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="20" cy="10" r="5" />
      <path d="M12 44l4-10" />
      <path d="M28 44l-3-8-5-14" />
      <path d="M18 20l12 4 6 10" />
      <path d="M32 42h8" />
      <path d="M8 36h32" />
    </svg>
  );
}

function KtpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="12" y="8" width="24" height="32" rx="4" />
      <path d="M20 14h8" />
      <path d="M18 20h12" />
      <path d="M18 26h12" />
      <path d="M18 32h6" />
      <circle cx="32" cy="24" r="4" />
      <path d="M28 28l3 3 6-6" />
    </svg>
  );
}

function ChildIdIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="16" r="8" />
      <path d="M14 38c1.5-6 6-10 10-10s8.5 4 10 10" />
      <path d="M20 22c2-2.5 6-2.5 8 0" />
      <rect x="8" y="32" width="32" height="8" rx="2" />
      <circle cx="16" cy="36" r="1" />
      <circle cx="32" cy="36" r="1" />
    </svg>
  );
}

function SurveyIcon({ className }: IconProps) {
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
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ComplaintIcon({ className }: IconProps) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7v4" />
      <circle cx="12" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}
