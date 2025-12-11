"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import { getPublishedENewsItems, subscribeToPublishedENews, type ENewsItem } from "../../../lib/enewsService";
import { ChevronRight, Calendar, MapPin } from "lucide-react";

export default function ENewsPage() {
  const [activeTab, setActiveTab] = useState<'berita' | 'pengumuman'>('berita');
  const [newsData, setNewsData] = useState<ENewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading e-news data...');
        setLoading(true);
        const data = await getPublishedENewsItems();
        console.log('E-news data loaded:', data);
        
        // Debug: Log image URLs
        data.forEach((item, index) => {
          console.log(`📸 E-News #${index + 1}:`, {
            id: item.id,
            jenis: item.jenis,
            judul: item.judul,
            gambar: item.gambar,
            hasImage: !!item.gambar,
            isDefaultImage: item.gambar === '/logo/default.png'
          });
        });
        
        setNewsData(data);
        setError(null);
      } catch (error) {
        console.error('Error loading e-news data:', error);
        setError(error instanceof Error ? error.message : 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToPublishedENews((items) => {
      console.log('Received real-time update:', items);
      setNewsData(items);
    });

    return () => unsubscribe();
  }, []);

  const beritaData = useMemo(() => newsData.filter(item => item.jenis === 'berita'), [newsData]);
  const pengumumanData = useMemo(() => newsData.filter(item => item.jenis === 'pengumuman'), [newsData]);

  const currentData = useMemo(() => activeTab === 'berita' ? beritaData : pengumumanData, [activeTab, beritaData, pengumumanData]);

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard 
          title="E-News" 
          subtitle="Berita & Pengumuman"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />

        {/* Tab Navigation */}
        <div className="px-0 mb-4 sm:mb-5 md:mb-6 lg:mb-8">
          <div className="flex gap-2 sm:gap-3 rounded-2xl bg-gray-100 p-1 max-w-md lg:max-w-lg mx-auto">
            <button
              onClick={() => setActiveTab('berita')}
              className={`flex-1 rounded-xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 ${
                activeTab === 'berita'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Berita
              <span className="ml-1 font-normal text-[10px] sm:text-xs lg:text-sm">({beritaData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('pengumuman')}
              className={`flex-1 rounded-xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm lg:text-base font-semibold transition-all duration-200 ${
                activeTab === 'pengumuman'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Pengumuman
              <span className="ml-1 font-normal text-[10px] sm:text-xs lg:text-sm">({pengumumanData.length})</span>
            </button>
          </div>
        </div>

        {/* News Cards - Mobile: Single column, Desktop: Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {error && (
            <div className="col-span-full rounded-2xl bg-red-50 border border-red-200 p-3 sm:p-4 text-red-700 mx-0">
              <p className="font-semibold text-xs sm:text-sm">⚠️ Error: {error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="col-span-full text-center py-12 lg:py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-blue-100 mb-4">
                <div className="animate-spin h-6 w-6 lg:h-8 lg:w-8 border-2 lg:border-3 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-600 font-medium text-sm lg:text-base">Memuat data...</p>
            </div>
          ) : currentData.length > 0 ? (
            currentData.map((item) => (
              <Link
                key={item.id}
                href={`/masyarakat/e-news/detail/${item.jenis}/${item.id}`}
              >
                <div className="group rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 mx-0 h-full flex flex-col">
                  {/* Image Container */}
                  <div className="relative h-40 sm:h-48 md:h-52 lg:h-56 xl:h-60 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                    {item.gambar && item.gambar !== '/logo/default.png' ? (
                      <>
                        <img
                          src={item.gambar}
                          alt={item.judul}
                          loading="eager"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('show-fallback-enews');
                            }
                          }}
                        />
                        {/* Fallback icon - shown if image fails to load */}
                        <div className="fallback-icon-enews w-full h-full hidden items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                          <div className="text-center">
                            <div className="text-5xl sm:text-6xl mb-2">
                              {item.jenis === 'berita' ? '📰' : '📢'}
                            </div>
                            <p className={`text-sm font-semibold ${
                              item.jenis === 'berita' ? 'text-red-600' : 'text-purple-600'
                            }`}>
                              {item.jenis === 'berita' ? 'Berita' : 'Pengumuman'}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                        <div className="text-center">
                          <div className="text-5xl sm:text-6xl mb-2">
                            {item.jenis === 'berita' ? '📰' : '📢'}
                          </div>
                          <p className={`text-sm font-semibold ${
                            item.jenis === 'berita' ? 'text-red-600' : 'text-purple-600'
                          }`}>
                            {item.jenis === 'berita' ? 'Berita' : 'Pengumuman'}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 bg-white rounded-full px-2 sm:px-3 lg:px-4 py-1 lg:py-1.5 shadow-md">
                      <span className={`text-[10px] sm:text-xs lg:text-sm font-semibold ${
                        item.jenis === 'berita' ? 'text-red-600' : 'text-purple-600'
                      }`}>
                        {item.jenis === 'berita' ? '📰 Berita' : '📢 Pengumuman'}
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className={`text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-2 lg:mb-3 line-clamp-2 transition-colors ${
                      item.jenis === 'berita' ? 'group-hover:text-red-600' : 'group-hover:text-purple-600'
                    }`}>
                      {item.judul}
                    </h3>

                    {/* Meta Information */}
                    {/* Meta Information */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-600 mb-2 sm:mb-3">
                      <Calendar size={12} className="flex-shrink-0 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                      <span className="truncate">
                        {(() => {
                          try {
                            const date = new Date(item.tanggal);
                            return date.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                          } catch {
                            return item.tanggal;
                          }
                        })()}
                      </span>
                    </div>

                    {/* Location for berita */}
                    {item.jenis === 'berita' && item.lokasi && (
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-600 mb-2 sm:mb-3">
                        <MapPin size={12} className="flex-shrink-0 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                        <span className="truncate">{item.lokasi}</span>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-xs sm:text-sm lg:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-2 flex-1">
                      {item.deskripsi || 'Tidak ada deskripsi'}
                    </p>

                    {/* CTA Button */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className={`text-[10px] sm:text-xs lg:text-sm font-semibold ${
                        item.jenis === 'berita' ? 'text-red-600' : 'text-purple-600'
                      }`}>
                        Lihat Selengkapnya
                      </span>
                      <ChevronRight 
                        size={16} 
                        className={`group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                          item.jenis === 'berita' ? 'text-red-600' : 'text-purple-600'
                        }`} 
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 lg:py-16">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4">{activeTab === 'berita' ? '📰' : '📢'}</div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2">
                Belum ada {activeTab === 'berita' ? 'berita' : 'pengumuman'}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-4">
                {activeTab === 'berita' ? 'Berita' : 'Pengumuman'} akan muncul di sini setelah admin mempublikasikannya.
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
      
      {/* CSS for fallback handling */}
      <style jsx>{`
        .show-fallback-enews .fallback-icon-enews {
          display: flex !important;
        }
      `}</style>
    </main>
  );
}
