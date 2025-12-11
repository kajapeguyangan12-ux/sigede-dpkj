"use client";

import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
// import { useCurrentUser } from "../lib/useCurrentUser"; // Not needed anymore
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import PopupIklan from '../components/PopupIklan';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  Building,
  TrendingUp,
  Camera,
  Gift,
  Map,
  Landmark,
  BookOpen,
  UserCheck,
  Clipboard,
  Bell,
  Store,
} from "lucide-react";

interface Berita {
  id: string;
  judul: string;
  foto?: string;
  tanggal?: any;
  createdAt?: any;
  createdBy?: string;
  authorRole?: string;
  status?: string;
  kategori?: 'terbaru' | 'terlama';
}

interface UMKM {
  id: string;
  namaUsaha: string;
  fotoUsaha?: string[];
  rating?: number;
  kategori?: string;
  totalKunjungan?: number;
  visits?: number;
  createdAt?: any;
}

interface PengaturanHome {
  judulSelamatDatang: string;
  ucapanSelamatDatang: string;
  fotoUcapanSelamatDatang: string; // New field for welcome image
  fotoKepalaDesa: string;
  namaKepalaDesa: string;
  fotoSlideshow: string[];
  popupAktif: boolean;
  popupTipe: "gambar" | "youtube";
  popupJudul: string;
  popupIsi: string;
  popupFoto: string;
  popupYoutubeUrl: string;
  popupYoutubeStartTime: number;
}

type MenuItem = {
  title: string;
  href: string;
  icon: JSX.Element;
  gradient: string;
  adminOnly?: boolean;  // Mark if this menu requires admin privileges
  roles?: string[];     // Specific roles that can access this menu
  disabled?: boolean;   // Mark if menu is disabled for current user
};

// Menu access configuration
const MENU_ACCESS_CONFIG = {
  // Menus completely hidden for masyarakat (not shown at all)
  hiddenForMasyarakat: [
    // IKM removed from system
  ],
  
  // Menus restricted for regular masyarakat (warga_dpkj) 
  restrictedForMasyarakat: [
    // IKM removed from system
  ],
  
  // Menus available for external residents (warga_luar_dpkj)
  allowedForExternal: [
    "E-UMKM", 
    "Wisata & Budaya",
    "E-News",
    "Profil Desa"
  ],
  
  // Menus restricted even for kepala_dusun
  restrictedForKepalaDusun: [
    "Keuangan"  // Only full admins can access financial data
  ]
};

