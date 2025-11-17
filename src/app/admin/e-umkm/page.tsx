'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  tanggalDaftar: Date;
  rating?: number;
  jumlahProduk?: number;
}

type FilterType = 'all' | 'aktif' | 'tidak_aktif' | 'pending';
type SortType = 'newest' | 'oldest' | 'name' | 'rating';

const KATEGORI_OPTIONS = [
  'Makanan & Minuman',
  'Fashion & Pakaian',
  'Kerajinan Tangan',
  'Jasa',
  'Pertanian',
  'Teknologi',
  'Kesehatan & Kecantikan',
  'Lainnya'
];

const STATUS_CONFIG = {
  aktif: {
    label: 'Aktif',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: '✅'
  },
  tidak_aktif: {
    label: 'Tidak Aktif',
    color: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    icon: '⏸️'
  },
  pending: {
    label: 'Menunggu Verifikasi',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    icon: '⏳'
  }
};

export default function AdminEUMKMPage() {
  const [umkmList, setUmkmList] = useState<UMKM[]>([]);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUMKM, setSelectedUMKM] = useState<UMKM | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUMKM();
  }, []);

  const fetchUMKM = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'e-umkm'));
      const fetchedUMKM: UMKM[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedUMKM.push({
          id: doc.id,
          ...doc.data()
        } as UMKM);
      });
      
      setUmkmList(fetchedUMKM);
    } catch (error) {
      console.error('Error fetching UMKM:', error);
      alert('Gagal memuat data UMKM');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (action: 'approve' | 'reject') => {
    if (!selectedUMKM?.id) return;
    
    try {
      setSubmitting(true);
      const newStatus = action === 'approve' ? 'aktif' : 'tidak_aktif';
      
      await updateDoc(doc(db, 'e-umkm', selectedUMKM.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`UMKM berhasil ${action === 'approve' ? 'diterima' : 'ditolak'}!`);
      setShowStatusModal(false);
      setShowDetailModal(false);
      fetchUMKM();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengupdate status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = (umkm: UMKM) => {
    setSelectedUMKM(umkm);
    setShowDetailModal(true);
  };

  const handleOpenStatusModal = (umkm: UMKM) => {
    setSelectedUMKM(umkm);
    setShowStatusModal(true);
  };

  const filteredData = umkmList.filter(item => {
    const matchesSearch = item.namaUsaha.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
    const matchesKategori = selectedKategori === 'all' || item.kategori === selectedKategori;
    return matchesSearch && matchesFilter && matchesKategori;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.tanggalDaftar).getTime() - new Date(a.tanggalDaftar).getTime();
      case 'oldest':
        return new Date(a.tanggalDaftar).getTime() - new Date(b.tanggalDaftar).getTime();
      case 'name':
        return a.namaUsaha.localeCompare(b.namaUsaha);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const stats = {
    total: umkmList.length,
    aktif: umkmList.filter(u => u.status === 'aktif').length,
    tidak_aktif: umkmList.filter(u => u.status === 'tidak_aktif').length,
    pending: umkmList.filter(u => u.status === 'pending').length,
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Verifikasi E-UMKM
                </h1>
                <p className="text-gray-600 mt-1">Terima atau tolak pendaftaran UMKM</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.total}</h3>
              <p className="text-sm text-blue-100 font-medium">Total UMKM</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.aktif}</h3>
              <p className="text-sm text-green-100 font-medium">UMKM Aktif</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.pending}</h3>
              <p className="text-sm text-yellow-100 font-medium">Menunggu Verifikasi</p>
            </div>

            <div className="bg-gradient-to-br from-gray-500 to-slate-600 rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stats.tidak_aktif}</h3>
              <p className="text-sm text-gray-100 font-medium">Tidak Aktif</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari UMKM atau pemilik..."
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Kategori Filter */}
              <div>
                <select
                  className="block w-full px-4 py-3 rounded-2xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm font-medium"
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                >
                  <option value="all">Semua Kategori</option>
                  {KATEGORI_OPTIONS.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  className="block w-full px-4 py-3 rounded-2xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm font-medium"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="name">Nama (A-Z)</option>
                  <option value="rating">Rating Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {[
                { key: 'all', label: 'Semua', count: stats.total },
                { key: 'aktif', label: 'Aktif', count: stats.aktif },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'tidak_aktif', label: 'Tidak Aktif', count: stats.tidak_aktif },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as FilterType)}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                    activeFilter === tab.key
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* UMKM List */}
          {filteredData.length === 0 && !loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Tidak Ada UMKM</h3>
              <p className="text-gray-500">Tidak ditemukan UMKM yang sesuai dengan filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((umkm) => (
                <div
                  key={umkm.id}
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                >
                  {/* Image/Icon Section */}
                  <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                    {umkm.fotoUsaha && umkm.fotoUsaha[0] ? (
                      <Image
                        src={umkm.fotoUsaha[0]}
                        alt={umkm.namaUsaha}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-yellow-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-xs text-yellow-600 font-medium">Belum ada foto</p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_CONFIG[umkm.status].bgColor} ${STATUS_CONFIG[umkm.status].textColor} backdrop-blur-sm shadow-lg flex items-center gap-1`}>
                      <span>{STATUS_CONFIG[umkm.status].icon}</span>
                      <span>{STATUS_CONFIG[umkm.status].label}</span>
                    </div>

                    {/* Rating Badge */}
                    {umkm.rating && (
                      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">{umkm.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition-colors">
                        {umkm.namaUsaha}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {umkm.namaPemilik}
                      </p>
                    </div>

                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 rounded-full text-xs font-bold">
                        {umkm.kategori}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {umkm.deskripsi}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">{umkm.jumlahProduk || 0} Produk</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{new Date(umkm.tanggalDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(umkm)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
                      >
                        Detail
                      </button>
                      {umkm.status === 'pending' && (
                        <button
                          onClick={() => handleOpenStatusModal(umkm)}
                          className="flex-1 px-4 py-2.5 bg-white border-2 border-yellow-300 hover:border-yellow-500 text-yellow-700 hover:text-yellow-800 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Verifikasi
                        </button>
                      )}
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
              <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedUMKM.namaUsaha}</h2>
                    <p className="text-yellow-100 text-sm">Detail Informasi UMKM</p>
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
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${STATUS_CONFIG[selectedUMKM.status].bgColor} ${STATUS_CONFIG[selectedUMKM.status].textColor} flex items-center gap-2`}>
                    <span>{STATUS_CONFIG[selectedUMKM.status].icon}</span>
                    {STATUS_CONFIG[selectedUMKM.status].label}
                  </span>
                </div>

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

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600 mb-1">{selectedUMKM.jumlahProduk || 0}</p>
                    <p className="text-xs text-blue-600 font-medium">Produk</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-yellow-600 mb-1">{selectedUMKM.rating?.toFixed(1) || '-'}</p>
                    <p className="text-xs text-yellow-600 font-medium">Rating</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-600 mb-1">
                      {new Date(selectedUMKM.tanggalDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Terdaftar</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-3xl flex gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  Tutup
                </button>
                {selectedUMKM.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenStatusModal(selectedUMKM);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                  >
                    Verifikasi
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Modal */}
        {showStatusModal && selectedUMKM && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-t-3xl">
                <h3 className="text-xl font-bold">Verifikasi UMKM</h3>
                <p className="text-sm text-yellow-100 mt-1">{selectedUMKM.namaUsaha}</p>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Apakah Anda yakin ingin memverifikasi pendaftaran UMKM ini?
                </p>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800 font-semibold mb-1">Perhatian</p>
                      <p className="text-xs text-yellow-700">
                        Pastikan Anda telah memeriksa informasi UMKM dengan teliti sebelum melakukan verifikasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 rounded-b-3xl flex gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateStatus('reject')}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Proses...' : 'Tolak'}
                </button>
                <button
                  onClick={() => handleUpdateStatus('approve')}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Proses...' : 'Terima'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
