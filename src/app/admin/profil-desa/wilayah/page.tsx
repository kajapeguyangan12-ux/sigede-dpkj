"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import { 
  getWilayahContent, 
  saveWilayahContent, 
  uploadImageToStorage,
  subscribeToWilayahContent,
  type WilayahContent, 
  type WilayahDusunEntry 
} from "../../../../lib/profilDesaService";

export default function WilayahDesaAdminPage() {
  const router = useRouter();
  const [wilayahData, setWilayahData] = useState<WilayahContent | null>(null);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'main' | 'dusun'>('main');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDusunIndex, setEditingDusunIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    namaDusun: "",
    luasDusun: "",
    garisKeliling: "",
  });

  const ITEMS_PER_PAGE = 5;


  useEffect(() => {
    const loadWilayahData = async () => {
      try {
        const data = await getWilayahContent();
        setWilayahData(data);
      } catch (error) {
        console.error('Error loading wilayah data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWilayahData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToWilayahContent((data) => {
      setWilayahData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleEdit = () => {
    if (wilayahData) {
      setIsEditMode(true);
      setModalType('main'); // Set ke 'main' untuk edit deskripsi dan foto
      setFormData({
        description: wilayahData.deskripsi || "",
        namaDusun: "",
        luasDusun: "",
        garisKeliling: "",
      });
      // Set preview from existing photo
      if (wilayahData.fotoUrl) {
        setPreviewUrl(wilayahData.fotoUrl);
      }
      setShowModal(true);
    }
  };

  const handleAddMain = () => {
    setIsEditMode(false);
    setModalType('main');
    setFormData({
      description: "",
      namaDusun: "",
      luasDusun: "",
      garisKeliling: "",
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleAddDusun = () => {
    setIsEditMode(true);
    setModalType('dusun');
    setFormData({
      description: "",
      namaDusun: "",
      luasDusun: "",
      garisKeliling: "",
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Cleanup preview URL if it's a blob URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowModal(false);
    setIsEditMode(false);
    setEditingDusunIndex(null);
    setSelectedFile(null);
    setFormData({
      description: "",
      namaDusun: "",
      luasDusun: "",
      garisKeliling: "",
    });
    setPreviewUrl("");
  };

  const handleDelete = async (indexToDelete: number) => {
    if (!wilayahData) return;
    
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA data wilayah? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      setUploading(true);
      
      // Hapus SEMUA data - deskripsi, foto, dan semua dusun data
      await saveWilayahContent({
        deskripsi: '',
        fotoUrl: '',
        dusunData: [],
      });
      
      // Update state lokal menjadi null agar UI kembali ke kondisi awal
      setWilayahData(null);
      setUploading(false);
      alert('Semua data wilayah berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting wilayah data:', error);
      setUploading(false);
      alert('Gagal menghapus data wilayah');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Untuk modal main
      if (modalType === 'main') {
        let fotoUrl = wilayahData?.fotoUrl || '';
        
        // Upload foto jika ada file yang dipilih - akan otomatis dikonversi ke WebP
        if (selectedFile) {
          const timestamp = Date.now();
          const fileName = `${timestamp}_wilayah.webp`;
          fotoUrl = await uploadImageToStorage(selectedFile, fileName);
        }

        const wilayahContent: Omit<WilayahContent, 'id' | 'createdAt' | 'updatedAt'> = {
          deskripsi: formData.description || '',
          fotoUrl: fotoUrl,
          dusunData: wilayahData?.dusunData || [], // Pertahankan data dusun existing
        };

        await saveWilayahContent(wilayahContent);
        handleCloseModal();
        alert('Data wilayah berhasil disimpan!');
      } 
      // Untuk modal dusun
      else if (modalType === 'dusun') {
        if (!wilayahData) {
          alert('Data wilayah main belum ada');
          return;
        }

        const updatedDusunData = [...(wilayahData.dusunData || [])];
        
        // Jika sedang edit (editingDusunIndex ada)
        if (editingDusunIndex !== null) {
          updatedDusunData[editingDusunIndex] = {
            namaDusun: formData.namaDusun,
            luasDusun: formData.luasDusun,
            garisKeliling: formData.garisKeliling,
          };
        } else {
          // Tambah data dusun baru
          const newDusunEntry: WilayahDusunEntry = {
            namaDusun: formData.namaDusun,
            luasDusun: formData.luasDusun,
            garisKeliling: formData.garisKeliling,
          };
          updatedDusunData.push(newDusunEntry);
        }

        const wilayahContent: Omit<WilayahContent, 'id' | 'createdAt' | 'updatedAt'> = {
          deskripsi: wilayahData.deskripsi,
          fotoUrl: wilayahData.fotoUrl,
          dusunData: updatedDusunData,
        };

        await saveWilayahContent(wilayahContent);
        handleCloseModal();
        setEditingDusunIndex(null);
        alert(editingDusunIndex !== null ? 'Data dusun berhasil diperbarui!' : 'Data dusun berhasil ditambahkan!');
      }
    } catch (error) {
      console.error('Error saving wilayah data:', error);
      alert('Gagal menyimpan data');
    } finally {
      setUploading(false);
    }
  };

  // Pagination logic
  const dusunDataList = wilayahData?.dusunData || [];
  const totalPages = Math.ceil(dusunDataList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = dusunDataList.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDeleteDusun = async (indexToDelete: number) => {
    if (!wilayahData) return;
    
    const dusunToDelete = wilayahData.dusunData[indexToDelete];
    if (!confirm(`Apakah Anda yakin ingin menghapus data dusun "${dusunToDelete.namaDusun}"?`)) {
      return;
    }

    try {
      setUploading(true);
      const updatedDusunData = wilayahData.dusunData.filter((_, index) => index !== indexToDelete);
      
      await saveWilayahContent({
        deskripsi: wilayahData.deskripsi,
        fotoUrl: wilayahData.fotoUrl,
        dusunData: updatedDusunData,
      });
      
      setWilayahData({
        ...wilayahData,
        dusunData: updatedDusunData,
      });

      // Reset page jika melebihi batas
      const newTotalPages = Math.ceil(updatedDusunData.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      setUploading(false);
      alert('Data dusun berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting dusun data:', error);
      setUploading(false);
      alert('Gagal menghapus data dusun');
    }
  };

  const handleEditDusun = (indexToEdit: number) => {
    if (!wilayahData) return;
    
    const dusunToEdit = wilayahData.dusunData[indexToEdit];
    setEditingDusunIndex(indexToEdit);
    setFormData({
      description: wilayahData.deskripsi || "",
      namaDusun: dusunToEdit.namaDusun,
      luasDusun: dusunToEdit.luasDusun,
      garisKeliling: dusunToEdit.garisKeliling,
    });
    setModalType('dusun');
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* iOS Safe Area Support */
        .safe-area-padding {
          padding-top: max(1rem, env(safe-area-inset-top));
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
          padding-left: max(1rem, env(safe-area-inset-left));
          padding-right: max(1rem, env(safe-area-inset-right));
        }
        
        /* Touch Optimizations */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        
        button, a {
          user-select: none;
          -webkit-user-select: none;
        }
        
        /* Smooth Scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto safe-area-padding px-3 sm:px-4 lg:px-6">
        {/* Header - Simplified for Mobile */}
        <div 
          className="mb-4 sm:mb-6 p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl sm:rounded-3xl border border-red-100 shadow-sm"
          style={{
            animation: 'slideUp 0.5s ease-out'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Wilayah Desa</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Kelola informasi wilayah dan dusun</p>
            </div>
          </div>
        </div>
        
        {/* Tombol Kembali - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/profil-desa"
            className="group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 text-sm sm:text-base font-semibold hover:from-red-100 hover:to-red-200 hover:border-red-300 active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-lg"
            title="Kembali ke halaman pemilihan Profil Desa"
          >
            <svg 
              width="18" 
              height="18" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
              className="text-red-600 group-hover:text-red-700 transition-colors"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="group-hover:text-red-800 transition-colors">Kembali</span>
          </Link>
        </div>
        
        <div>
          {wilayahData ? (
            <>
              {/* Foto dan Deskripsi Utama - Mobile Optimized */}
              <div 
                className="mb-6 sm:mb-8"
                style={{
                  animation: 'cardEntrance 0.6s ease-out'
                }}
              >
                <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-md hover:shadow-xl overflow-hidden transition-all duration-300">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-64 h-64 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold overflow-hidden flex-shrink-0">
                      {wilayahData.fotoUrl ? (
                        <img 
                          src={wilayahData.fotoUrl} 
                          alt="Foto Wilayah" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl">🖼️</span>
                      )}
                    </div>
                    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Informasi Wilayah</h2>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                        {wilayahData.deskripsi || "Deskripsi wilayah belum ada"}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button 
                          onClick={handleEdit}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-gray-200 text-gray-700 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 active:scale-[0.98] transition-all duration-200"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(0)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-200 text-red-700 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-red-300 active:scale-[0.98] transition-all duration-200"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Dusun - Mobile Optimized */}
              {wilayahData.dusunData && wilayahData.dusunData.length > 0 && (
                <div 
                  className="mb-6 sm:mb-8"
                  style={{
                    animation: 'cardEntrance 0.6s ease-out 0.1s backwards'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">Data Dusun</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {startIndex + 1}-{Math.min(endIndex, dusunDataList.length)} dari {dusunDataList.length} dusun
                      </p>
                    </div>
                  </div>

                  {/* Daftar Data Dusun - Mobile Optimized Cards */}
                  <div className="space-y-3 sm:space-y-4">
                    {currentData.map((dusun, indexInPage) => {
                      const actualIndex = startIndex + indexInPage;
                      return (
                        <div 
                          key={actualIndex}
                          className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-md hover:shadow-lg hover:border-red-300 active:scale-[0.99] transition-all duration-300 p-4 sm:p-5"
                          style={{
                            animation: `cardEntrance 0.4s ease-out ${indexInPage * 0.08}s backwards`
                          }}
                        >
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {actualIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{dusun.namaDusun}</h4>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Dusun #{actualIndex + 1}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditDusun(actualIndex)}
                                disabled={uploading}
                                className="p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit dusun ini"
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteDusun(actualIndex)}
                                disabled={uploading}
                                className="p-2 text-red-600 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                                title="Hapus dusun ini"
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Detail Data - Mobile Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
                              <label className="text-xs font-semibold text-red-700 uppercase tracking-wide block mb-1.5 sm:mb-2">Luas Wilayah</label>
                              <p className="text-lg sm:text-xl font-bold text-red-900">{dusun.luasDusun} <span className="text-xs sm:text-sm font-normal">m²</span></p>
                            </div>
                            <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
                              <label className="text-xs font-semibold text-red-700 uppercase tracking-wide block mb-1.5 sm:mb-2">Garis Keliling</label>
                              <p className="text-lg sm:text-xl font-bold text-red-900">{dusun.garisKeliling} <span className="text-xs sm:text-sm font-normal">km</span></p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination - Mobile Optimized */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
                      {/* Previous Button */}
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman sebelumnya"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Numbers - Hide on very small screens if many pages */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 active:scale-95 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                : 'border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600 active:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman berikutnya"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div 
              className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl sm:rounded-2xl"
              style={{
                animation: 'fadeIn 0.5s ease-out'
              }}
            >
              <div className="text-gray-400 mb-3 sm:mb-4">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-base sm:text-lg font-medium mb-1 sm:mb-2">Belum ada data wilayah</p>
              <p className="text-gray-500 text-xs sm:text-sm px-4">Klik tombol &quot;Buat (Main)&quot; untuk menambah data wilayah</p>
            </div>
          )}
          
          {/* Action Buttons - Mobile Optimized */}
          <div 
            className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8"
            style={{
              animation: 'slideUp 0.5s ease-out 0.2s backwards'
            }}
          >
            {/* Button Buat (Main) */}
            <button 
              onClick={handleAddMain}
              disabled={wilayahData !== null && !!wilayahData?.deskripsi}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-[0.98] text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-sm"
            >
              <span>Buat (Main)</span>
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* Button Buat */}
            <button 
              onClick={handleAddDusun}
              disabled={!wilayahData || !wilayahData.deskripsi}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-sm"
            >
              <span>Buat</span>
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Tambah/Edit Wilayah - Mobile Optimized */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-60 max-h-[90vh] overflow-y-auto">
              <div className="safe-area-padding p-6 sm:p-8 lg:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                  {modalType === 'main' ? 'Formulir Tambah Wilayah' : editingDusunIndex !== null ? 'Edit Data Dusun' : 'Isi Tabel Luas Wilayah'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  {modalType === 'main' ? 'Data akan tersimpan di Firebase Firestore. Foto otomatis dikonversi ke format WebP untuk performa optimal.' : editingDusunIndex !== null ? 'Perbarui informasi data dusun yang sudah ada.' : 'Tambahkan data dusun untuk melengkapi informasi wilayah.'}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
                  {modalType === 'main' && (
                    <>
                      <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Deskripsi Wilayah Desa</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Masukkan Deskripsi"
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-sm sm:text-base"
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Upload Foto Wilayah</label>
                        
                        <input
                          type="file"
                          id="fileInput"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        
                        {!previewUrl && (
                          <button
                            type="button"
                            onClick={() => document.getElementById('fileInput')?.click()}
                            className="w-full flex items-center justify-center gap-3 px-5 sm:px-6 py-6 sm:py-8 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-red-500 hover:bg-red-50 active:bg-red-100 transition-all duration-300 group"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-600">
                                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <path d="M21 15l-5-5L5 21"/>
                                </svg>
                              </div>
                              <div className="text-center">
                                <p className="text-base sm:text-lg font-semibold text-gray-700">Klik untuk memilih foto</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Format: JPG, PNG, GIF (Maks 5MB)</p>
                                <p className="text-xs text-gray-400 mt-1">Foto akan dikonversi ke WebP untuk performa optimal</p>
                              </div>
                            </div>
                          </button>
                        )}
                        
                        {selectedFile && !previewUrl && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              File dipilih: {selectedFile.name}
                            </p>
                          </div>
                        )}
                        
                        {previewUrl && (
                          <div className="mt-4 space-y-3">
                            <div className="relative group">
                              <div 
                                className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-red-500 active:border-red-600 transition-colors"
                                onClick={() => setShowImageModal(true)}
                              >
                                <img 
                                  src={previewUrl} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 active:bg-black/40 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-800">
                                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPreviewUrl("");
                                  setSelectedFile(null);
                                  const input = document.getElementById('fileInput') as HTMLInputElement;
                                  if (input) input.value = '';
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full p-2.5 shadow-lg transition-colors z-10"
                                title="Hapus foto"
                              >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                              </button>
                            </div>
                            
                            <p className="text-xs text-center text-gray-500">Klik foto untuk melihat ukuran penuh</p>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('fileInput')?.click();
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 active:scale-[0.98] text-white text-sm sm:text-base font-semibold transition-all duration-300 shadow-lg"
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              <span>Ganti Foto</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {modalType === 'dusun' && (
                    <>
                      <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Nama Dusun</label>
                        <input
                          type="text"
                          name="namaDusun"
                          value={formData.namaDusun}
                          onChange={handleInputChange}
                          placeholder="Masukkan Nama Dusun"
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Luas Dusun (m²)</label>
                        <input
                          type="text"
                          name="luasDusun"
                          value={formData.luasDusun}
                          onChange={handleInputChange}
                          placeholder="Masukkan Luas Dusun"
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Garis Keliling (km)</label>
                        <input
                          type="text"
                          name="garisKeliling"
                          value={formData.garisKeliling}
                          onChange={handleInputChange}
                          placeholder="Masukkan Garis Keliling"
                          className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-sm sm:text-base"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={uploading}
                      className="w-full sm:flex-1 px-5 sm:px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm sm:text-base font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full sm:flex-1 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:from-green-700 active:to-green-800 active:scale-[0.98] text-white text-sm sm:text-base font-semibold transition-all duration-300 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      <span>Simpan</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pop-up Foto Full Size - Mobile Optimized */}
        {showImageModal && previewUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowImageModal(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative z-10 max-w-5xl max-h-[90vh] w-full">
              {/* Close Button - Mobile Optimized */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-red-400 active:text-red-500 transition-colors p-2 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80"
                title="Tutup"
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="sm:w-8 sm:h-8">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              
              {/* Image */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
                <img 
                  src={previewUrl} 
                  alt="Full size preview" 
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg sm:rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}