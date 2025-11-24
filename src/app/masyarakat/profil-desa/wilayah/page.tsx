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
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard 
          title="Profil Desa" 
          backUrl="/masyarakat/profil-desa"
          showBackButton={true}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data wilayah...</p>
          </div>
        ) : (
          <>
            {/* Map Section */}
            <div className="mb-6">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
                {wilayahData?.fotoUrl ? (
                  <img
                    src={wilayahData.fotoUrl}
                    alt="Peta Wilayah"
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-4xl">🗺️</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            {wilayahData?.deskripsi && (
              <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-sm p-5 shadow-lg ring-1 ring-gray-200">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Deskripsi Wilayah
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {wilayahData.deskripsi}
                  </div>
                </div>
              </div>
            )}

            {/* Dusun Data Table */}
            {wilayahData?.dusunData && wilayahData.dusunData.length > 0 && (
              <div className="mb-6">
                <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                    Data Dusun
                  </h3>
                  <table className="w-full text-xs border-collapse">
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
              <div className="mb-6">
                <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-4 shadow-lg ring-1 ring-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                    Informasi Wilayah
                  </h3>
                  <div className="space-y-2 text-xs">
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
          </>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
