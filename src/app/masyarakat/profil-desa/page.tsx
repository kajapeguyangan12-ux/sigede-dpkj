"use client";

import Link from "next/link";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';

export default function ProfilDesaPage() {
  const menuItems = [
    {
      id: 1,
      title: "Wilayah Desa",
      icon: "🗺️",
      href: "/masyarakat/profil-desa/wilayah"
    },
    {
      id: 2,
      title: "Sejarah Desa",
      icon: "📚",
      href: "/masyarakat/profil-desa/sejarah"
    },
    {
      id: 3,
      title: "Visi & Misi",
      icon: "🎯",
      href: "/masyarakat/profil-desa/visi-misi"
    },
    {
      id: 4,
      title: "Struktur Pemerintahan",
      icon: "👥",
      href: "/masyarakat/profil-desa/struktur"
    },
    {
      id: 5,
      title: "Lembaga Kemasyarakatan",
      icon: "🏛️",
      href: "/masyarakat/profil-desa/lembaga"
    }
  ];

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-800">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <HeaderCard 
          title="Profil Desa" 
          subtitle="Informasi Desa"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Menu Items */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5 max-w-4xl mx-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between rounded-xl sm:rounded-2xl lg:rounded-3xl border border-gray-300 bg-white p-4 sm:p-5 md:p-6 lg:p-7 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                <div className="grid h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 place-items-center rounded-full bg-gradient-to-br from-red-50 to-red-100 text-xl sm:text-2xl lg:text-3xl">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800">{item.title}</div>
                </div>
              </div>
              <div className="text-gray-400 text-xl sm:text-2xl lg:text-3xl font-light">›</div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
