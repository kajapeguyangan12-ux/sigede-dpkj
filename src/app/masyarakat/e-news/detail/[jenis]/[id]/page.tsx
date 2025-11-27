"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import HeaderCard from "../../../../../components/HeaderCard";
import BottomNavigation from '../../../../../components/BottomNavigation';
import {
  getENewsItemById,
  type ENewsItem
} from "../../../../../../lib/enewsService";
import { ChevronLeft, Calendar, MapPin, Share2 } from "lucide-react";

type ValidJenis = "berita" | "pengumuman";

export default function ENewsDetailPage() {
  const params = useParams<{ jenis?: string; id?: string }>();
  const jenisParam = Array.isArray(params?.jenis) ? params?.jenis[0] : params?.jenis;
  const idParam = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [newsItem, setNewsItem] = useState<ENewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNewsItem = async () => {
      if (!jenisParam || !idParam) {
        setError("Data E-News tidak ditemukan.");
        setLoading(false);
        return;
      }

      if (jenisParam !== "berita" && jenisParam !== "pengumuman") {
        setError("Jenis E-News tidak valid.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const item = await getENewsItemById(idParam, jenisParam as ValidJenis);
        if (!item) {
          setError("E-News tidak ditemukan.");
          setNewsItem(null);
        } else {
          setNewsItem(item);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading e-news detail:", err);
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    loadNewsItem();
  }, [jenisParam, idParam]);

  const formattedDate = useMemo(() => {
    if (!newsItem?.tanggal) {
      return "-";
    }

    const dateValue = new Date(newsItem.tanggal);
    if (Number.isNaN(dateValue.valueOf())) {
      return newsItem.tanggal;
    }

    return dateValue.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [newsItem?.tanggal]);

  const renderHero = () => {
    if (!newsItem?.gambar) {
      return (
        <div className="h-full w-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">{newsItem?.jenis === 'berita' ? '📰' : '📢'}</div>
            <div className="text-blue-600 font-bold text-lg">E-News</div>
            <div className="text-sm text-blue-500 mt-1">Desa Peguyangan Kaja</div>
          </div>
        </div>
      );
    }

    if (newsItem.gambar.startsWith("/logo/")) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Image
            src={newsItem.gambar}
            alt={newsItem.judul}
            width={160}
            height={160}
            className="opacity-90"
          />
        </div>
      );
    }

    if (newsItem.gambar.startsWith("http") || newsItem.gambar.startsWith("data:")) {
      return (
        <img
          src={newsItem.gambar}
          alt={newsItem.judul}
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <div className="h-full w-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">{newsItem?.jenis === 'berita' ? '📰' : '📢'}</div>
          <div className="text-blue-600 font-bold text-lg">E-News</div>
          <div className="text-sm text-blue-500 mt-1">Desa Peguyangan Kaja</div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full pb-24 pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        <HeaderCard title="E-News Detail" backUrl="/masyarakat/e-news" showBackButton={true} />

        {loading ? (
          <div className="mt-4 sm:mt-5 md:mt-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto">
            <div className="h-48 sm:h-64 md:h-80 lg:h-96 w-full animate-pulse rounded-2xl sm:rounded-3xl bg-gray-200" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {[1, 2, 3].map((key) => (
                <div key={key} className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-5 lg:p-6 shadow-sm animate-pulse">
                  <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
                  <div className="h-20 w-full rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="mt-8 sm:mt-10 md:mt-12 max-w-2xl mx-auto">
            <div className="rounded-2xl sm:rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8 lg:p-10 text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">❌</div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-red-600 mb-2">Data tidak tersedia</h2>
              <p className="text-sm sm:text-base text-red-500 mb-6">{error}</p>
              <Link
                href="/masyarakat/e-news"
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-2 sm:px-8 sm:py-3 text-white text-sm sm:text-base font-semibold hover:bg-red-600 transition-colors"
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
                Kembali ke E-News
              </Link>
            </div>
          </div>
        ) : newsItem ? (
          <div className="space-y-6 sm:space-y-8 lg:space-y-10 max-w-6xl mx-auto">
            {/* Hero Image */}
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-200 shadow-lg sm:shadow-xl">
              {renderHero()}
            </div>

            {/* Desktop: 2 Column Layout, Mobile: Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {/* Left Column - Main Content (2/3 on desktop) */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {/* Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 leading-tight">
                    {newsItem.judul}
                  </h1>
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-5">
                    {newsItem.jenis === 'berita' ? 'Deskripsi Kegiatan' : 'Deskripsi Pengumuman'}
                  </h2>
                  <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed whitespace-pre-wrap">
                      {newsItem.deskripsi || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar (1/3 on desktop) */}
              <div className="space-y-6 sm:space-y-8">
                {/* Badge dan Share */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 sm:px-4 py-1.5 sm:py-2">
                      <span className={`text-xs sm:text-sm lg:text-base font-semibold ${
                        newsItem.jenis === 'berita' ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        {newsItem.jenis === 'berita' ? '📰 Berita' : '📢 Pengumuman'}
                      </span>
                    </div>
                    <button className="p-2 sm:p-2.5 lg:p-3 rounded-full hover:bg-gray-200 transition-colors">
                      <Share2 size={18} className="text-gray-600 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </button>
                  </div>
                </div>

                {/* Meta Information */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 shadow-sm border border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5">Informasi</h3>
                  <div className="space-y-4 sm:space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50">
                        <Calendar className="text-blue-600 flex-shrink-0" size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          {newsItem.jenis === 'berita' ? 'Tanggal Kegiatan' : 'Tanggal Pengumuman'}
                        </p>
                        <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{formattedDate}</p>
                      </div>
                    </div>

                    {newsItem.jenis === 'berita' && newsItem.lokasi && (
                      <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                        <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50">
                          <MapPin className="text-blue-600 flex-shrink-0" size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">Lokasi Kegiatan</p>
                          <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{newsItem.lokasi}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <BottomNavigation />
    </main>
  );
}
