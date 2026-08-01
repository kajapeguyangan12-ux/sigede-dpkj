"use client";

import { useState, useEffect } from "react";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';
import {
  getSejarahContent,
  subscribeToSejarahContent,
  type SejarahContent,
} from "../../../../lib/profilDesaService";

export default function SejarahDesaPage() {
  const [sejarahData, setSejarahData] = useState<SejarahContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSejarahData = async () => {
      try {
        const data = await getSejarahContent();
        setSejarahData(data);
      } catch (error) {
        console.error('Error loading sejarah data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSejarahData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSejarahContent((data) => {
      setSejarahData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-800">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <HeaderCard 
          title="Profil Desa" 
          backUrl="/masyarakat/profil-desa"
          showBackButton={true}
        />

        {loading ? (
          <div className="text-center py-12 max-w-4xl mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Memuat data sejarah...</p>
          </div>
        ) : sejarahData && sejarahData.deskripsi ? (
          <div className="max-w-5xl mx-auto">
            {/* Foto Sejarah Section */}
            {sejarahData.fotoUrl && (
              <section className="mb-6 sm:mb-8 lg:mb-10">
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl ring-1 ring-red-200">
                  <img
                    src={sejarahData.fotoUrl}
                    alt="Foto Sejarah Desa"
                    className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover"
                  />
                </div>
              </section>
            )}

            {/* Detail Sejarah Section */}
            <section className="mb-6 sm:mb-8 lg:mb-10">
              <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-5 sm:p-6 md:p-7 lg:p-8 shadow-xl ring-1 ring-red-200">
                <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Detail Sejarah Desa</h3>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6 lg:p-7 shadow-inner">
                  <div className="space-y-4 sm:space-y-5 lg:space-y-6 text-sm sm:text-base md:text-lg text-gray-700">
                    {/* Deskripsi Utama */}
                    {sejarahData.deskripsi && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Deskripsi:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.deskripsi}</p>
                      </div>
                    )}

                    {/* Asal Usul */}
                    {sejarahData.asalUsul && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Asal-usul:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.asalUsul}</p>
                      </div>
                    )}

                    {/* Tahun Berdiri */}
                    {sejarahData.tahunBerdiri && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Tahun Berdiri:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.tahunBerdiri}</p>
                      </div>
                    )}

                    {/* Hari Jadi */}
                    {sejarahData.hariJadi && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Hari Jadi:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.hariJadi}</p>
                      </div>
                    )}

                    {/* Tokoh Pendiri */}
                    {sejarahData.tokohPendiri && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Tokoh Pendiri:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.tokohPendiri}</p>
                      </div>
                    )}

                    {/* Perkembangan */}
                    {sejarahData.perkembangan && (
                      <div>
                        <p className="font-semibold text-gray-800 mb-2">Perkembangan:</p>
                        <p className="leading-relaxed whitespace-pre-line">{sejarahData.perkembangan}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl max-w-4xl mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data sejarah</p>
            <p className="text-gray-500">Data sejarah akan ditampilkan setelah admin mengisinya</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
