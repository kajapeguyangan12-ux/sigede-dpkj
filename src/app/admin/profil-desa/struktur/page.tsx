"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../../lib/logoutHelper';
import AdminLayout from "../../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../../components/AdminHeaderCard";
import { 
  getStrukturPemerintahan, 
  saveStrukturPemerintahan, 
  deleteStrukturPemerintahan,
  getStrukturCoverImage,
  saveStrukturCoverImage,
  uploadImageToStorage 
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
  const { logout } = useAuth();
  const [tipeStruktur, setTipeStruktur] = useState<TipeStruktur>('pemerintahan-desa');
  const [anggotaList, setAnggotaList] = useState<AnggotaStruktur[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
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

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
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
      const imageUrl = await uploadImageToStorage(file, `cover-struktur-${tipeStruktur}`);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <AdminHeaderCard title="Struktur Pemerintahan">
          <AdminHeaderSearchBar placeholder="Cari anggota struktur..." />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>

        {/* Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Struktur Pemerintahan
                </h1>
                <p className="text-gray-600 text-lg">
                  Kelola data anggota struktur organisasi pemerintahan desa
                </p>
              </div>
              <button
                onClick={handleTambahAnggota}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Anggota
              </button>
            </div>

            {/* Navigation & Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Back Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href="/admin/profil-desa" 
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Profil Desa
                </Link>
              </div>
              
              {/* Dropdown Tipe Struktur */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <label className="text-sm font-semibold text-gray-700">
                  Pilih Tipe Struktur:
                </label>
                <div className="relative">
                  <select
                    value={tipeStruktur}
                    onChange={(e) => setTipeStruktur(e.target.value as TipeStruktur)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-w-[280px]"
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
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Cover Image Halaman</h4>
                      <p className="text-sm text-gray-600">Gambar cover yang akan ditampilkan di halaman publik</p>
                    </div>
                  </div>
                  
                  {/* Current Cover Image Preview */}
                  {coverImage && (
                    <div className="relative inline-block">
                      <img
                        src={coverImage}
                        alt="Cover Image Preview"
                        className="max-w-md h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current Cover
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Cover Image */}
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {coverImage ? 'Ganti Cover Image' : 'Upload Cover Image'}
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
                    Gambar akan ditampilkan sebagai cover di halaman masyarakat. Disarankan menggunakan gambar dengan rasio landscape (16:9) untuk hasil terbaik.
                  </p>
                </div>
              </div>
            </div>

            {/* Data List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {TIPE_STRUKTUR_OPTIONS.find(opt => opt.value === tipeStruktur)?.label}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{anggotaList.length} Anggota</span>
                  </div>
                </div>
              </div>
              
              {anggotaList.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada anggota</h4>
                  <p className="text-gray-500 mb-6">Mulai dengan menambahkan anggota struktur pemerintahan</p>
                  <button
                    onClick={handleTambahAnggota}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                    <div key={anggota.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Order Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                              {anggota.urutan}
                            </div>
                          </div>
                          
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {anggota.foto ? (
                              <img
                                className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-200"
                                src={anggota.foto}
                                alt={anggota.nama}
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ring-2 ring-gray-200">
                                <svg className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-lg font-semibold text-gray-900 truncate">{anggota.nama}</h4>
                            </div>
                            <p className="text-sm font-medium text-blue-600 mb-2">{anggota.jabatan}</p>
                            <div className="flex flex-col space-y-1">
                              {anggota.email && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                  </svg>
                                  {anggota.email}
                                </div>
                              )}
                              {anggota.noTelp && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {anggota.noTelp}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          {/* Move buttons */}
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                            title="Pindah ke atas"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === anggotaList.length - 1}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                            title="Pindah ke bawah"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Action buttons */}
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditAnggota(anggota)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-150"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => anggota.id && handleDeleteAnggota(anggota.id)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-150"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
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
      const imageUrl = await uploadImageToStorage(file, `struktur-${tipeStruktur}`);
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-white/20">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-200/50 pb-3">
          {anggota ? 'Edit Anggota' : 'Tambah Anggota Struktur Pemerintahan'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Foto Profil Anggota
            </label>
            <div className="flex items-center space-x-4">
              {formData.foto && (
                <img
                  src={formData.foto}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50/80 file:backdrop-blur-sm file:text-blue-700 hover:file:bg-blue-100/80 transition-all duration-200"
              />
            </div>
            {uploading && <p className="text-sm text-gray-500">Mengupload foto...</p>}
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
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
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
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
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
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
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
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
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
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-6">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {uploading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50/80 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
