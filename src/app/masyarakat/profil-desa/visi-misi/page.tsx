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
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard 
          title="Profil Desa" 
          backUrl="/masyarakat/profil-desa"
          showBackButton={true}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data visi & misi...</p>
          </div>
        ) : visiMisiData && visiMisiData.visi ? (
          <>
            {/* Visi Section */}
            <section className="mb-6">
              <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-6 shadow-xl ring-1 ring-red-200">
                <div className="mb-4 text-center text-sm font-semibold text-red-700">
                  Visi Desa
                </div>

                <div className="rounded-2xl bg-gray-50 p-6 shadow-inner">
                  {visiMisiData.visiImageUrl && (
                    <div className="mb-6">
                      <img
                        src={visiMisiData.visiImageUrl}
                        alt="Visi Desa"
                        className="w-full rounded-xl shadow-md"
                      />
                    </div>
                  )}
                  <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {visiMisiData.visi}
                  </p>
                </div>
              </div>
            </section>

            {/* Misi Section */}
            <section className="mb-6">
              <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-6 shadow-xl ring-1 ring-red-200">
                <div className="mb-4 text-center text-sm font-semibold text-red-700">
                  Misi Desa
                </div>

                <div className="rounded-2xl bg-gray-50 p-6 shadow-inner">
                  {visiMisiData.misiImageUrl && (
                    <div className="mb-6">
                      <img
                        src={visiMisiData.misiImageUrl}
                        alt="Misi Desa"
                        className="w-full rounded-xl shadow-md"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {visiMisiData.misi}
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
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
