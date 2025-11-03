"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from '../../../contexts/AuthContext';
import { handleMasyarakatLogout } from '../../../lib/masyarakatLogoutHelper';
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
const SiGedeLogo = "/logo/LOGO_DPKJ.png";

export default function ProfilMasyarakatPage() {
  const { logout } = useAuth();
  
  // Mock data; replace with real user data later
  const user = {
    nama: "Nama Lengkap",
    nik: "NIK",
    desa: "Dauh Puri Kaja",
    role: "Role",
  };

  const handleLogout = async () => {
    await handleMasyarakatLogout(() => logout('masyarakat'));
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
      <div className="mx-auto w-full max-w-md px-3 sm:px-4 pb-24 sm:pb-28 pt-4">
        <HeaderCard 
          title="Profil" 
          subtitle="Data Pribadi"
          backUrl="/masyarakat/home"
          showBackButton={false}
        />

        {/* User Card Section */}
        <section className="mb-6 rounded-2xl border border-black/20 bg-gradient-to-b from-rose-50 to-white p-0 shadow ring-1 ring-black/10 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(120%_100%_at_0%_0%,#ef4444,transparent_60%)]" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 px-3 sm:px-4 pt-3">
              <div className="inline-flex items-center gap-2 text-rose-700 font-bold">
                <Image src={SiGedeLogo} alt="SiGede" width={18} height={18} />
                <span className="text-sm sm:text-base">SiGede</span>
              </div>
              <div className="text-center sm:text-right text-xs sm:text-sm flex-1">
                <div className="font-semibold line-clamp-1">{user.nama}</div>
                <div className="flex items-center justify-center sm:justify-end gap-1 text-xs"><span className="line-clamp-1">{user.desa}</span><span>📍</span></div>
                <div className="text-gray-700 text-xs">{user.role}</div>
              </div>
            </div>
            <div className="px-3 sm:px-4 pb-4 pt-2 text-xs sm:text-sm">
              <div className="text-gray-800 truncate">{user.nik}</div>
            </div>
            <div className="h-2 w-full bg-gradient-to-r from-rose-700 via-rose-400 to-rose-300" />
          </div>
        </section>

        {/* Profile Section */}
        <section className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-full bg-white/90 shadow ring-1 ring-black/10 text-5xl sm:text-6xl">👤</div>
            <Link href="#" className="mt-2 text-xs sm:text-sm text-sky-700 hover:underline font-medium">Edit</Link>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid w-full gap-3 px-4 sm:px-6 auto-cols-max justify-center">
            <Link 
              href="/masyarakat/profil/detail" 
              className="rounded-full border border-gray-300 bg-gray-200 px-6 sm:px-8 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-300 transition-colors active:scale-95"
            >
              Detail
            </Link>
            <Link 
              href="/masyarakat/profil/edit" 
              className="rounded-full bg-sky-500 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-[inset_0_-2px_0_#0b78c1,0_2px_0_#0b78c133] hover:bg-sky-600 text-center transition-colors active:scale-95"
            >
              Edit Profil
            </Link>
          </div>

          {/* Logout Section */}
          <div className="mt-8 px-4 sm:px-6 w-full flex justify-center">
            <button
              onClick={handleLogout}
              className="rounded-full border border-red-300 bg-red-50 px-6 sm:px-8 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100 hover:border-red-400 transition-colors active:scale-95"
            >
              Logout Akun
            </button>
          </div>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}
