'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UMKM {
  id: string;
  namaUsaha: string;
  namaPemilik: string;
  kategori: string;
  deskripsi: string;
  alamat: string;
  noTelepon: string;
  email?: string;
  jamOperasional?: string;
  hargaRataRata?: string;
  fotoUsaha?: string[];
  status: 'aktif' | 'tidak_aktif' | 'pending';
  tanggalDaftar: any;
  rating?: number;
  jumlahProduk?: number;
}

const STATUS_CONFIG = {
  aktif: {
    label: 'Aktif',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅'
  },
  tidak_aktif: {
    label: 'Ditolak',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌'
  },
  pending: {
    label: 'Menunggu Verifikasi',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: '⏳'
  }
};

export default function TokoSayaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [umkmList, setUmkmList] = useState<UMKM[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUMKM, setSelectedUMKM] = useState<UMKM | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Block access for external users
      if (user.role === 'warga_luar_dpkj') {
        alert('Akses ditolak. Fitur ini hanya tersedia untuk warga lokal DPKJ.');
        router.push('/masyarakat/e-umkm');
        return;
      }
      fetchMyUMKM();
    }
  }, [user, router]);

  const fetchMyUMKM = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        console.log('No user found, layout will handle redirect');
        setLoading(false);
        return;
      }

      console.log('Fetching UMKM for userId:', user.uid);

      const q = query(
        collection(db, 'e-umkm'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedUMKM: UMKM[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Found UMKM:', doc.id, data); // Debug log
        fetchedUMKM.push({
          id: doc.id,
          ...data
        } as UMKM);
      });
      
      console.log('Total UMKM found:', fetchedUMKM.length); // Debug log
      setUmkmList(fetchedUMKM);
    } catch (error) {
      console.error('Error fetching UMKM:', error);
      alert('Gagal memuat data UMKM');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (umkm: UMKM) => {
    setSelectedUMKM(umkm);
    setShowDetailModal(true);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 sm:px-4 py-4 sm:py-6 shadow-xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/masyarakat/e-umkm">
                <button className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Toko Saya</h1>
                <p className="text-red-100 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">UMKM yang Anda daftarkan</p>
              </div>
              <Link href="/masyarakat/e-umkm/create">
                <button className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-red-600 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-red-50 transition-all shadow-lg whitespace-nowrap">
                  + Buat Baru
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Info Card */}
          {umkmList.length === 0 && !loading && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-blue-900 mb-1 text-sm sm:text-base">Belum Ada UMKM</h4>
                <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3">
                  Anda belum mendaftarkan UMKM. Klik tombol di bawah untuk mendaftarkan UMKM Anda.
                </p>
                <Link href="/masyarakat/e-umkm/create">
                  <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all">
                    Daftarkan UMKM
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
            </div>
          ) : (
            /* UMKM List */
            <div className="space-y-3 sm:space-y-4">
              {umkmList.map((umkm) => (
                <div
                  key={umkm.id}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 flex-shrink-0 overflow-hidden">
                        {umkm.fotoUsaha && umkm.fotoUsaha[0] ? (
                          <img 
                            src={umkm.fotoUsaha[0]} 
                            alt={umkm.namaUsaha}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1 sm:mb-2">
                          <div className="flex-1 min-w-0 mr-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{umkm.namaUsaha}</h3>
                            <p className="text-xs sm:text-sm text-gray-500">{umkm.kategori}</p>
                          </div>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[umkm.status].bgColor} ${STATUS_CONFIG[umkm.status].textColor} border-2 ${STATUS_CONFIG[umkm.status].borderColor} whitespace-nowrap flex items-center gap-1`}>
                            <span className="hidden sm:inline">{STATUS_CONFIG[umkm.status].icon}</span>
                            <span className="text-[10px] sm:text-xs">{STATUS_CONFIG[umkm.status].label}</span>
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{umkm.deskripsi}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium text-[10px] sm:text-xs">{umkm.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium text-[10px] sm:text-xs">{umkm.jumlahProduk || 0} Produk</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetail(umkm)}
                            className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all"
                          >
                            Lihat Detail
                          </button>
                          {umkm.status === 'aktif' && (
                            <>
                              <Link href={`/masyarakat/e-umkm/toko-saya/produk?umkmId=${umkm.id}`} className="flex-1">
                                <button className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all">
                                  Kelola Produk
                                </button>
                              </Link>
                              <Link href={`/masyarakat/e-umkm/toko-saya/tambah-produk?umkmId=${umkm.id}`} className="flex-1">
                                <button className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all">
                                  + Produk
                                </button>
                              </Link>
                            </>
                          )}
                          {umkm.status === 'pending' && (
                            <span className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-100 text-yellow-700 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl text-center border-2 border-yellow-300">
                              Menunggu Verifikasi
                            </span>
                          )}
                          {umkm.status === 'tidak_aktif' && (
                            <Link href="/masyarakat/e-umkm/create" className="flex-1">
                              <button className="w-full px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all">
                                Daftar Ulang
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedUMKM && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedUMKM.namaUsaha}</h2>
                    <p className="text-red-100 text-sm">Detail Informasi UMKM</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
                  <span className="text-sm font-bold text-gray-600">Status UMKM:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${STATUS_CONFIG[selectedUMKM.status].bgColor} ${STATUS_CONFIG[selectedUMKM.status].textColor} border-2 ${STATUS_CONFIG[selectedUMKM.status].borderColor} flex items-center gap-2`}>
                    <span>{STATUS_CONFIG[selectedUMKM.status].icon}</span>
                    {STATUS_CONFIG[selectedUMKM.status].label}
                  </span>
                </div>

                {/* Photos */}
                {selectedUMKM.fotoUsaha && selectedUMKM.fotoUsaha.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Foto Usaha
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedUMKM.fotoUsaha.map((foto, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={foto}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-40 object-cover rounded-2xl shadow-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informasi Dasar
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Nama Pemilik</p>
                      <p className="text-base font-bold text-gray-900">{selectedUMKM.namaPemilik}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Kategori</p>
                      <p className="text-base font-bold text-gray-900">{selectedUMKM.kategori}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">No. Telepon</p>
                      <p className="text-base font-bold text-gray-900">{selectedUMKM.noTelepon}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Email</p>
                      <p className="text-base font-bold text-gray-900">{selectedUMKM.email || '-'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Alamat</p>
                      <p className="text-base font-bold text-gray-900">{selectedUMKM.alamat}</p>
                    </div>
                  </div>
                </div>

                {/* Operational Info */}
                {(selectedUMKM.jamOperasional || selectedUMKM.hargaRataRata) && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Informasi Operasional
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedUMKM.jamOperasional && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-500 font-semibold mb-1">Jam Operasional</p>
                          <p className="text-base font-bold text-gray-900">{selectedUMKM.jamOperasional}</p>
                        </div>
                      )}
                      {selectedUMKM.hargaRataRata && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-500 font-semibold mb-1">Harga Rata-rata</p>
                          <p className="text-base font-bold text-gray-900">{selectedUMKM.hargaRataRata}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Deskripsi
                  </h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl">
                    {selectedUMKM.deskripsi}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

