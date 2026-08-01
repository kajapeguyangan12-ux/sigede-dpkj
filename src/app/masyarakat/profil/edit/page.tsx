"use client";

import BottomNavigation from '../../../components/BottomNavigation';
import Link from "next/link";
import HeaderCard from "../../../components/HeaderCard";

export default function EditProfilMasyarakatPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Pusat Pengaturan" backUrl="/masyarakat/profil" showBackButton={true} />

        {/* Akun Anda Section */}
        <section className="mb-6 sm:mb-8">
          <h2 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Akun Anda</h2>
          <Link
            href="/masyarakat/profil/edit/akun"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md text-xl sm:text-2xl">
                👤
              </div>
              <div>
                <div className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Pengaturan Akun Anda</div>
                <div className="text-xs sm:text-sm text-gray-600">Foto Profil, Username, Email, Kata Sandi</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl">›</div>
          </Link>
        </section>

        {/* Perubahan Data Diri Section */}
        <section>
          <h2 className="mb-3 sm:mb-4 text-sm sm:text-base font-semibold text-gray-700">Perubahan Data Diri</h2>
          <Link
            href="/masyarakat/profil/edit/data-diri"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md text-xl sm:text-2xl">
                📋
              </div>
              <div>
                <div className="text-sm sm:text-base font-semibold text-gray-900">Data Diri</div>
                <div className="text-xs sm:text-sm text-gray-600">Informasi pribadi dan kependudukan</div>
              </div>
            </div>
            <div className="text-gray-400 text-xl">›</div>
          </Link>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}
