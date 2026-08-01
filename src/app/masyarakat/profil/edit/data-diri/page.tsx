"use client";

import BottomNavigation from '../../../../components/BottomNavigation';
import Link from "next/link";
import HeaderCard from "../../../../components/HeaderCard";
import { useAuth } from '../../../../../contexts/AuthContext';

export default function DataDiriPage() {
  const { user } = useAuth();
  
  // Check if user is warga_luar_dpkj
  const isWargaLuarDPKJ = user?.role === 'warga_luar_dpkj';

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Data Diri" backUrl="/masyarakat/profil/edit" showBackButton={true} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Data Diri Kependudukan - Hidden for warga_luar_dpkj */}
          {!isWargaLuarDPKJ && (
            <Link
              href="/masyarakat/profil/edit/data-diri/kependudukan"
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                  🏛️
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-semibold text-gray-900">Data Kependudukan</div>
                  <div className="text-xs sm:text-sm text-gray-600">NIK, KK, dan info kependudukan</div>
                </div>
              </div>
              <div className="text-gray-400 text-xl ml-2">›</div>
            </Link>
          )}

          {/* Lokasi Tinggal */}
          <Link
            href="/masyarakat/profil/edit/data-diri/lokasi"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                📍
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-900">Lokasi Tinggal</div>
                <div className="text-xs sm:text-sm text-gray-600">Alamat dan domisili</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl ml-2">›</div>
          </Link>

          {/* Kontak */}
          <Link
            href="/masyarakat/profil/edit/data-diri/kontak"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                📞
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-900">Kontak</div>
                <div className="text-xs sm:text-sm text-gray-600">Telepon dan email</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl ml-2">›</div>
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
