"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import HeaderCard from "../../components/HeaderCard";
import BottomNavigation from '../../components/BottomNavigation';
import { getRegulasiDesa, type RegulasiDesa } from '../../../lib/regulasiService';
import { X, Eye } from 'lucide-react';

export default function RegulasiPage() {
  const [regulasiData, setRegulasiData] = useState<RegulasiDesa[]>([]);
  const [selectedRegulasi, setSelectedRegulasi] = useState<RegulasiDesa | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRegulasiData = useMemo(() => async () => {
    try {
      const data = await getRegulasiDesa();
      // Filter hanya regulasi yang aktif
      const activeRegulasi = data.filter(item => item.status === 'aktif');
      setRegulasiData(activeRegulasi);
    } catch (error) {
      console.error('Error fetching regulasi data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegulasiData();
  }, [fetchRegulasiData]);

  const openDetailModal = (regulasi: RegulasiDesa) => {
    setSelectedRegulasi(regulasi);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRegulasi(null);
  };

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
        <div className="mx-auto w-full max-w-md px-3 sm:px-4 pb-24 sm:pb-28 pt-4">
          <HeaderCard 
            title="Regulasi Desa" 
            subtitle="Peraturan & Kebijakan"
            backUrl="/masyarakat/home"
            showBackButton={true}
          />
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Memuat data regulasi...</div>
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  if (regulasiData.length === 0) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
        <div className="mx-auto w-full max-w-md px-3 sm:px-4 pb-24 sm:pb-28 pt-4">
          <HeaderCard 
            title="Regulasi Desa" 
            subtitle="Peraturan & Kebijakan"
            backUrl="/masyarakat/home"
            showBackButton={true}
          />
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="text-gray-500 mb-2">Belum ada regulasi yang tersedia</div>
              <div className="text-sm text-gray-400">Regulasi akan ditampilkan setelah ditambahkan oleh admin</div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </main>
    );
  }

  return (
    <>
      <main className="min-h-[100svh] bg-gradient-to-b from-red-50 to-gray-50 text-gray-800">
        <div className="mx-auto w-full max-w-md px-3 sm:px-4 pb-24 sm:pb-28 pt-4">
          <HeaderCard 
            title="Regulasi Desa" 
            subtitle="Peraturan & Kebijakan"
            backUrl="/masyarakat/home"
            showBackButton={true}
          />

          {/* Regulasi Cards */}
          <div className="space-y-3 sm:space-y-4">
            {regulasiData.map((regulasi) => (
              <div key={regulasi.id} className="rounded-3xl bg-white/90 backdrop-blur-sm p-4 shadow-xl ring-1 ring-red-200">
                <div className="space-y-4">
                  {/* Judul Regulasi */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Nama Regulasi</h3>
                    <p className="text-xs sm:text-sm text-gray-700 overflow-hidden text-ellipsis line-clamp-2">{regulasi.judul}</p>
                  </div>

                  {/* Deskripsi Regulasi */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Deskripsi Regulasi</h3>
                    <p className="text-xs sm:text-sm text-gray-700 overflow-hidden text-ellipsis line-clamp-3">{regulasi.deskripsi}</p>
                  </div>

                  {/* Status dan Detail Button */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">Status :</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        regulasi.status === 'aktif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {regulasi.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => openDetailModal(regulasi)}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNavigation />
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRegulasi && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Detail Regulasi</h2>
              <button
                onClick={closeDetailModal}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100/80 backdrop-blur-sm text-gray-600 hover:bg-gray-200/80 transition-all duration-200 hover:scale-105"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-4">
                {/* Judul */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Judul Regulasi</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedRegulasi.judul}
                  </div>
                </div>

                {/* Nomor dan Tahun */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Nomor</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {selectedRegulasi.nomor}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Tahun</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {selectedRegulasi.tahun}
                    </div>
                  </div>
                </div>

                {/* Tentang */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Tentang</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedRegulasi.tentang}
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Deskripsi Regulasi</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {selectedRegulasi.deskripsi}
                  </div>
                </div>

                {/* Status dan Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedRegulasi.status === 'aktif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedRegulasi.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Tanggal Ditetapkan</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                      {new Date(selectedRegulasi.tanggalDitetapkan).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Isi Lengkap */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Isi Lengkap Regulasi</label>
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                    {selectedRegulasi.isiLengkap}
                  </div>
                </div>

                {/* PDF Download */}
                {selectedRegulasi.filePdf && (
                  <div className="text-center pt-4">
                    <a
                      href={selectedRegulasi.filePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      📄 Unduh PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
