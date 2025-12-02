"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import { 
  getStrukturPemerintahan, 
  saveStrukturPemerintahan, 
  deleteStrukturPemerintahan,
  getStrukturCoverImage,
  saveStrukturCoverImage,
  uploadStrukturImage 
} from "../../../../lib/profilDesaService";

interface AnggotaStruktur {
  id?: string;
  nama: string;
  jabatan: string;
  email?: string;
  noTelp?: string;
  foto?: string;
  urutan: number;
}

type TipeStruktur = 'pemerintahan-desa' | 'bpd';

const TIPE_STRUKTUR_OPTIONS = [
  { value: 'pemerintahan-desa', label: 'Struktur Pemerintahan Desa' },
  { value: 'bpd', label: 'Badan Permusyawaratan Desa' }
];

export default function StrukturPage() {
  const router = useRouter();
  const [tipeStruktur, setTipeStruktur] = useState<TipeStruktur>('pemerintahan-desa');
  const [anggotaList, setAnggotaList] = useState<AnggotaStruktur[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [loading, setLoading] = useState(false); // Only for data operations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<AnggotaStruktur | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tipeStruktur]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStrukturPemerintahan(tipeStruktur);
      // Sort by urutan
      const sortedData = data.sort((a: AnggotaStruktur, b: AnggotaStruktur) => a.urutan - b.urutan);
      setAnggotaList(sortedData);
      
      // Get cover image
      const coverImageUrl = await getStrukturCoverImage(tipeStruktur);
      setCoverImage(coverImageUrl);
    } catch (error) {
      console.error('Error fetching struktur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTambahAnggota = () => {
    setEditingAnggota(null);
    setIsModalOpen(true);
  };

  const handleEditAnggota = (anggota: AnggotaStruktur) => {
    setEditingAnggota(anggota);
    setIsModalOpen(true);
  };

  const handleDeleteAnggota = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) {
      try {
        await deleteStrukturPemerintahan(tipeStruktur, id);
        await fetchData();
        alert('Anggota berhasil dihapus');
      } catch (error) {
        console.error('Error deleting anggota:', error);
        alert('Gagal menghapus anggota');
      }
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index > 0) {
      const newList = [...anggotaList];
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      
      // Update urutan
      newList.forEach((anggota, i) => {
        anggota.urutan = i + 1;
      });
      
      setAnggotaList(newList);
      
      // Save to firestore
      try {
        await Promise.all(newList.map(anggota => 
          saveStrukturPemerintahan(tipeStruktur, anggota, anggota.id)
        ));
      } catch (error) {
        console.error('Error updating order:', error);
      }
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index < anggotaList.length - 1) {
      const newList = [...anggotaList];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      
      // Update urutan
      newList.forEach((anggota, i) => {
        anggota.urutan = i + 1;
      });
      
      setAnggotaList(newList);
      
      // Save to firestore
      try {
        await Promise.all(newList.map(anggota => 
          saveStrukturPemerintahan(tipeStruktur, anggota, anggota.id)
        ));
      } catch (error) {
        console.error('Error updating order:', error);
      }
    }
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      // Generate filename dengan format WebP
      const timestamp = Date.now();
      const tipeNama = tipeStruktur === 'pemerintahan-desa' ? 'pemerintahan' : 'bpd';
      const fileName = `${timestamp}_${tipeNama}.webp`;
      
      // Upload akan otomatis dikonversi ke WebP oleh uploadStrukturImage
      const imageUrl = await uploadStrukturImage(file, fileName);
      await saveStrukturCoverImage(tipeStruktur, imageUrl);
      setCoverImage(imageUrl);
      alert('Cover image berhasil diupdate');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Gagal mengupload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .safe-area-padding {
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
        input, textarea, select {
          user-select: text;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <div 
          className="mb-6 sm:mb-8 bg-gradient-to-r from-white to-gray-50 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg p-5 sm:p-6 lg:p-8 mx-3 sm:mx-4 lg:mx-8 mt-4 sm:mt-6"
          style={{
            animation: 'slideUp 0.5s ease-out'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-white sm:w-6 sm:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Struktur Pemerintahan</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Kelola data anggota struktur organisasi</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto pb-8 px-3 sm:px-4 lg:px-8 safe-area-padding">
          <div className="space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div 
              className="flex flex-col gap-4"
              style={{
                animation: 'fadeIn 0.5s ease-out 0.1s backwards'
              }}
            >
              <button
                onClick={handleTambahAnggota}
                className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center px-5 sm:px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Anggota
              </button>
            </div>

            {/* Navigation & Controls */}
            <div 
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6"
              style={{
                animation: 'cardEntrance 0.6s ease-out 0.2s backwards'
              }}
            >
              {/* Back Navigation */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <Link 
                  href="/admin/profil-desa" 
                  className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-red-600 active:text-red-700 transition-colors duration-200 group"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="font-medium">Kembali</span>
                </Link>
              </div>
              
              {/* Dropdown Tipe Struktur */}
              <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                  Pilih Tipe Struktur:
                </label>
                <div className="relative">
                  <select
                    value={tipeStruktur}
                    onChange={(e) => setTipeStruktur(e.target.value as TipeStruktur)}
                    className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-red-400 active:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  >
                    {TIPE_STRUKTUR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Cover Image Section */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <div className="flex flex-col space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Cover Image Halaman</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Gambar cover untuk halaman publik</p>
                  </div>
                  
                  {/* Current Cover Image Preview */}
                  {coverImage && (
                    <div className="relative inline-block w-full sm:w-auto">
                      <img
                        src={coverImage}
                        alt="Cover Image Preview"
                        className="w-full sm:max-w-md h-40 sm:h-48 object-cover rounded-xl border border-gray-200 shadow-sm"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current Cover
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Cover Image */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <label className="cursor-pointer inline-flex items-center justify-center px-4 sm:px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm sm:text-base font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 active:from-purple-800 active:to-purple-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {coverImage ? 'Ganti Cover' : 'Upload Cover'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>
                    {uploadingCover && (
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                        Mengupload...
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Disarankan rasio landscape (16:9). Format: JPG, PNG, GIF. Otomatis dikonversi ke WebP.
                  </p>
                </div>
              </div>
            </div>

            {/* Data List */}
            <div 
              className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              style={{
                animation: 'cardEntrance 0.6s ease-out 0.3s backwards'
              }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                    {TIPE_STRUKTUR_OPTIONS.find(opt => opt.value === tipeStruktur)?.label}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{anggotaList.length} Anggota</span>
                  </div>
                </div>
              </div>
              
              {anggotaList.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Belum ada anggota</h4>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 px-4">Mulai dengan menambahkan anggota struktur pemerintahan</p>
                  <button
                    onClick={handleTambahAnggota}
                    className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-[0.98] transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Anggota Pertama
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {anggotaList.map((anggota, index) => (
                    <div key={anggota.id} className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Order Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
                              {anggota.urutan}
                            </div>
                          </div>
                          
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {anggota.foto ? (
                              <img
                                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-gray-200"
                                src={anggota.foto}
                                alt={anggota.nama}
                              />
                            ) : (
                              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-gray-200">
                                <svg className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{anggota.nama}</h4>
                            <p className="text-xs sm:text-sm font-medium text-red-600 mb-1 sm:mb-2">{anggota.jabatan}</p>
                            <div className="flex flex-col space-y-0.5 sm:space-y-1">
                              {anggota.email && (
                                <div className="flex items-center text-xs text-gray-500 truncate">
                                  <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                  </svg>
                                  <span className="truncate">{anggota.email}</span>
                                </div>
                              )}
                              {anggota.noTelp && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {anggota.noTelp}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions - Mobile Optimized */}
                        <div className="flex items-center gap-2 sm:gap-1 justify-between sm:justify-end">
                          {/* Move buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                              title="Pindah ke atas"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === anggotaList.length - 1}
                              className="p-2 text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                              title="Pindah ke bawah"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditAnggota(anggota)}
                              className="inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 active:scale-[0.98] transition-all duration-150"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => anggota.id && handleDeleteAnggota(anggota.id)}
                              className="inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 active:scale-[0.98] transition-all duration-150"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="hidden sm:inline">Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <FormAnggotaModal
          anggota={editingAnggota}
          tipeStruktur={tipeStruktur}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </AdminLayout>
  );
}

interface FormAnggotaModalProps {
  anggota?: AnggotaStruktur | null;
  tipeStruktur: TipeStruktur;
  onClose: () => void;
  onSave: () => void;
}

function FormAnggotaModal({ anggota, tipeStruktur, onClose, onSave }: FormAnggotaModalProps) {
  const [formData, setFormData] = useState<AnggotaStruktur>({
    nama: anggota?.nama || '',
    jabatan: anggota?.jabatan || '',
    email: anggota?.email || '',
    noTelp: anggota?.noTelp || '',
    foto: anggota?.foto || '',
    urutan: anggota?.urutan || 1,
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Generate filename dengan format WebP
      const timestamp = Date.now();
      const tipeNama = tipeStruktur === 'pemerintahan-desa' ? 'pemerintahan' : 'bpd';
      const fileName = `${timestamp}_${tipeNama}_anggota.webp`;
      
      // Upload akan otomatis dikonversi ke WebP oleh uploadStrukturImage
      const imageUrl = await uploadStrukturImage(file, fileName);
      setFormData({ ...formData, foto: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Gagal mengupload foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama.trim() || !formData.jabatan.trim()) {
      alert('Nama dan Jabatan harus diisi');
      return;
    }

    try {
      await saveStrukturPemerintahan(tipeStruktur, formData, anggota?.id);
      alert(anggota ? 'Data berhasil diperbarui' : 'Anggota berhasil ditambahkan');
      onSave();
    } catch (error) {
      console.error('Error saving anggota:', error);
      alert('Gagal menyimpan data');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="safe-area-padding p-5 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-gray-800 border-b border-gray-200/50 pb-3">
            {anggota ? 'Edit Anggota' : 'Tambah Anggota Struktur'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6">
            Foto otomatis dikonversi ke format WebP untuk performa optimal.
          </p>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Foto Profil Anggota
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {formData.foto && (
                <img
                  src={formData.foto}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 sm:file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition-all duration-200"
              />
            </div>
            {uploading && <p className="text-sm text-gray-500 mt-2">Mengupload foto...</p>}
          </div>

          {/* Nama Lengkap */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm sm:text-base"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* Jabatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jabatan *
            </label>
            <input
              type="text"
              value={formData.jabatan}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm sm:text-base"
              placeholder="Contoh: Kepala Desa, Sekretaris Desa"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm sm:text-base"
              placeholder="example@email.com"
            />
          </div>

          {/* No. Telp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              No. Telp
            </label>
            <input
              type="tel"
              value={formData.noTelp}
              onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm sm:text-base"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          {/* Urutan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutan
            </label>
            <input
              type="number"
              min="1"
              value={formData.urutan}
              onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all duration-200 text-gray-900 text-sm sm:text-base"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-5 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {uploading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 sm:px-6 py-3 bg-white text-gray-700 text-sm sm:text-base font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Batal
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
