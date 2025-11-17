"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Custom SVG icons
const UserGroupIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Logo paths
const DesaLogo = "/logo/LOGO_DPKJ.png";

export default function RegisterSelectionPage() {
  const router = useRouter();

  const handleWargaLokalClick = () => {
    router.push('/masyarakat/daftar/warga-lokal');
  };

  const handleWargaLuarClick = () => {
    router.push('/masyarakat/daftar/warga-luar');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Image
                src={DesaLogo}
                alt="Logo Desa"
                width={80}
                height={80}
                className="rounded-2xl shadow-xl border-4 border-white"
                priority
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">📝</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent mb-4">
            Pilih Jenis Pendaftaran
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Silakan pilih jenis pendaftaran sesuai dengan status kependudukan Anda di Desa Dauh Puri Kaja
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Warga Lokal DPKJ */}
          <button
            onClick={handleWargaLokalClick}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 text-center text-white">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <HomeIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Warga Lokal DPKJ</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Untuk warga yang berdomisili di wilayah Desa Dauh Puri Kaja
                </p>
              </div>
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Akses lengkap semua fitur</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Layanan publik & pengaduan</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Data desa & keuangan</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">E-News, UMKM & Wisata Budaya</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  Pilih Pendaftaran →
                </span>
              </div>
            </div>
          </button>

          {/* Warga Luar DPKJ */}
          <button
            onClick={handleWargaLuarClick}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 text-center text-white">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-white/20 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <GlobeIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Warga Luar DPKJ</h3>
                <p className="text-emerald-100 text-sm leading-relaxed">
                  Untuk warga luar yang ingin mengakses informasi desa
                </p>
              </div>
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Akses E-News terbaru</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Informasi UMKM lokal</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Wisata & Budaya DPKJ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Profil & informasi desa</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  Pilih Pendaftaran →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link 
            href="/masyarakat/login" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium transition-all duration-300 group"
          >
            <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Login</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            ©Copyright BaliGerbangDigital 2024
          </p>
        </div>
      </div>
    </main>
  );
}