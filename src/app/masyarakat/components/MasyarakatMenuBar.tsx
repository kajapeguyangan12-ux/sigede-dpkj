"use client";

import type { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../lib/useCurrentUser";
import {
  Newspaper,
  Building2,
  FileText,
  DollarSign,
  Database,
  Users,
  Star,
  Mountain,
  MessageSquare,
  ShoppingBag,
  Landmark,
  BookOpen,
  UserCheck,
  Clipboard,
  Bell,
  Store,
} from "lucide-react";

type MenuItem = {
  title: string;
  href: string;
  icon: JSX.Element;
  gradient: string;
};

const allMenuItems: MenuItem[] = [
  {
    title: "E-News",
    href: "/masyarakat/e-news",
    gradient: "from-blue-500 to-blue-600",
    icon: (
      <div className="relative">
        <Newspaper className="h-5 w-5" />
        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-white rounded-full"></div>
      </div>
    ),
  },
  {
    title: "Profil Desa",
    href: "/masyarakat/profil-desa",
    gradient: "from-emerald-500 to-emerald-600",
    icon: (
      <div className="relative">
        <Landmark className="h-5 w-5" />
        <Building2 className="h-3 w-3 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Regulasi",
    href: "/masyarakat/regulasi",
    gradient: "from-purple-500 to-purple-600",
    icon: (
      <div className="relative">
        <BookOpen className="h-5 w-5" />
        <FileText className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Keuangan",
    href: "/masyarakat/keuangan",
    gradient: "from-green-500 to-green-600",
    icon: (
      <div className="relative">
        <DollarSign className="h-5 w-5" />
        <Star className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Data Desa",
    href: "/masyarakat/profil-desa",
    gradient: "from-indigo-500 to-indigo-600",
    icon: (
      <div className="relative">
        <Database className="h-5 w-5" />
        <Users className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Layanan Publik",
    href: "/masyarakat/layanan-publik",
    gradient: "from-cyan-500 to-cyan-600",
    icon: (
      <div className="relative">
        <UserCheck className="h-5 w-5" />
        <FileText className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "IKM",
    href: "/masyarakat/ikm",
    gradient: "from-orange-500 to-orange-600",
    icon: (
      <div className="relative">
        <Clipboard className="h-5 w-5" />
        <Star className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Wisata & Budaya",
    href: "/masyarakat/wisata-budaya",
    gradient: "from-pink-500 to-pink-600",
    icon: (
      <div className="relative">
        <Mountain className="h-5 w-5" />
        <Building2 className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Pengaduan",
    href: "/masyarakat/pengaduan",
    gradient: "from-red-500 to-red-600",
    icon: (
      <div className="relative">
        <MessageSquare className="h-5 w-5" />
        <Bell className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "E-Toko",
    href: "/masyarakat/e-umkm",
    gradient: "from-amber-500 to-amber-600",
    icon: (
      <div className="relative">
        <Store className="h-5 w-5" />
        <ShoppingBag className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
];

interface MasyarakatMenuBarProps {
  columnsCount?: number;
}

export default function MasyarakatMenuBar({ columnsCount = 5 }: MasyarakatMenuBarProps) {
  const { user } = useCurrentUser();
  const pathname = usePathname();

  let menuItems: MenuItem[] = allMenuItems;
  if (user?.role === "warga_luar_dpkj") {
    menuItems = allMenuItems.filter(
      (item) => item.title === "E-Toko" || item.title === "Wisata & Budaya"
    );
  }

  return (
    <div className="rounded-3xl bg-white/95 p-3 sm:p-4 md:p-6 shadow-xl ring-1 ring-gray-200 backdrop-blur-sm">
      <div className={`grid gap-2 sm:gap-3 md:gap-4 text-center text-xs`}>
        <div className="grid gap-2 sm:gap-3 md:gap-4 auto-rows-max" style={{ 
          gridTemplateColumns: `repeat(auto-fit, minmax(60px, 1fr))`
        }}>
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href} className="group">
              <div className="flex flex-col items-center">
                <div
                  className={`mb-2 sm:mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-3xl bg-gradient-to-br ${item.gradient} text-lg sm:text-xl text-white shadow-xl ring-2 ring-white/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:ring-4 group-hover:ring-white/40 group-active:scale-95 active:scale-95`}
                >
                  {item.icon}
                </div>
                <span className="text-center font-bold leading-tight text-gray-800 text-[10px] sm:text-xs px-1 line-clamp-2">
                  {item.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
