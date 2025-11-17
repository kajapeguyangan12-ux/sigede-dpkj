"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../../lib/logoutHelper';
import AdminLayout from "../../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../../components/AdminHeaderCard";
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
  const { logout } = useAuth();
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

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
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
      <div className="max-w-4xl mx-auto">
        <AdminHeaderCard title="Wilayah Desa">
          <AdminHeaderSearchBar />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>
        
        {/* Tombol Kembali */}
        <div className="mb-6">
          <Link
            href="/admin/profil-desa"
            className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 font-semibold hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            title="Kembali ke halaman pemilihan Profil Desa"
          >
            <svg 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
              className="text-red-600 group-hover:text-red-700 transition-colors"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="group-hover:text-red-800 transition-colors">Kembali ke Pemilihan</span>
          </Link>
        </div>
        
        <div>
          {wilayahData ? (
            <>
              {/* Foto dan Deskripsi Utama */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-white to-gray-50 rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 sm:h-auto bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold overflow-hidden flex-shrink-0">
                      {wilayahData.fotoUrl ? (
                        <img 
                          src={wilayahData.fotoUrl} 
                          alt="Foto Wilayah" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🖼️</span>
                      )}
                    </div>
                    <div className="flex-1 px-6 sm:px-8 py-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">Informasi Wilayah</h2>
                      <p className="text-gray-700 text-base leading-relaxed mb-6">
                        {wilayahData.deskripsi || "Deskripsi wilayah belum ada"}
                      </p>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleEdit}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold flex items-center gap-1 hover:bg-gray-300 transition-colors transform hover:scale-105"
                        >
                          Edit
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(0)}
                          className="px-4 py-2 rounded-lg bg-red-200 text-red-700 font-semibold flex items-center gap-1 hover:bg-red-300 transition-colors transform hover:scale-105"
                        >
                          Hapus
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Dusun - Dipisah dan Pagination */}
              {wilayahData.dusunData && wilayahData.dusunData.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Data Dusun</h3>
                      <p className="text-sm text-gray-500 mt-1">Menampilkan {startIndex + 1}-{Math.min(endIndex, dusunDataList.length)} dari {dusunDataList.length} dusun</p>
                    </div>
                  </div>

                  {/* Daftar Data Dusun - Dipisah */}
                  <div className="space-y-4">
                    {currentData.map((dusun, indexInPage) => {
                      const actualIndex = startIndex + indexInPage;
                      return (
                        <div 
                          key={actualIndex}
                          className="bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg hover:border-blue-300 transition-all duration-300 p-5 transform hover:scale-[1.01]"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {actualIndex + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-800">{dusun.namaDusun}</h4>
                                <p className="text-sm text-gray-500 mt-1">Dusun #{actualIndex + 1}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditDusun(actualIndex)}
                                disabled={uploading}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit dusun ini"
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteDusun(actualIndex)}
                                disabled={uploading}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Hapus dusun ini"
                              >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Detail Data */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-2">Luas Wilayah</label>
                              <p className="text-xl font-bold text-blue-900">{dusun.luasDusun} <span className="text-sm font-normal">m²</span></p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                              <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide block mb-2">Garis Keliling</label>
                              <p className="text-xl font-bold text-purple-900">{dusun.garisKeliling} <span className="text-sm font-normal">km</span></p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination - Modern & Profesional */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      {/* Previous Button */}
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman sebelumnya"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 transform hover:scale-110 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                : 'border border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
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
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman berikutnya"
                      >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data wilayah</p>
              <p className="text-gray-500">Klik tombol &quot;Buat (Main)&quot; untuk menambah data wilayah</p>
            </div>
          )}
          <div className="flex justify-end gap-4 mt-8">
            {/* Button Buat (Main) - Disabled jika sudah ada data */}
            <button 
              onClick={handleAddMain}
              disabled={wilayahData !== null && !!wilayahData?.deskripsi}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
            >
              Buat (Main)
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {/* Button Buat - Enabled jika sudah ada data main */}
            <button 
              onClick={handleAddDusun}
              disabled={!wilayahData || !wilayahData.deskripsi}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
            >
              Buat
              <svg
                width="20"
                height="20"
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

        {/* Modal Tambah/Edit Wilayah */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-60 p-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {modalType === 'main' 
                  ? 'Formulir Tambah Wilayah' 
                  : editingDusunIndex !== null
                  ? 'Edit Data Dusun'
                  : 'Isi Tabel Luas Wilayah'
                }
              </h2>
              <p className="text-gray-600 mb-8">
                {modalType === 'main' 
                  ? 'Data akan tersimpan di Firebase Firestore. Foto otomatis dikonversi ke format WebP untuk performa optimal.'
                  : editingDusunIndex !== null
                  ? 'Perbarui informasi data dusun yang sudah ada.'
                  : 'Tambahkan data dusun untuk melengkapi informasi wilayah.'
                }
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Deskripsi - Hanya untuk modal main */}
                {modalType === 'main' && (
                  <div>
                    <label className="text-base font-semibold text-gray-700 block mb-3">Deskripsi Wilayah Desa</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Masukkan Deskripsi"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-base"
                      rows={4}
                      required
                    />
                  </div>
                )}

                {/* Upload Foto - Hanya untuk modal main */}
                {modalType === 'main' && (
                  <div>
                    <label className="text-base font-semibold text-gray-700 block mb-3">Upload Foto</label>
                    
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {/* Button Pilih Foto */}
                    {!previewUrl && (
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInput')?.click()}
                        className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
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
                            <p className="text-base font-semibold text-gray-700">Pilih Foto</p>
                            <p className="text-sm text-gray-500 mt-1">Format: JPG, PNG, GIF. Akan dikonversi ke WebP</p>
                          </div>
                        </div>
                      </button>
                    )}
                    
                    {selectedFile && !previewUrl && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ File dipilih: {selectedFile.name} (akan dikonversi ke WebP)
                      </p>
                    )}
                    
                    {/* Preview Foto */}
                    {previewUrl && (
                      <div className="mt-4">
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Preview Foto:</label>
                        <div className="relative">
                          <div 
                            className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-red-500 transition-colors group"
                            onClick={() => setShowImageModal(true)}
                          >
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-800">
                                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {/* Tombol Hapus Preview */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPreviewUrl("");
                              setSelectedFile(null);
                              const input = document.getElementById('fileInput') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10"
                            title="Hapus foto"
                          >
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">Klik untuk melihat ukuran penuh</p>
                        
                        {/* Button Ganti Foto */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('fileInput')?.click();
                          }}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <span>Ganti Foto</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-base disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || (modalType === 'dusun' && (!formData.namaDusun || !formData.luasDusun || !formData.garisKeliling))}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 text-base disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {modalType === 'main' ? 'Menyimpan...' : editingDusunIndex !== null ? 'Memperbarui...' : 'Menambah...'}
                      </>
                    ) : (
                      <span>
                        {modalType === 'main' ? 'Simpan' : editingDusunIndex !== null ? 'Perbarui' : 'Tambah'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Pop-up Foto Full Size */}
        {showImageModal && previewUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors p-2 rounded-full bg-black/50 hover:bg-black/70"
                title="Tutup"
              >
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
              
              {/* Image */}
              <div className="bg-white rounded-2xl p-4 shadow-2xl">
                <img 
                  src={previewUrl} 
                  alt="Full size preview" 
                  className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
