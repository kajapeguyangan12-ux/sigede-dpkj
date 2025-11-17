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
    "IKM"  // IKM completely hidden for regular users as requested
  ],
  
  // Menus restricted for regular masyarakat (warga_dpkj) 
  restrictedForMasyarakat: [
    "IKM"  // Also add to restricted list for consistency
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

  // Auto slide berita setiap 10 detik (pause on hover)
  useEffect(() => {
    if (beritaList.length > 0 && !isBeritaHovered) {
      const interval = setInterval(() => {
        setCurrentBeritaIndex((prev) => (prev + 1) % beritaList.length);
      }, 10000); // 10 seconds
      return () => clearInterval(interval);
    }
  }, [beritaList.length, isBeritaHovered]); // Use length instead of full array

  // Auto slide UMKM setiap 3 detik
  useEffect(() => {
    if (umkmList.length > 0) {
      const interval = setInterval(() => {
        setCurrentUmkmIndex((prev) => (prev + 1) % umkmList.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [umkmList.length]); // Use length instead of full array

  // Auto slide slideshow setiap 4 detik
  useEffect(() => {
    if (slideshowData.hasSlideshow) {
      const interval = setInterval(() => {
        setCurrentSlideshowIndex((prev) => (prev + 1) % slideshowData.length);
      }, 4000);
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
          // Try with composite index (status + createdAt)
          const queryTerbaru = query(
            collection(db, "e-news_berita"),
            where("status", "==", "published"),
            orderBy("createdAt", "desc"),
            limit(5) // Ambil 5 berita terbaru
          );
          const snapshotTerbaru = await getDocs(queryTerbaru);
          
          // Process berita terbaru
          snapshotTerbaru.forEach((doc) => {
            const data = doc.data();
            
            allBerita.push({ 
              id: doc.id, 
              ...data,
              // Map field names dari e-news_berita ke interface Berita
              judul: data.title || data.judul || 'Berita Terbaru',
              foto: data.imageUrl || data.foto || data.gambar || data.image,
              createdAt: data.createdAt,
              createdBy: data.createdBy,
              authorRole: data.authorRole,
              status: data.status,
              kategori: 'terbaru'
            } as Berita);
          });
          
          console.log(`✅ Loaded ${allBerita.length} berita from e-news_berita (with index)`, allBerita);
        } catch (indexError: any) {
          // Fallback: Index masih building, fetch semua lalu filter di client
          console.warn('⚠️ Index still building, using client-side filtering...', indexError.message);
          
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
      // Try with composite index first, fallback to client-side filtering if index not available
      try {
        const umkmQuery = query(
          collection(db, "e-umkm"),
          where("status", "==", "aktif"),
          orderBy("totalKunjungan", "desc"),
          limit(3)
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
        setUmkmList(umkm);
        console.log('🏪 UMKM terpopuler (kunjungan terbanyak):', umkm);
      } catch (indexError: any) {
        console.warn('⚠️ Composite index for totalKunjungan not available, using fallback query:', indexError.message);
        
        // Fallback: Fetch all active UMKM and sort client-side by visits
        const umkmFallbackQuery = query(
          collection(db, "e-umkm"),
          where("status", "==", "aktif")
        );
        const umkmSnapshot = await getDocs(umkmFallbackQuery);
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
        console.log('🏪 UMKM terpopuler (fallback - kunjungan terbanyak):', sortedUmkm);
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
      // Regular local residents - hide some menus but allow more than external
      filteredMenus = allMenuItems.filter(
        item => !MENU_ACCESS_CONFIG.hiddenForMasyarakat.includes(item.title)
      );
    } else if (user?.role === "kepala_dusun") {
      // Village head assistant - hide financial data
      filteredMenus = allMenuItems.filter(
        item => !MENU_ACCESS_CONFIG.restrictedForKepalaDusun.includes(item.title)
      );
    } else if (!isFullAdmin) {
      // Unknown/limited roles - hide IKM by default
      filteredMenus = allMenuItems.filter(
        item => !MENU_ACCESS_CONFIG.hiddenForMasyarakat.includes(item.title)
      );
    } else {
      // Full admin - show all menus
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

      <div className="relative mx-auto w-full max-w-lg px-4 sm:px-6 pb-24 sm:pb-28 pt-6">
        {/* Using HeaderCard Component */}
        <HeaderCard 
          title="Beranda" 
          subtitle="Sistem Informasi Desa"
        />

        {/* Welcome Section - Modern Professional Design */}
        <section className="mb-6 relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Background with gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-pink-700"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Picture Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {/* Decorative rings */}
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute -inset-2 bg-white/10 rounded-full"></div>
                  
                  {/* Main picture container */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-white/50 shadow-2xl">
                    {pengaturan?.fotoKepalaDesa ? (
                      <img
                        src={pengaturan.fotoKepalaDesa}
                        alt="Kepala Desa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center backdrop-blur-sm">
                        <Landmark className="h-14 w-14 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-7 h-7 rounded-full ring-4 ring-white/30 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 text-center sm:text-left">
                {/* Title with icon */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {pengaturan?.judulSelamatDatang || "Ucapan Selamat Datang"}
                  </h3>
                </div>

                {/* Slideshow box */}
                <div className="relative">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 text-gray-400 h-48">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="text-sm">Memuat...</span>
                      </div>
                    ) : pengaturan?.fotoSlideshow && pengaturan.fotoSlideshow.length > 0 ? (
                      <div className="relative">
                        {/* Slideshow Image - Sliding Container */}
                        <div className="relative h-48 sm:h-56 overflow-hidden">
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

                        {/* Info overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white/50">
                                <span className="text-white text-xs font-bold">
                                  {pengaturan.namaKepalaDesa?.charAt(0) || 'K'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white drop-shadow-lg">
                                  {pengaturan.namaKepalaDesa || 'Kepala Desa'}
                                </p>
                                <p className="text-xs text-white/90 drop-shadow-lg">Dauh Puri Kaja</p>
                              </div>
                            </div>
                            <div className="text-xs text-white/90 drop-shadow-lg bg-black/30 px-2 py-1 rounded-full">
                              {currentSlideshowIndex + 1}/{pengaturan.fotoSlideshow.length}
                            </div>
                          </div>
                        </div>

                        {/* Navigation dots */}
                        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                          {pengaturan.fotoSlideshow.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentSlideshowIndex(index)}
                              className={`transition-all duration-300 rounded-full cursor-pointer ${
                                index === currentSlideshowIndex 
                                  ? 'w-6 h-2 bg-white shadow-lg scale-110' 
                                  : 'w-2 h-2 bg-white/60 hover:bg-white hover:scale-105'
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
                  
                  {/* Decorative quote mark */}
                  <div className="absolute -top-3 -left-2 text-white/20 text-6xl font-serif leading-none">"</div>
                </div>

                {/* Indicator dots */}
                <div className="flex justify-center sm:justify-start gap-2 mt-4">
                  <span className="h-2 w-8 rounded-full bg-white shadow-lg" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </section>

        {/* Services Card */}
        <section className="mb-10">
          <div className="rounded-3xl bg-white/98 p-8 shadow-2xl ring-1 ring-gray-100 backdrop-blur-sm border border-white/40">
            {/* Professional Menu Grid - Organized Layout */}
            <div className="space-y-6">
              {/* Top Row - 5 items */}
              <div className="grid grid-cols-5 gap-4 sm:gap-6">
                {menuItems.slice(0, 5).map((item) => (
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
              
              {/* Bottom Row - 4 items (centered) */}
              {menuItems.length > 5 && (
                <div className="grid grid-cols-4 gap-4 sm:gap-6 max-w-sm mx-auto">
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

        {/* E-News Section - Auto Slide with Photos */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-700 to-rose-700 bg-clip-text text-transparent">
              📰 Berita Terkini
            </h3>
            <div className="h-0.5 flex-1 ml-4 bg-gradient-to-r from-red-200 to-transparent rounded-full"></div>
          </div>
          {loading ? (
            <div className="rounded-3xl bg-white/95 p-10 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20">
              <div className="flex flex-col justify-center items-center gap-4">
                <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-red-600 border-t-4 border-t-transparent"></div>
                <p className="text-red-700 font-medium">Memuat berita...</p>
              </div>
            </div>
          ) : beritaList.length > 0 ? (
            <div 
              onMouseEnter={() => setIsBeritaHovered(true)}
              onMouseLeave={() => setIsBeritaHovered(false)}
              className="rounded-3xl bg-white/95 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20 overflow-hidden hover:shadow-2xl hover:ring-2 hover:ring-red-300/70 transition-all duration-500 group"
            >
              {/* Slider Container */}
              <div className="relative h-48 sm:h-64 overflow-hidden">
                {/* Slides Wrapper */}
                <div 
                  className="flex h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                  style={{
                    transform: `translateX(-${currentBeritaIndex * 100}%)`,
                    width: `${beritaList.length * 100}%`
                  }}
                >
                  {beritaList.map((berita, index) => (
                    <div 
                      key={berita.id}
                      onClick={() => router.push(`/masyarakat/e-news/detail/berita/${berita.id}`)}
                      className="relative w-full h-full flex-shrink-0 cursor-pointer bg-gradient-to-br from-red-50 to-red-100 slide-item hover:shadow-lg transition-shadow duration-300"
                      style={{ width: `${100 / beritaList.length}%` }}
                    >
                      {berita.foto ? (
                        <img
                          src={berita.foto}
                          alt={berita.judul}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="h-16 w-16 text-red-600" />
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* News counter badge */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                        <Newspaper className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-bold text-gray-800">
                          {index + 1} / {beritaList.length}
                        </span>
                      </div>
                      
                      {/* Admin badge */}
                      {(berita.authorRole === 'admin' || berita.createdBy) && (
                        <div className="absolute top-14 right-3 bg-red-600/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <span className="text-xs font-medium text-white">Admin</span>
                        </div>
                      )}
                      
                      {/* Date badge */}
                      <div className="absolute top-3 left-3 bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-xs font-medium text-white">
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
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/90 text-white">
                            📈 E-News Terbaru
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-base line-clamp-2 mb-1">
                          {berita.judul || 'Berita Terkini'}
                        </h4>
                        <p className="text-white/80 text-xs flex items-center gap-1">
                          <span>👆</span> Klik untuk membaca selengkapnya
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBeritaIndex((prev) => prev === 0 ? beritaList.length - 1 : prev - 1);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBeritaIndex((prev) => (prev + 1) % beritaList.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/50 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-red-50/80 to-rose-50/80 p-5 text-center border-t border-red-100/50">
                <div className="flex justify-center gap-3 mb-3">
                  {beritaList.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBeritaIndex(index);
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentBeritaIndex 
                          ? 'w-10 bg-gradient-to-r from-red-600 to-rose-600 shadow-lg' 
                          : 'w-2.5 bg-red-300 hover:bg-red-500 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/95 p-8 shadow-xl ring-1 ring-red-200/50 backdrop-blur-sm border border-white/20 text-center">
              <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Newspaper className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Belum Ada Berita</h4>
              <p className="text-red-600 text-sm">Berita terbaru akan muncul di sini</p>
            </div>
          )}
        </section>

        {/* UKM Data Section - Auto Slide with Rating */}
        <section className="mb-6">
          <h3 className="mb-4 text-base sm:text-lg font-bold text-amber-800">Data UKM</h3>
          {loading ? (
            <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600"></div>
              </div>
            </div>
          ) : umkmList.length > 0 ? (
            <div 
              onClick={handleUmkmClick}
              className="rounded-3xl bg-white/90 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="relative h-48 sm:h-64 bg-gradient-to-br from-amber-100 to-amber-200">
                {umkmList[currentUmkmIndex]?.fotoUsaha?.[0] ? (
                  <img
                    src={umkmList[currentUmkmIndex].fotoUsaha[0]}
                    alt={umkmList[currentUmkmIndex].namaUsaha}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="h-16 w-16 text-amber-600" />
                  </div>
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-gray-800">
                    {umkmList[currentUmkmIndex]?.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white font-bold text-sm sm:text-base line-clamp-2">
                    {umkmList[currentUmkmIndex]?.namaUsaha || 'UMKM Terbaik'}
                  </h4>
                  {umkmList[currentUmkmIndex]?.kategori && (
                    <p className="text-white/80 text-xs mt-1">
                      {umkmList[currentUmkmIndex].kategori}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-4 text-center">
                <div className="flex justify-center gap-2">
                  {umkmList.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentUmkmIndex(index);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentUmkmIndex 
                          ? 'w-8 bg-amber-600' 
                          : 'w-2 bg-amber-300 hover:bg-amber-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-amber-200 backdrop-blur-sm text-center text-gray-500">
              Tidak ada UMKM tersedia
            </div>
          )}
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}


