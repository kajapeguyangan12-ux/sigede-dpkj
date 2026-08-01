"use client";

import BottomNavigation from '../../../../components/BottomNavigation';
import Link from "next/link";
import HeaderCard from "../../../../components/HeaderCard";

export default function PengaturanAkunPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Pengaturan Akun" backUrl="/masyarakat/profil/edit" showBackButton={true} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Ubah Foto Profil */}
          <Link
            href="/masyarakat/profil/edit/akun/foto-profil"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                📷
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-900">Ubah Foto Profil</div>
                <div className="text-xs sm:text-sm text-gray-600">Upload foto baru</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl ml-2">›</div>
          </Link>

          {/* Ubah Email */}
          <Link
            href="/masyarakat/profil/edit/akun/email"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                ✉️
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-900">Ubah Email</div>
                <div className="text-xs sm:text-sm text-gray-600">Ganti alamat email</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl ml-2">›</div>
          </Link>

          {/* Ubah Kata Sandi */}
          <Link
            href="/masyarakat/profil/edit/akun/kata-sandi"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md text-xl sm:text-2xl flex-shrink-0">
                🔒
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-semibold text-gray-900">Ubah Kata Sandi</div>
                <div className="text-xs sm:text-sm text-gray-600">Perbarui password</div>
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
