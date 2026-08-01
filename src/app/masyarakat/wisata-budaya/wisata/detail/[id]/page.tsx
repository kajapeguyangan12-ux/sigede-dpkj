"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../../lib/firebase';
import HeaderCard from "../../../../../components/HeaderCard";
import BottomNavigation from '../../../../../components/BottomNavigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';

// Dynamic import untuk Leaflet Map dengan SSR disabled
const LeafletMapViewer = dynamic(() => import('@/components/LeafletMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600 font-medium">Memuat peta...</p>
      </div>
    </div>
  )
});

type WisataDetail = {
  id: string;
  judul: string;
  kategori: string;
  alamat: string;
  lokasi: string;
  deskripsi: string;
  fotoUrl?: string;
  galeri?: string[]; // Gallery images
  rating?: number;
  jarak?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function WisataDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [wisata, setWisata] = useState<WisataDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "location" | "gallery">("info");
  const [imageError, setImageError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!user) {
      // Store current path to redirect back after login
      const currentPath = `/masyarakat/wisata-budaya/wisata/detail/${params.id}`;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      router.push('/masyarakat/login');
    }
  }, [user, router, params.id]);

  useEffect(() => {
    const fetchWisataDetail = async () => {
      try {
        if (!params.id) return;
        
        const docRef = doc(db, 'wisata', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const wisataData = {
            id: docSnap.id,
            ...docSnap.data()
          } as WisataDetail;
          
          console.log('Wisata data loaded:', wisataData);
          console.log('Lokasi field:', wisataData.lokasi);
          console.log('Alamat field:', wisataData.alamat);
          
          setWisata(wisataData);
        } else {
          console.log('Wisata tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetching wisata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWisataDetail();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
          <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">Memuat detail wisata...</p>
          </div>
          </div>
        </div>
      </main>
    );
  }

  if (!wisata) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
          <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 p-6 sm:p-8 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <div className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Wisata tidak ditemukan</div>
              <div className="text-xs sm:text-sm text-gray-600 mb-4">Data wisata yang Anda cari tidak tersedia</div>
              <Link
                href="/masyarakat/wisata-budaya/wisata"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Wisata
              </Link>
            </div>
          </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-32 sm:pb-36 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <HeaderCard 
          title="Wisata"
          subtitle="Destinasi Menarik"
          backUrl="/masyarakat/wisata-budaya/wisata"
          showBackButton={true}
        />

        {/* Hero Image Section - Modern Design */}
        <div className="mb-5 sm:mb-6 rounded-2xl sm:rounded-3xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200">
            {wisata.fotoUrl && !imageError ? (
              <>
                <img 
                  src={wisata.fotoUrl} 
                  alt={wisata.judul}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-base sm:text-lg font-medium">Foto</div>
                </div>
              </div>
            )}
            
            {/* Badges Overlay */}
            <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-col gap-1.5 sm:gap-2">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm">
                {wisata.kategori}
              </div>
              {wisata.jarak && (
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {wisata.jarak}
                </div>
              )}
            </div>
            
            {wisata.rating && (
              <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4">
                <div className="bg-white/90 backdrop-blur-sm px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-bold text-gray-800 text-sm sm:text-base">{wisata.rating}</span>
                </div>
              </div>
            )}

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 line-clamp-2">{wisata.judul}</h1>
              <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{wisata.alamat || wisata.lokasi}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Modern Pills */}
        <div className="mb-5 sm:mb-6 flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg ring-1 ring-gray-200">
          {[
            { id: "info", label: "Info", icon: (
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { id: "location", label: "Lokasi", icon: (
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            )},
            { id: "gallery", label: "Galeri", icon: (
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-5 sm:mb-6">
          {activeTab === "info" && (
            <div className="rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200 p-4 sm:p-5 md:p-6">
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Deskripsi */}
                <div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Deskripsi
                  </div>
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                    {wisata.deskripsi}
                  </p>
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Alamat Lengkap
                  </div>
                  <p className="text-gray-700 text-xs sm:text-sm flex items-start gap-2 bg-gray-50 p-3 sm:p-4 rounded-xl">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{wisata.alamat || wisata.lokasi}</span>
                  </p>
                </div>

                {/* Kategori */}
                <div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Kategori
                  </div>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {wisata.kategori}
                  </div>
                </div>

                {/* Jarak (jika ada) */}
                {wisata.jarak && (
                  <div>
                    <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Jarak
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm bg-gray-50 p-3 sm:p-4 rounded-xl font-medium">
                      {wisata.jarak} dari pusat desa
                    </p>
                  </div>
                )}

                {/* Rating (jika ada) */}
                {wisata.rating && (
                  <div>
                    <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Rating
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-3 sm:p-4 rounded-xl">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i}
                            className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${i < Math.floor(wisata.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-gray-300'}`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-gray-800">{wisata.rating}</span>
                      <span className="text-xs sm:text-sm text-gray-600">/ 5.0</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "location" && (
            <div className="rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200 p-4 sm:p-5 md:p-6">
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Lokasi GPS
                  </div>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                    <p className="text-gray-700 text-xs sm:text-sm font-mono break-all">{wisata.lokasi || 'Koordinat tidak tersedia'}</p>
                  </div>
                </div>

                {/* Leaflet Map */}
                {wisata.lokasi && (
                  <LeafletMapViewer 
                    location={wisata.lokasi}
                    title={wisata.judul}
                    address={wisata.alamat}
                  />
                )}

                {/* Google Maps Button */}
                <button 
                  onClick={() => {
                    const query = encodeURIComponent(`${wisata.judul}, ${wisata.alamat || wisata.lokasi}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Buka di Google Maps
                </button>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200 p-4 sm:p-5 md:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galeri Foto
                </div>

                {/* Check if there are any images */}
                {((wisata.galeri && wisata.galeri.length > 0) || wisata.fotoUrl) ? (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {/* Main Photo */}
                    {wisata.fotoUrl && !imageError && (
                      <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-2 ring-red-200">
                        <img 
                          src={wisata.fotoUrl} 
                          alt={wisata.judul}
                          onError={() => setImageError(true)}
                          className="w-full h-48 sm:h-56 md:h-64 object-cover"
                        />
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-center">
                          Foto Utama
                        </div>
                      </div>
                    )}

                    {/* Gallery Images */}
                    {wisata.galeri && wisata.galeri.length > 0 && (
                      <>
                        <div className="text-xs sm:text-sm font-semibold text-gray-700 mt-1 sm:mt-2">
                          Foto Lainnya ({wisata.galeri.length})
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          {wisata.galeri.map((imageUrl, index) => (
                            <div key={index} className="rounded-lg sm:rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105">
                              <img 
                                src={imageUrl} 
                                alt={`${wisata.judul} - Foto ${index + 1}`}
                                className="w-full h-32 sm:h-36 md:h-40 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl">
                    <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Belum ada foto</div>
                    <p className="text-xs text-gray-600">Foto belum tersedia untuk wisata ini</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 sm:space-y-3">
          <button 
            onClick={() => {
              const query = encodeURIComponent(`${wisata.judul}, ${wisata.alamat || wisata.lokasi}`);
              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            }}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 sm:gap-3"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Kunjungi Sekarang
          </button>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full bg-white/90 text-red-600 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-lg ring-1 ring-red-200 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Bagikan
              </button>
              
              {/* Share Dropdown Menu */}
              {showShareMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      const currentUrl = `${window.location.origin}/masyarakat/wisata-budaya/wisata/detail/${wisata.id}`;
                      const text = `Check out ${wisata.judul}! ${currentUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      setShowShareMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors border-b border-gray-100"
                  >
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">WhatsApp</div>
                      <div className="text-xs text-gray-500">Bagikan ke WhatsApp</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentUrl = `${window.location.origin}/masyarakat/wisata-budaya/wisata/detail/${wisata.id}`;
                      // Instagram doesn't have direct DM share, so we'll copy link
                      navigator.clipboard.writeText(currentUrl);
                      alert('Link berhasil disalin! Buka Instagram DM dan paste link ini.');
                      setShowShareMenu(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-pink-50 transition-colors"
                  >
                    <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">Instagram</div>
                      <div className="text-xs text-gray-500">Salin link untuk DM</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            <button className="bg-white/90 text-red-600 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold shadow-lg ring-1 ring-red-200 hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 sm:gap-2">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorit
            </button>
          </div>
        </div>
        </div>
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
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 11v9h14v-9" />
      <path d="M10 20v-6h4v6" />
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
      strokeWidth={1.7}
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
      strokeWidth={1.7}
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

function ImageIcon({ className }: IconProps) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function InfoIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function LocationIcon({ className }: IconProps) {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarIcon({ className }: IconProps) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MapIcon({ className }: IconProps) {
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
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function MapPinIcon({ className }: IconProps) {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function HeartIcon({ className }: IconProps) {
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
