"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../../lib/firebase';
import HeaderCard from "../../../../../components/HeaderCard";
import BottomNavigation from '../../../../../components/BottomNavigation';
import dynamic from 'next/dynamic';

// Dynamic import untuk Leaflet Map dengan SSR disabled
const LeafletMapViewer = dynamic(() => import('@/components/LeafletMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-500 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600 font-medium">Memuat peta...</p>
      </div>
    </div>
  )
});

type BudayaDetail = {
  id: string;
  judul: string;
  kategori: string;
  alamat?: string;
  lokasi?: string;
  deskripsi: string;
  sejarah?: string;
  fotoUrl?: string;
  galeri?: string[]; // Gallery images
  createdAt?: any;
  updatedAt?: any;
};

export default function BudayaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [budaya, setBudaya] = useState<BudayaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "history" | "location" | "gallery">("info");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchBudayaDetail = async () => {
      try {
        if (!params.id) return;
        
        const docRef = doc(db, 'budaya', params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBudaya({
            id: docSnap.id,
            ...docSnap.data()
          } as BudayaDetail);
        } else {
          console.log('Budaya tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetching budaya:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudayaDetail();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat detail budaya...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!budaya) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
          <div className="text-center py-12">
            <div className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-purple-200 backdrop-blur-sm">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">Budaya tidak ditemukan</div>
              <div className="text-sm text-gray-600 mb-4">Data budaya yang Anda cari tidak tersedia</div>
              <Link
                href="/masyarakat/wisata-budaya/budaya"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Budaya
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: budaya.judul,
        text: budaya.deskripsi,
        url: window.location.href,
      });
    }
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {/* Header Card */}
        <HeaderCard 
          title="Detail Budaya"
          subtitle={budaya.judul}
          backUrl="/masyarakat/wisata-budaya/budaya"
          showBackButton={true}
        />

        {/* Hero Image Section */}
        <div className="mb-6 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-purple-200">
          <div className="relative h-80">
            {budaya.fotoUrl && !imageError ? (
              <img 
                src={budaya.fotoUrl} 
                alt={budaya.judul}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="mx-auto h-20 w-20 mb-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="text-lg font-medium">Foto Budaya</div>
                </div>
              </div>
            )}
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent"></div>
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm ring-2 ring-white/30">
                {budaya.kategori}
              </div>
            </div>
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">{budaya.judul}</h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 p-1.5 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200">
          {[
            { id: "info", label: "Info", icon: "ℹ️" },
            { id: "history", label: "Sejarah", icon: "📜" },
            ...(budaya.lokasi ? [{ id: "location", label: "Lokasi", icon: "📍" }] : []),
            { id: "gallery", label: "Galeri", icon: "🖼️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-purple-50"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-6 space-y-4">
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Deskripsi */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Deskripsi</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{budaya.deskripsi}</p>
              </div>

              {/* Kategori */}
              <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">Kategori</span>
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {budaya.kategori}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Sejarah & Asal Usul</h3>
              </div>
              {budaya.sejarah ? (
                <p className="text-gray-700 leading-relaxed">{budaya.sejarah}</p>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📜</div>
                  <p className="text-gray-500 text-sm">Informasi sejarah belum tersedia</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "location" && budaya.lokasi && (
            <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200 p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Lokasi GPS
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <p className="text-gray-700 text-sm font-mono">{budaya.lokasi}</p>
                  </div>
                </div>

                {/* Leaflet Map */}
                <LeafletMapViewer 
                  location={budaya.lokasi}
                  title={budaya.judul}
                  address={budaya.alamat}
                />

                {/* Google Maps Button */}
                <button 
                  onClick={() => {
                    const query = encodeURIComponent(`${budaya.judul}${budaya.alamat ? ', ' + budaya.alamat : ''}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Buka di Google Maps
                </button>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Foto Budaya</h3>
              </div>
              
              {/* Check if there are any images */}
              {((budaya.galeri && budaya.galeri.length > 0) || budaya.fotoUrl) ? (
                <div className="space-y-4">
                  {/* Main Photo */}
                  {budaya.fotoUrl && !imageError && (
                    <div className="rounded-2xl overflow-hidden shadow-lg ring-2 ring-purple-200">
                      <img 
                        src={budaya.fotoUrl} 
                        alt={budaya.judul}
                        onError={() => setImageError(true)}
                        className="w-full h-64 object-cover"
                      />
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-xs font-semibold text-center">
                        Foto Utama
                      </div>
                    </div>
                  )}

                  {/* Gallery Images */}
                  {budaya.galeri && budaya.galeri.length > 0 && (
                    <>
                      <div className="text-sm font-semibold text-gray-700 mt-2">
                        Foto Lainnya ({budaya.galeri.length})
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {budaya.galeri.map((imageUrl, index) => (
                          <div key={index} className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <img 
                              src={imageUrl} 
                              alt={`${budaya.judul} - Foto ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl">
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="text-gray-600 text-sm font-medium">Foto belum tersedia</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white py-4 px-6 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Pelajari Lebih Lanjut
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleShare}
              className="bg-white/90 text-purple-600 py-3 px-4 rounded-xl text-sm font-bold shadow-lg ring-1 ring-purple-200 hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Bagikan
            </button>
            <button className="bg-white/90 text-purple-600 py-3 px-4 rounded-xl text-sm font-bold shadow-lg ring-1 ring-purple-200 hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorit
            </button>
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

function CultureIcon({ className }: IconProps) {
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
      <path d="M12 3 5 9h14z" />
      <path d="M6 9v9h12V9" />
      <path d="M9 18v3h6v-3" />
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

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
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

function CalendarIcon({ className }: IconProps) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
