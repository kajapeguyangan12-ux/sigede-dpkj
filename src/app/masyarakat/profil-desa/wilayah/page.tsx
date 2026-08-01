"use client";

import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';
import { useState, useEffect } from "react";
import {
  getProfilDesa,
  subscribeToProfilDesa,
  getWilayahContent,
  subscribeToWilayahContent,
  type ProfilDesaData,
  type WilayahContent,
} from "../../../../lib/profilDesaService";

export default function Page() {
  const [profilData, setProfilData] = useState<ProfilDesaData | null>(null);
  const [wilayahData, setWilayahData] = useState<WilayahContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilDesaData, wilayahContent] = await Promise.all([
          getProfilDesa(),
          getWilayahContent()
        ]);
        setProfilData(profilDesaData);
        setWilayahData(wilayahContent);
      } catch (error) {
        console.error('Error loading profil desa data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribeProfil = subscribeToProfilDesa((data: ProfilDesaData | null) => {
      setProfilData(data);
      setLoading(false);
    });

    const unsubscribeWilayah = subscribeToWilayahContent((data: WilayahContent | null) => {
      setWilayahData(data);
      setLoading(false);
    });

    return () => {
      unsubscribeProfil();
      unsubscribeWilayah();
    };
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
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Memuat data wilayah...</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Map Section */}
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 shadow-lg bg-white">
                {wilayahData?.fotoUrl ? (
                  <img
                    src={wilayahData.fotoUrl}
                    alt="Peta Wilayah"
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl lg:text-6xl">🗺️</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            {wilayahData?.deskripsi && (
              <div className="mb-6 sm:mb-8 lg:mb-10 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-5 sm:p-6 md:p-7 lg:p-8 shadow-lg ring-1 ring-gray-200">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Deskripsi Wilayah
                  </h3>
                  <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                    {wilayahData.deskripsi}
                  </div>
                </div>
              </div>
            )}

            {/* Dusun Data Table */}
            {wilayahData?.dusunData && wilayahData.dusunData.length > 0 && (
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200 overflow-x-auto">
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800 mb-4 sm:mb-5 lg:mb-6 text-center">
                    Data Dusun
                  </h3>
                  <table className="w-full text-xs sm:text-sm md:text-base border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">NO</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Dusun</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Luas</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Keliling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wilayahData.dusunData.map((dusun, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">{index + 1}</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-700">{dusun.namaDusun}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">{dusun.luasDusun}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">{dusun.garisKeliling}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Profile Data Table */}
            {profilData?.wilayah && (
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800 mb-4 sm:mb-5 lg:mb-6 text-center">
                    Informasi Wilayah
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base">
                    {profilData.wilayah.namaDesa && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Nama Desa:</span>
                        <span className="text-gray-600">{profilData.wilayah.namaDesa}</span>
                      </div>
                    )}
                    {profilData.wilayah.kecamatan && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Kecamatan:</span>
                        <span className="text-gray-600">{profilData.wilayah.kecamatan}</span>
                      </div>
                    )}
                    {profilData.wilayah.kabupaten && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Kabupaten:</span>
                        <span className="text-gray-600">{profilData.wilayah.kabupaten}</span>
                      </div>
                    )}
                    {profilData.wilayah.provinsi && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Provinsi:</span>
                        <span className="text-gray-600">{profilData.wilayah.provinsi}</span>
                      </div>
                    )}
                    {profilData.wilayah.kodePos && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Kode POS:</span>
                        <span className="text-gray-600">{profilData.wilayah.kodePos}</span>
                      </div>
                    )}
                    {profilData.wilayah.luasWilayah && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Luas Wilayah:</span>
                        <span className="text-gray-600">{profilData.wilayah.luasWilayah}</span>
                      </div>
                    )}
                    {profilData.wilayah.jumlahDusun && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Jumlah Dusun:</span>
                        <span className="text-gray-600">{profilData.wilayah.jumlahDusun}</span>
                      </div>
                    )}
                    {profilData.wilayah.jumlahRW && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Jumlah RW:</span>
                        <span className="text-gray-600">{profilData.wilayah.jumlahRW}</span>
                      </div>
                    )}
                    {profilData.wilayah.jumlahRT && (
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold text-gray-700">Jumlah RT:</span>
                        <span className="text-gray-600">{profilData.wilayah.jumlahRT}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