const allMenuItems: MenuItem[] = [
  {
    title: "E-News",
    href: "/masyarakat/e-news",
    gradient: "from-red-500 to-red-600",
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
        <TrendingUp className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
      </div>
    ),
  },
  {
    title: "Data Desa",
    href: "/masyarakat/data-desa",
    gradient: "from-indigo-500 to-indigo-600",
    icon: (
      <div className="relative">
        <Database className="h-5 w-5" />
        <Map className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-white" />
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
        <Users className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
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
        <Camera className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-white" />
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
    title: "E-UMKM",
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

export default function MasyarakatHomePage(): JSX.Element {
  const { user } = useAuth();
  const router = useRouter();
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [umkmList, setUmkmList] = useState<UMKM[]>([]);
  const [currentBeritaIndex, setCurrentBeritaIndex] = useState(0);
  const [currentUmkmIndex, setCurrentUmkmIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pengaturan, setPengaturan] = useState<PengaturanHome | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);
  const [isBeritaHovered, setIsBeritaHovered] = useState(false);
  const [isUmkmHovered, setIsUmkmHovered] = useState(false);

  // Memoize slideshow data to prevent unnecessary re-renders
  const slideshowData = useMemo(() => {
    return {
      length: pengaturan?.fotoSlideshow?.length || 0,
      hasSlideshow: Boolean(pengaturan?.fotoSlideshow && pengaturan.fotoSlideshow.length > 0)
    };
  }, [pengaturan?.fotoSlideshow]);

  useEffect(() => {
    console.log('🏠 Masyarakat Home: User loaded:', {
      uid: user?.uid,
      displayName: user?.displayName,
      userRole: user?.role,
      isFullAdmin: isFullAdmin
    });
    // Layout sudah handle authentication check, jadi langsung fetch data
    fetchData();
    fetchPengaturan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Show popup only once per session if active
    // Check both sessionStorage and pengaturan
    if (pengaturan?.popupAktif) {
      const popupShown = sessionStorage.getItem('popupShown');
      console.log('🔔 Checking popup status:', { 
        popupAktif: pengaturan.popupAktif, 
        popupShown, 
        popupTipe: pengaturan.popupTipe 
      });
      
      if (!popupShown) {
        console.log('✅ Showing popup');
        // Add small delay to ensure DOM is ready
        setTimeout(() => {
          setShowPopup(true);
          sessionStorage.setItem('popupShown', 'true');
        }, 500); // 500ms delay to ensure component is fully mounted
      } else {
        console.log('ℹ️ Popup already shown in this session');
      }
    } else {
      console.log('ℹ️ Popup tidak aktif atau pengaturan belum dimuat');
    }
  }, [pengaturan]);

  // Debug: Log berita list when loaded
  useEffect(() => {
    if (beritaList.length > 0) {
      console.log('📰 Berita List Loaded:', beritaList.map(b => ({
        id: b.id,
        judul: b.judul,
        foto: b.foto,
        hasFoto: !!b.foto
      })));
    }
  }, [beritaList]);

  // Auto slide berita setiap 5 detik (pause on hover) - Profesional timing
  useEffect(() => {
    if (beritaList.length > 1 && !isBeritaHovered) {
      const interval = setInterval(() => {
        setCurrentBeritaIndex((prev) => (prev + 1) % beritaList.length);
      }, 5000); // 5 seconds - optimal for reading
      return () => clearInterval(interval);
    }
  }, [beritaList.length, isBeritaHovered]);

  // Auto slide UMKM setiap 4 detik - Profesional timing (pause on hover)
  useEffect(() => {
    if (umkmList.length > 1 && !isUmkmHovered) {
      const interval = setInterval(() => {
        setCurrentUmkmIndex((prev) => (prev + 1) % umkmList.length);
      }, 4000); // 4 seconds - smooth transition
      return () => clearInterval(interval);
    }
  }, [umkmList.length, isUmkmHovered]);

  // Auto slide slideshow setiap 5 detik - Consistent timing
  useEffect(() => {
    if (slideshowData.hasSlideshow && slideshowData.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlideshowIndex((prev) => (prev + 1) % slideshowData.length);
      }, 5000); // 5 seconds - consistent with berita
      return () => clearInterval(interval);
    }
  }, [slideshowData.hasSlideshow, slideshowData.length]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch berita terbaru dari E-News Admin (auto update)
      try {
        const allBerita: Berita[] = [];

        console.log('🔍 Fetching berita from e-news_berita collection');
        
        try {
          // Try simple query first without where clause to avoid index issues
          const queryTerbaru = query(
            collection(db, "e-news_berita"),
            orderBy("createdAt", "desc"),
            limit(10) // Ambil 10 berita untuk di-filter client-side
          );
          const snapshotTerbaru = await getDocs(queryTerbaru);
          
          // Process berita terbaru dan filter published di client-side
          snapshotTerbaru.forEach((doc) => {
            const data = doc.data();
            
            // Only add if status is published
            if (data.status === "published") {
              const fotoUrl = data.imageUrl || data.foto || data.gambar || data.image;
              console.log('📸 Berita foto URL:', {
                id: doc.id,
                title: data.title || data.judul,
                imageUrl: data.imageUrl,
                foto: data.foto,
                gambar: data.gambar,
                image: data.image,
                finalUrl: fotoUrl
              });
              
              allBerita.push({ 
                id: doc.id, 
                ...data,
                // Map field names dari e-news_berita ke interface Berita
                judul: data.title || data.judul || 'Berita Terbaru',
                foto: fotoUrl,
                createdAt: data.createdAt,
                createdBy: data.createdBy,
                authorRole: data.authorRole,
                status: data.status,
                kategori: 'terbaru'
              } as Berita);
            }
          });
          
          // Limit to 5 berita
          allBerita.splice(5);
          
          console.log(`✅ Loaded ${allBerita.length} berita from e-news_berita`, allBerita);
        } catch (indexError: any) {
          // Fallback: fetch all if index error
          console.warn('⚠️ Query error, using fallback...', indexError.message);
          
          const queryAll = query(
            collection(db, "e-news_berita"),
            orderBy("createdAt", "desc"),
            limit(20) // Ambil lebih banyak untuk di-filter
          );
          const snapshotAll = await getDocs(queryAll);
          
          // Filter published di client-side
          snapshotAll.forEach((doc) => {
            const data = doc.data();
            
            // Only add if status is published
            if (data.status === "published") {
              allBerita.push({ 
                id: doc.id, 
                ...data,
                judul: data.title || data.judul || 'Berita Terbaru',
                foto: data.imageUrl || data.foto || data.gambar || data.image,
                createdAt: data.createdAt,
                createdBy: data.createdBy,
                authorRole: data.authorRole,
                status: data.status,
                kategori: 'terbaru'
              } as Berita);
            }
          });
          
          // Limit to 5 after filtering
          allBerita.splice(5);
          
          console.log(`✅ Loaded ${allBerita.length} berita from e-news_berita (client-side filter)`, allBerita);
        }

        if (allBerita.length === 0) {
          console.log('ℹ️ No published news found in e-news_berita');
          setBeritaList([]);
        } else {
          // Prioritize news with photos, then fallback to news without photos
          const beritaWithPhotos = allBerita.filter(item => item.foto && item.foto.trim() !== '');
          const beritaWithoutPhotos = allBerita.filter(item => !item.foto || item.foto.trim() === '');
          
          // Take top 3 with photos first, then fill with others if needed
          const finalBerita = [
            ...beritaWithPhotos.slice(0, 3),
            ...beritaWithoutPhotos
          ].slice(0, 3);
          
          setBeritaList(finalBerita);
          console.log('📰 E-News Berita loaded for slideshow:', {
            total: allBerita.length,
            withPhotos: beritaWithPhotos.length,
            displayed: finalBerita.length
          });
        }
      } catch (beritaError) {
        console.error('❌ Error fetching berita from e-news_berita:', beritaError);
        setBeritaList([]);
      }

      // Fetch 3 UMKM dengan kunjungan terbanyak (hanya yang aktif)
      try {
        // Simple query without composite index
        const umkmQuery = query(
          collection(db, "e-umkm"),
          where("status", "==", "aktif"),
          limit(20) // Fetch more to sort client-side
        );
        const umkmSnapshot = await getDocs(umkmQuery);
        const umkm: UMKM[] = [];
        umkmSnapshot.forEach((doc) => {
          const data = doc.data();
          umkm.push({ 
            id: doc.id, 
            ...data,
            // Handle different field names for visits
            totalKunjungan: data.totalKunjungan || data.visits || 0
          } as UMKM);
        });
        
        // Sort by totalKunjungan client-side and take top 3
        const sortedUmkm = umkm
          .sort((a, b) => (b.totalKunjungan || 0) - (a.totalKunjungan || 0))
          .slice(0, 3);
        
        setUmkmList(sortedUmkm);
        console.log('🏪 UMKM terpopuler:', sortedUmkm);
      } catch (umkmError: any) {
        console.warn('⚠️ Error fetching UMKM:', umkmError.message);
        setUmkmList([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPengaturan = async () => {
    try {
      console.log('📥 Fetching pengaturan home...');
      const docRef = doc(db, "pengaturan", "home");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PengaturanHome;
        console.log('✅ Pengaturan loaded:', {
          popupAktif: data.popupAktif,
          popupTipe: data.popupTipe,
          popupJudul: data.popupJudul
        });
        setPengaturan(data);
      } else {
        console.log('⚠️ Pengaturan document tidak ditemukan');
      }
    } catch (error) {
      console.error('❌ Error fetching pengaturan:', error);
    }
  };

  const extractYouTubeId = (url: string): string => {
    if (!url) return "";
    // Support for regular YouTube videos and YouTube Shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  };

  const handleBeritaClick = () => {
    if (beritaList[currentBeritaIndex]) {
      router.push(`/masyarakat/e-news/${beritaList[currentBeritaIndex].id}`);
    }
  };

  const handleUmkmClick = () => {
    if (umkmList[currentUmkmIndex]) {
      router.push(`/masyarakat/e-umkm`);
    }
  };

  // Filter menu items based on user role (using useMemo to prevent recalculation)
  const isFullAdmin = useMemo(() => {
    return user?.role && [
      "administrator", 
      "admin_desa", 
      "kepala_desa"
    ].includes(user.role);
  }, [user?.role]);
  
  const menuItems = useMemo(() => {
    let filteredMenus: MenuItem[] = allMenuItems;
    
    // Apply role-based menu filtering (completely hide certain menus)
    if (user?.role === "warga_luar_dpkj") {
      // External residents (warga luar DPKJ) - only show allowed menus
      filteredMenus = allMenuItems.filter(
        item => MENU_ACCESS_CONFIG.allowedForExternal.includes(item.title)
      );
    } else if (user?.role === "warga_dpkj") {
      // Regular local residents - show all available menus
      filteredMenus = allMenuItems;
    } else if (user?.role === "kepala_dusun") {
      // Village head assistant - hide financial data
      filteredMenus = allMenuItems.filter(
        item => !MENU_ACCESS_CONFIG.restrictedForKepalaDusun.includes(item.title)
      );
    } else {
      // All other roles including admin - show all menus
      filteredMenus = allMenuItems;
    }
    
    console.log('🔧 Menu configuration applied:', {
      userRole: user?.role,
      isFullAdmin,
      totalMenus: filteredMenus.length,
      totalAvailable: allMenuItems.length,
      hiddenMenus: allMenuItems.filter(item => !filteredMenus.some(m => m.title === item.title)).map(m => m.title)
    });
    
    return filteredMenus;
  }, [user?.role, isFullAdmin]);
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-orange-25 to-yellow-50 text-gray-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(239,68,68,0.1)_0%,_transparent_50%)]"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-[radial-gradient(circle_at_50%_50%,_rgba(251,146,60,0.1)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[radial-gradient(circle_at_50%_50%,_rgba(252,211,77,0.1)_0%,_transparent_50%)]"></div>
      </div>
      
      {/* Popup Modal - Using PopupIklan Component */}
      {showPopup && <PopupIklan onClose={() => setShowPopup(false)} />}

      <div className="relative w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        {/* Using HeaderCard Component */}
        <HeaderCard 
          title="Beranda" 
          subtitle="Sistem Informasi Desa"
        />

        {/* Welcome Section - Modern Professional Design - Compact Horizontal Layout */}
        <section className="mb-6 relative overflow-hidden rounded-2xl shadow-xl">
          {/* Background with gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-pink-700"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="relative p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Profile Picture Section - Left Side, Compact, with vertical centering */}
              <div className="flex-shrink-0 sm:self-center">
                <div className="relative group">
                  {/* Animated gradient outer glow - Red theme matching card */}
                  <div className="absolute -inset-3 bg-gradient-to-r from-red-400/40 via-rose-300/30 to-pink-400/40 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 animate-pulse"></div>
                  
                  {/* Rotating decorative ring - Red gradient */}
                  <div className="absolute -inset-2.5 rounded-full">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-red-300/50 via-transparent to-rose-300/50 animate-[spin_10s_linear_infinite]"></div>
                  </div>
                  
                  {/* Secondary ring for depth - Red theme */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-red-200/40 via-rose-200/20 to-pink-200/40 rounded-full backdrop-blur-sm"></div>
                  
                  {/* Main picture container - Smaller and compact with auto-fit */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-3 ring-white/90 shadow-[0_0_25px_rgba(239,68,68,0.4)] transform group-hover:scale-110 transition-all duration-500 ease-out">
                    {pengaturan?.fotoKepalaDesa ? (
                      <div className="relative w-full h-full">
                        <img
                          src={pengaturan.fotoKepalaDesa}
                          alt="Kepala Desa"
                          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Professional overlay gradient with red tint */}
                        <div className="absolute inset-0 bg-gradient-to-t from-red-900/5 via-transparent to-white/5"></div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-300/50 to-rose-300/30 flex items-center justify-center backdrop-blur-sm">
                        <Landmark className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-2xl" />
                      </div>
                    )}
                    
                    {/* Inner shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Enhanced verified badge with premium styling - Smaller */}
                  <div className="absolute bottom-0 right-0 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 w-7 h-7 rounded-full ring-2 ring-white/90 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {/* Continuous pulse effect */}
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40"></span>
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-30"></span>
                  </div>
                </div>
              </div>

              {/* Content Section - Right Side, Flexible */}
              <div className="flex-1 w-full">
                {/* Title with icon - Top Row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {pengaturan?.judulSelamatDatang || "Ucapan Selamat Datang"}
                  </h3>
                </div>

                {/* Slideshow box - Below Title */}
                <div className="relative">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 text-gray-400 h-32 sm:h-40 md:h-48 lg:h-64 xl:h-80">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-xs">Memuat...</span>
                      </div>
                    ) : pengaturan?.fotoSlideshow && pengaturan.fotoSlideshow.length > 0 ? (
                      <div className="relative">
                        {/* Slideshow Image - Sliding Container - Responsive height */}
                        <div className="relative h-32 sm:h-40 md:h-48 lg:h-64 xl:h-80 overflow-hidden">
                          {/* Slides Wrapper with Transform */}
                          <div 
                            className="flex h-full transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                            style={{
                              transform: `translateX(-${currentSlideshowIndex * 100}%)`,
                              width: `${pengaturan.fotoSlideshow.length * 100}%`
                            }}
                          >
                            {pengaturan.fotoSlideshow.map((foto, index) => (
                              <div
                                key={index}
                                className="relative w-full h-full flex-shrink-0"
                                style={{ width: `${100 / pengaturan.fotoSlideshow.length}%` }}
                              >
                                <img
                                  src={foto}
                                  alt={`Slideshow ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Gradient overlay bottom */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                        </div>

                        {/* Info overlay at bottom - Compact */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white/50">
                                <span className="text-white text-[10px] sm:text-xs font-bold">
                                  {pengaturan.namaKepalaDesa?.charAt(0) || 'K'}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs font-semibold text-white drop-shadow-lg">
                                  {pengaturan.namaKepalaDesa || 'Kepala Desa'}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-white/90 drop-shadow-lg">Dauh Puri Kaja</p>
                              </div>
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-white/90 drop-shadow-lg bg-black/30 px-1.5 py-0.5 rounded-full">
                              {currentSlideshowIndex + 1}/{pengaturan.fotoSlideshow.length}
                            </div>
                          </div>
                        </div>

                        {/* Navigation dots - Compact */}
                        <div className="absolute bottom-8 sm:bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1">
                          {pengaturan.fotoSlideshow.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentSlideshowIndex(index)}
                              className={`transition-all duration-300 rounded-full cursor-pointer touch-manipulation ${
                                index === currentSlideshowIndex 
                                  ? 'w-3 h-1 sm:w-4 sm:h-1.5 bg-white shadow-lg scale-110' 
                                  : 'w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/60 hover:bg-white active:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        {/* Welcome Image - Full Container */}
                        {pengaturan?.fotoUcapanSelamatDatang && (
                          <img 
                            src={pengaturan.fotoUcapanSelamatDatang}
                            alt="Ucapan Selamat Datang"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Decorative quote mark - Smaller */}
                  <div className="absolute -top-2 -left-1 text-white/20 text-4xl font-serif leading-none">"</div>
                </div>

                {/* Indicator dots - Mobile only */}
                <div className="flex lg:hidden justify-center sm:justify-start gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  <span className="h-1.5 w-6 sm:h-2 sm:w-8 rounded-full bg-white shadow-lg" />
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white/40" />
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </section>

        {/* Services Card */}
        <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <div className="rounded-2xl sm:rounded-3xl bg-white/98 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 shadow-2xl ring-1 ring-gray-100 backdrop-blur-sm border border-white/40">
            {/* Professional Menu Grid - Desktop: 5 columns, Mobile: 5 top + 4 bottom */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-0">
              {/* Desktop: Single grid 5 columns 2 rows, Mobile: Separate rows */}
              <div className="hidden lg:grid lg:grid-cols-5 xl:grid-cols-9 lg:gap-8 xl:gap-10 lg:gap-y-10 xl:gap-y-12">
                {menuItems.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    className="group cursor-pointer"
                  >
                    <div className="flex flex-col items-center group-hover:transform group-hover:scale-105 transition-all duration-300">
                      <div className="relative mb-4">
                        <div
                          className={`relative grid h-18 w-18 xl:h-20 xl:w-20 place-items-center rounded-xl bg-gradient-to-br ${item.gradient} text-2xl text-white shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                        >
                          {item.icon}
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}></div>
                        </div>
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 scale-110`}></div>
                      </div>
                      <span className="text-center font-medium leading-tight text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-300 max-w-20">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Mobile: Top Row - 5 items */}
              <div className="grid lg:hidden grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {menuItems.slice(0, 5).map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    className="group cursor-pointer"
                  >
                    <div className="flex flex-col items-center group-hover:transform group-hover:scale-105 transition-all duration-300">
                      {/* Professional Icon Container */}
                      <div className="relative mb-2 sm:mb-2.5 md:mb-3 lg:mb-4">
                        <div
                          className={`relative grid h-11 w-11 xs:h-12 xs:w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 xl:h-20 xl:w-20 place-items-center rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} text-base xs:text-lg sm:text-xl lg:text-2xl text-white shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                        >
                          {item.icon}
                          
                          {/* Subtle glow effect */}
                          <div className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}></div>
                        </div>
                        
                        {/* Enhanced ring effect */}
                        <div className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 scale-110`}></div>
                      </div>
                      
                      {/* Professional Text Label */}
                      <span className="text-center font-medium leading-tight text-[10px] xs:text-[11px] sm:text-xs lg:text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-300 max-w-[60px] sm:max-w-16 lg:max-w-20">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Mobile: Bottom Row - 4 items (centered) */}
              {menuItems.length > 5 && (
                <div className="grid lg:hidden grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-[280px] xs:max-w-xs sm:max-w-sm mx-auto">
                  {menuItems.slice(5).map((item) => (
                    <Link 
                      key={item.title} 
                      href={item.href}
                      className="group cursor-pointer"
                    >
                      <div className="flex flex-col items-center group-hover:transform group-hover:scale-105 transition-all duration-300">
                        {/* Professional Icon Container */}
                        <div className="relative mb-3">
                          <div
                            className={`relative grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-xl bg-gradient-to-br ${item.gradient} text-lg sm:text-xl text-white shadow-lg transition-all duration-300 group-hover:shadow-xl`}
                          >
                            {item.icon}
                            
                            {/* Subtle glow effect */}
                            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}></div>
                          </div>
                          
                          {/* Enhanced ring effect */}
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 scale-110`}></div>
                        </div>
                        
                        {/* Professional Text Label */}
                        <span className="text-center font-medium leading-tight text-xs text-gray-700 group-hover:text-gray-900 transition-colors duration-300 max-w-16">
                          {item.title}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Desktop: E-News and UMKM side by side, Mobile: Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-8 xl:gap-10 mb-6">
          {/* E-News Section */}
          <section className="lg:mb-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
              <h3 className="text-base sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-red-700 to-rose-700 bg-clip-text text-transparent whitespace-nowrap">
                📰 Berita Terkini
              </h3>
              <div className="h-0.5 flex-1 ml-3 sm:ml-4 lg:ml-5 bg-gradient-to-r from-red-200 to-transparent rounded-full"></div>
            </div>
          {loading ? (
            <div className="rounded-2xl sm:rounded-3xl bg-white/95 p-6 sm:p-8 md:p-10 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20">
              <div className="flex flex-col justify-center items-center gap-3 sm:gap-4">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-b-4 border-red-600 border-t-4 border-t-transparent"></div>
                <p className="text-red-700 font-medium text-sm sm:text-base">Memuat berita...</p>
              </div>
            </div>
          ) : beritaList.length > 0 ? (
            <div 
              onMouseEnter={() => setIsBeritaHovered(true)}
              onMouseLeave={() => setIsBeritaHovered(false)}
              className="rounded-2xl sm:rounded-3xl bg-white/95 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20 overflow-hidden hover:shadow-2xl hover:ring-2 hover:ring-red-300/70 transition-all duration-500 group"
            >
              {/* Slider Container */}
              <div className="relative h-44 xs:h-48 sm:h-56 md:h-64 lg:h-80 overflow-hidden">
                {beritaList.map((berita, index) => (
                  <div 
                    key={berita.id}
                    onClick={() => router.push(`/masyarakat/e-news/detail/berita/${berita.id}`)}
                    className="absolute inset-0 w-full h-full cursor-pointer bg-gradient-to-br from-red-50 to-red-100 transition-all duration-[800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    style={{
                      opacity: index === currentBeritaIndex ? 1 : 0,
                      transform: index === currentBeritaIndex ? 'translateX(0) scale(1)' : index < currentBeritaIndex ? 'translateX(-100%) scale(0.95)' : 'translateX(100%) scale(0.95)',
                      pointerEvents: index === currentBeritaIndex ? 'auto' : 'none',
                      zIndex: index === currentBeritaIndex ? 10 : 0
                    }}
                  >
                      {berita.foto ? (
                        <>
                          <img
                            src={berita.foto}
                            alt={berita.judul}
                            loading="eager"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.classList.add('show-fallback');
                              }
                            }}
                          />
                          {/* Fallback icon - shown if image fails to load */}
                          <div className="fallback-icon w-full h-full hidden items-center justify-center bg-gradient-to-br from-red-100 to-rose-100">
                            <div className="text-center">
                              <Newspaper className="h-16 w-16 sm:h-20 sm:w-20 text-red-600 mx-auto mb-2" />
                              <p className="text-red-600 font-semibold text-sm">📰 Berita Terkini</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-rose-100">
                          <div className="text-center">
                            <Newspaper className="h-16 w-16 sm:h-20 sm:w-20 text-red-600 mx-auto mb-2" />
                            <p className="text-red-600 font-semibold text-sm">📰 Berita Terkini</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* News counter badge */}
                      <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 lg:px-4 lg:py-1.5 flex items-center gap-1">
                        <Newspaper className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-500" />
                        <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-800">
                          {index + 1} / {beritaList.length}
                        </span>
                      </div>
                      
                      {/* Admin badge */}
                      {(berita.authorRole === 'admin' || berita.createdBy) && (
                        <div className="absolute top-10 right-2 sm:top-14 sm:right-3 lg:top-16 lg:right-4 bg-red-600/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1">
                          <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-white">Admin</span>
                        </div>
                      )}
                      
                      {/* Date badge */}
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 lg:px-4 lg:py-1.5">
                        <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-white">
                          {berita.createdAt?.toDate?.()?.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          }) || berita.tanggal?.toDate?.()?.toLocaleDateString('id-ID', {
                            day: 'numeric', 
                            month: 'short'
                          }) || 'Terbaru'}
                        </span>
                      </div>
                      
                      {/* Title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-5">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium bg-emerald-500/90 text-white">
                            📈 E-News Terbaru
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg line-clamp-2 mb-1">
                          {berita.judul || 'Berita Terkini'}
                        </h4>
                        <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm flex items-center gap-1">
                          <span>👆</span> Klik untuk membaca selengkapnya
                        </p>
                      </div>
                    </div>
                  ))}
                
                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBeritaIndex((prev) => prev === 0 ? beritaList.length - 1 : prev - 1);
                  }}
                  className="absolute left-1.5 sm:left-2 lg:left-3 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 lg:p-3 text-white hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-300 opacity-60 sm:opacity-0 group-hover:opacity-100 shadow-lg touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBeritaIndex((prev) => (prev + 1) % beritaList.length);
                  }}
                  className="absolute right-1.5 sm:right-2 lg:right-3 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 lg:p-3 text-white hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-300 opacity-60 sm:opacity-0 group-hover:opacity-100 shadow-lg touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-red-50/80 to-rose-50/80 p-3 sm:p-4 md:p-5 lg:p-6 text-center border-t border-red-100/50">
                <div className="flex justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {beritaList.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBeritaIndex(index);
                      }}
                      className={`relative h-2 sm:h-2.5 lg:h-3 rounded-full transition-all duration-500 cursor-pointer touch-manipulation overflow-hidden ${
                        index === currentBeritaIndex 
                          ? 'w-8 sm:w-10 lg:w-12 bg-gradient-to-r from-red-600 to-rose-600 shadow-lg' 
                          : 'w-2 sm:w-2.5 lg:w-3 bg-red-300 hover:bg-red-500 active:scale-110'
                      }`}
                    >
                      {/* Progress bar animation for active slide */}
                      {index === currentBeritaIndex && !isBeritaHovered && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                          style={{
                            animation: 'progressBar 5s linear infinite'
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Auto-play indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-red-600/70">
                  {isBeritaHovered ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                      <span className="font-medium">Dijeda</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                      <span className="font-medium">Auto-slide aktif</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* CSS for progress animation and fallback handling */}
              <style jsx>{`
                @keyframes progressBar {
                  from {
                    width: 0%;
                  }
                  to {
                    width: 100%;
                  }
                }
                
                /* Show fallback when image fails */
                .show-fallback .fallback-icon {
                  display: flex !important;
                }
              `}</style>
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl bg-white/95 p-6 sm:p-8 lg:p-10 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20 text-center">
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Newspaper className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-red-600" />
              </div>
              <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">Belum Ada Berita</h4>
              <p className="text-red-600 text-xs sm:text-sm lg:text-base">Berita terbaru akan muncul di sini</p>
            </div>
          )}
          </section>

          {/* UKM Data Section - Auto Slide with Rating */}
          <section className="lg:mb-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
              <h3 className="text-base sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent whitespace-nowrap">
                🏪 Data UKM
              </h3>
              <div className="h-0.5 flex-1 ml-3 sm:ml-4 lg:ml-5 bg-gradient-to-r from-amber-200 to-transparent rounded-full"></div>
            </div>
          {loading ? (
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 p-6 sm:p-8 lg:p-10 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 border-b-4 border-amber-600"></div>
              </div>
            </div>
          ) : umkmList.length > 0 ? (
            <div 
              onMouseEnter={() => setIsUmkmHovered(true)}
              onMouseLeave={() => setIsUmkmHovered(false)}
              onClick={handleUmkmClick}
              className="rounded-2xl sm:rounded-3xl bg-white/90 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-2xl hover:ring-2 hover:ring-amber-300/70 transition-all duration-500 group"
            >
              <div className="relative h-44 xs:h-48 sm:h-56 md:h-64 lg:h-80 bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
                {umkmList[currentUmkmIndex]?.fotoUsaha?.[0] ? (
                  <>
                    <img
                      src={umkmList[currentUmkmIndex].fotoUsaha[0]}
                      alt={umkmList[currentUmkmIndex].namaUsaha}
                      loading="eager"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('show-fallback-umkm');
                        }
                      }}
                    />
                    {/* Fallback icon - shown if image fails to load */}
                    <div className="fallback-icon-umkm w-full h-full hidden items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                      <div className="text-center">
                        <Store className="h-16 w-16 sm:h-20 sm:w-20 text-amber-600 mx-auto mb-2" />
                        <p className="text-amber-600 font-semibold text-sm">🏪 UMKM</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                    <div className="text-center">
                      <Store className="h-16 w-16 sm:h-20 sm:w-20 text-amber-600 mx-auto mb-2" />
                      <p className="text-amber-600 font-semibold text-sm">🏪 UMKM</p>
                    </div>
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* UMKM counter badge */}
                <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 lg:px-4 lg:py-1.5 flex items-center gap-1">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-amber-500" />
                  <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-800">
                    {currentUmkmIndex + 1} / {umkmList.length}
                  </span>
                </div>
                
                {/* Rating badge */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 lg:px-4 lg:py-1.5 flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-amber-500 fill-amber-500" />
                  <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-800">
                    {umkmList[currentUmkmIndex]?.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                
                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentUmkmIndex((prev) => prev === 0 ? umkmList.length - 1 : prev - 1);
                  }}
                  className="absolute left-1.5 sm:left-2 lg:left-3 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 lg:p-3 text-white hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-300 opacity-60 sm:opacity-0 group-hover:opacity-100 shadow-lg touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentUmkmIndex((prev) => (prev + 1) % umkmList.length);
                  }}
                  className="absolute right-1.5 sm:right-2 lg:right-3 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-1.5 sm:p-2 lg:p-3 text-white hover:bg-black/50 hover:scale-110 active:scale-95 transition-all duration-300 opacity-60 sm:opacity-0 group-hover:opacity-100 shadow-lg touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-5">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 lg:px-3 lg:py-1 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium bg-amber-500/90 text-white">
                      🏆 UMKM Terbaik
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg line-clamp-2 mb-1">
                    {umkmList[currentUmkmIndex]?.namaUsaha || 'UMKM Terbaik'}
                  </h4>
                  {umkmList[currentUmkmIndex]?.kategori && (
                    <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm">
                      {umkmList[currentUmkmIndex].kategori}
                    </p>
                  )}
                  <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm flex items-center gap-1 mt-1">
                    <span>👆</span> Klik untuk melihat detail
                  </p>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-5 text-center bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-t border-amber-100/50">
                <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {umkmList.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentUmkmIndex(index);
                      }}
                      className={`relative h-1.5 sm:h-2 lg:h-2.5 rounded-full transition-all duration-500 touch-manipulation overflow-hidden ${
                        index === currentUmkmIndex 
                          ? 'w-6 sm:w-8 lg:w-10 bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg' 
                          : 'w-1.5 sm:w-2 lg:w-2.5 bg-amber-300 hover:bg-amber-400 active:scale-110'
                      }`}
                    >
                      {/* Progress bar animation for active slide */}
                      {index === currentUmkmIndex && !isUmkmHovered && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                          style={{
                            animation: 'progressBarUMKM 4s linear infinite'
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Auto-play indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-amber-600/70">
                  {isUmkmHovered ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                      <span className="font-medium">Dijeda</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                      <span className="font-medium">Auto-slide aktif</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* CSS for progress animation and fallback handling */}
              <style jsx>{`
                @keyframes progressBarUMKM {
                  from {
                    width: 0%;
                  }
                  to {
                    width: 100%;
                  }
                }
                
                /* Show fallback when image fails */
                .show-fallback-umkm .fallback-icon-umkm {
                  display: flex !important;
                }
              `}</style>
            </div>
          ) : (
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 p-6 sm:p-8 lg:p-10 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm text-center text-gray-500 text-sm sm:text-base lg:text-lg">
              Tidak ada UMKM tersedia
            </div>
          )}
          </section>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}


