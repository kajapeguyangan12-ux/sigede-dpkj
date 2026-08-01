"use client";

import { useState, useEffect } from "react";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from "../../../components/BottomNavigation";
import {
  getVisiMisiContent,
  subscribeToVisiMisiContent,
  type VisiMisiContent,
} from "../../../../lib/profilDesaService";

export default function VisiMisiDesaPage() {
  const [visiMisiData, setVisiMisiData] = useState<VisiMisiContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisiMisiData = async () => {
      try {
        const data = await getVisiMisiContent();
        setVisiMisiData(data);
      } catch (error) {
        console.error("Error loading visi misi data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVisiMisiData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToVisiMisiContent((data) => {
      setVisiMisiData(data);
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
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Memuat data visi & misi...</p>
          </div>
        ) : visiMisiData && visiMisiData.visi ? (
          <div className="max-w-5xl mx-auto">
            {/* Visi Section */}
            <section className="mb-6 sm:mb-8 lg:mb-10">
              <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-5 sm:p-6 md:p-7 lg:p-8 shadow-xl ring-1 ring-red-200">
                <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Visi Desa</h3>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6 lg:p-7 shadow-inner">
                  {visiMisiData.visiImageUrl && (
                    <div className="mb-6">
                      <img
                        src={visiMisiData.visiImageUrl}
                        alt="Visi Desa"
                        className="w-full h-auto rounded-xl shadow-md object-contain"
                      />
                    </div>
                  )}
                  <p className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                    {visiMisiData.visi}
                  </p>
                </div>
              </div>
            </section>

            {/* Misi Section */}
            <section className="mb-6 sm:mb-8 lg:mb-10">
              <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-5 sm:p-6 md:p-7 lg:p-8 shadow-xl ring-1 ring-red-200">
                <div className="mb-4 sm:mb-5 lg:mb-6 flex items-center gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Misi Desa</h3>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 sm:p-5 md:p-6 lg:p-7 shadow-inner">
                  {visiMisiData.misiImageUrl && (
                    <div className="mb-6">
                      <img
                        src={visiMisiData.misiImageUrl}
                        alt="Misi Desa"
                        className="w-full h-auto rounded-xl shadow-md object-contain"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {visiMisiData.misi}
                  </p>
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
            <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data visi & misi</p>
            <p className="text-gray-500">Data visi & misi akan ditampilkan setelah admin mengisinya</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
