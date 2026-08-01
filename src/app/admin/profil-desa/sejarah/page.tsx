"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import { 
  getSejarahContent, 
  saveSejarahContent, 
  uploadImageToStorage,
  subscribeToSejarahContent,
  type SejarahContent 
} from "../../../../lib/profilDesaService";

export default function SejarahDesaAdminPage() {
  const router = useRouter();
  const [sejarahData, setSejarahData] = useState<SejarahContent | null>(null);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    deskripsi: "",
  });

  useEffect(() => {
    const loadSejarahData = async () => {
      try {
        const data = await getSejarahContent();
        setSejarahData(data);
      } catch (error) {
        console.error('Error loading sejarah data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSejarahData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSejarahContent((data) => {
      setSejarahData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    if (sejarahData) {
      setFormData({
        deskripsi: sejarahData.deskripsi,
      });
      setPreviewUrl(sejarahData.fotoUrl || null);
      setSelectedFile(null);
      setShowModal(true);
    }
  };

  const handleAdd = () => {
    setFormData({
      deskripsi: "",
    });
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Cleanup preview URL if it's a blob URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowModal(false);
    setFormData({ deskripsi: "" });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deskripsi.trim()) {
      alert('Deskripsi tidak boleh kosong');
      return;
    }

    setUploading(true);

    try {
      let fotoUrl = sejarahData?.fotoUrl || '';
      
      // Upload foto jika ada file yang dipilih - akan otomatis dikonversi ke WebP
      if (selectedFile) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_sejarah.webp`;
        fotoUrl = await uploadImageToStorage(selectedFile, fileName);
      }

      // Save only deskripsi and fotoUrl (other fields empty)
      await saveSejarahContent({
        deskripsi: formData.deskripsi,
        asalUsul: '',
        tahunBerdiri: '',
        hariJadi: '',
        tokohPendiri: '',
        perkembangan: '',
        fotoUrl: fotoUrl,
      });

      handleCloseModal();
      alert('Data sejarah berhasil disimpan!');
    } catch (error) {
      console.error('Error saving sejarah data:', error);
      alert('Gagal menyimpan data sejarah');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA data sejarah? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    setUploading(true);
    try {
      await saveSejarahContent({
        deskripsi: '',
        asalUsul: '',
        tahunBerdiri: '',
        hariJadi: '',
        tokohPendiri: '',
        perkembangan: '',
        fotoUrl: '',
      });
      
      setSejarahData(null);
      alert('Data sejarah berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting sejarah data:', error);
      alert('Gagal menghapus data sejarah');
    } finally {
      setUploading(false);
    }
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
          className="mb-4 sm:mb-6 p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl border border-amber-100 shadow-sm"
          style={{
            animation: 'slideUp 0.5s ease-out'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Sejarah Desa</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Kelola informasi sejarah desa</p>
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
          {sejarahData && sejarahData.deskripsi ? (
            <div 
              className="bg-gradient-to-r from-white to-gray-50 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-md hover:shadow-xl overflow-hidden transition-all duration-300"
              style={{
                animation: 'cardEntrance 0.6s ease-out'
              }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Foto Preview - Full Size */}
                <div className="w-full sm:w-64 h-64 sm:h-80 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-gray-600 font-semibold overflow-hidden flex-shrink-0">
                  {sejarahData.fotoUrl ? (
                    <img 
                      src={sejarahData.fotoUrl} 
                      alt="Foto Sejarah" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl">📚</span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Sejarah Desa</h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                    {sejarahData.deskripsi}
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
                      onClick={handleDelete}
                      disabled={uploading}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-red-200 text-red-700 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-red-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
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
              <p className="text-gray-600 text-base sm:text-lg font-medium mb-1 sm:mb-2">Belum ada data sejarah</p>
              <p className="text-gray-500 text-xs sm:text-sm px-4">Klik tombol &quot;Buat&quot; untuk menambah data sejarah</p>
            </div>
          )}
          
          <div 
            className="flex justify-end mt-6 sm:mt-8"
            style={{
              animation: 'slideUp 0.5s ease-out 0.2s backwards'
            }}
          >
            {!sejarahData || !sejarahData.deskripsi ? (
              <button 
                onClick={handleAdd}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98] text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
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
            ) : null}
          </div>
        </div>

        {/* Modal - Mobile Optimized */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-60 max-h-[90vh] overflow-y-auto">
              <div className="safe-area-padding p-6 sm:p-8 lg:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                  {sejarahData && sejarahData.deskripsi ? 'Edit Sejarah Desa' : 'Buat Sejarah Desa'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                  Foto otomatis dikonversi ke format WebP untuk performa optimal.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
                {/* Upload Foto - Professional */}
                <div>
                  <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Upload Foto Sejarah</label>
                  
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="fileInputSejarah"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {/* Button Pilih Foto */}
                  {!previewUrl && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('fileInputSejarah')?.click()}
                      className="w-full flex items-center justify-center gap-3 px-5 sm:px-6 py-6 sm:py-8 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-amber-500 hover:bg-amber-50 active:bg-amber-100 transition-all duration-300 group"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors">
                          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-amber-600">
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
                  
                  {/* Preview Foto */}
                  {previewUrl && (
                    <div className="mt-4 space-y-3">
                      <div className="relative group">
                        <div 
                          className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-amber-500 active:border-amber-600 transition-colors"
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
                        
                        {/* Tombol Hapus Preview */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (previewUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            const input = document.getElementById('fileInputSejarah') as HTMLInputElement;
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
                      
                      {/* Button Ganti Foto */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('fileInputSejarah')?.click();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:from-amber-700 active:to-orange-800 active:scale-[0.98] text-white text-sm sm:text-base font-semibold transition-all duration-300 shadow-lg"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span>Ganti Foto</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="text-sm sm:text-base font-semibold text-gray-700 block mb-2 sm:mb-3">Detail Sejarah Desa</label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    placeholder="Masukkan detail sejarah desa..."
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors text-sm sm:text-base"
                    rows={6}
                    required
                  />
                </div>

                {/* Buttons */}
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
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {sejarahData && sejarahData.deskripsi ? 'Memperbarui...' : 'Menyimpan...'}
                      </>
                    ) : (
                      <span>{sejarahData && sejarahData.deskripsi ? 'Perbarui' : 'Simpan'}</span>
                    )}
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
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-amber-400 active:text-amber-500 transition-colors p-2 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80"
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