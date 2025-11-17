"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../../lib/logoutHelper";
import AdminLayout from "../../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../../components/AdminHeaderCard";
import {
  getVisiMisiContent,
  saveVisiMisiContent,
  subscribeToVisiMisiContent,
  uploadImageToStorage,
  type VisiMisiContent
} from "../../../../lib/profilDesaService";

export default function VisiMisiDesaAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [visiMisiData, setVisiMisiData] = useState<VisiMisiContent | null>(null);
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [showImageReview, setShowImageReview] = useState<'visi' | 'misi' | null>(null);
  const [showImageModal, setShowImageModal] = useState<'visi' | 'misi' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    visi: "",
    visiImageUrl: "",
    visiImageFile: null as File | null,
    misi: "",
    misiImageUrl: "",
    misiImageFile: null as File | null,
  });

  useEffect(() => {
    const loadVisiMisiData = async () => {
      try {
        const data = await getVisiMisiContent();
        setVisiMisiData(data);
      } catch (error) {
        console.error("Error loading visi misi data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVisiMisiData();

    const unsubscribe = subscribeToVisiMisiContent((data) => {
      setVisiMisiData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    if (visiMisiData) {
      setFormData({
        visi: visiMisiData.visi,
        visiImageUrl: visiMisiData.visiImageUrl,
        visiImageFile: null,
        misi: visiMisiData.misi,
        misiImageUrl: visiMisiData.misiImageUrl,
        misiImageFile: null,
      });
      setShowModal(true);
    }
  };

  const handleAdd = () => {
    setFormData({
      visi: "",
      visiImageUrl: "",
      visiImageFile: null,
      misi: "",
      misiImageUrl: "",
      misiImageFile: null,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Cleanup blob URLs
    if (formData.visiImageUrl && formData.visiImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.visiImageUrl);
    }
    if (formData.misiImageUrl && formData.misiImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.misiImageUrl);
    }
    setShowModal(false);
    setFormData({
      visi: "",
      visiImageUrl: "",
      visiImageFile: null,
      misi: "",
      misiImageUrl: "",
      misiImageFile: null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'visi' | 'misi') => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        [`${imageType}ImageFile`]: file,
        [`${imageType}ImageUrl`]: objectUrl,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.visi.trim() || !formData.misi.trim()) {
      alert("Visi dan Misi tidak boleh kosong");
      return;
    }

    setUploading(true);

    try {
      let visiImageUrl = visiMisiData?.visiImageUrl || "";
      let misiImageUrl = visiMisiData?.misiImageUrl || "";

      // Upload Visi image if selected - akan otomatis dikonversi ke WebP
      if (formData.visiImageFile) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_visi.webp`;
        visiImageUrl = await uploadImageToStorage(
          formData.visiImageFile,
          fileName
        );
      } else if (formData.visiImageUrl && !formData.visiImageUrl.startsWith('blob:')) {
        visiImageUrl = formData.visiImageUrl;
      }

      // Upload Misi image if selected - akan otomatis dikonversi ke WebP
      if (formData.misiImageFile) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_misi.webp`;
        misiImageUrl = await uploadImageToStorage(
          formData.misiImageFile,
          fileName
        );
      } else if (formData.misiImageUrl && !formData.misiImageUrl.startsWith('blob:')) {
        misiImageUrl = formData.misiImageUrl;
      }

      await saveVisiMisiContent({
        visi: formData.visi,
        visiImageUrl,
        misi: formData.misi,
        misiImageUrl,
      });

      handleCloseModal();
      alert("Data visi & misi berhasil disimpan!");
    } catch (error) {
      console.error("Error saving visi misi data:", error);
      alert("Gagal menyimpan data visi & misi");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus SEMUA data visi & misi? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    setUploading(true);
    try {
      await saveVisiMisiContent({
        visi: "",
        visiImageUrl: "",
        misi: "",
        misiImageUrl: "",
      });

      setVisiMisiData(null);
      alert("Data visi & misi berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting visi misi data:", error);
      alert("Gagal menghapus data visi & misi");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <AdminHeaderCard title="Visi & Misi Desa">
          <AdminHeaderSearchBar />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>

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
          {visiMisiData && visiMisiData.visi ? (
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden p-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-8">Visi & Misi Desa</h2>

                {/* Visi Section */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Visi</h3>
                  <p className="text-gray-700 text-base leading-relaxed mb-4">
                    {visiMisiData.visi}
                  </p>
                  {visiMisiData.visiImageUrl && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowImageReview('visi')}
                        className="inline-block rounded-lg overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        <img
                          src={visiMisiData.visiImageUrl}
                          alt="Visi"
                          className="h-32 w-auto object-cover"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Misi Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Misi</h3>
                  <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap mb-4">
                    {visiMisiData.misi}
                  </p>
                  {visiMisiData.misiImageUrl && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowImageReview('misi')}
                        className="inline-block rounded-lg overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      >
                        <img
                          src={visiMisiData.misiImageUrl}
                          alt="Misi"
                          className="h-32 w-auto object-cover"
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
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
                    onClick={handleDelete}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg bg-red-200 text-red-700 font-semibold flex items-center gap-1 hover:bg-red-300 transition-colors transform hover:scale-105 disabled:opacity-50"
                  >
                    Hapus
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data visi & misi</p>
              <p className="text-gray-500">Klik tombol &quot;Buat&quot; untuk menambah data visi & misi</p>
            </div>
          )}

          <div className="flex justify-end mt-8">
            {!visiMisiData || !visiMisiData.visi ? (
              <button
                onClick={handleAdd}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
            ) : null}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            ></div>
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-60 p-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {visiMisiData && visiMisiData.visi ? "Edit Visi & Misi Desa" : "Buat Visi & Misi Desa"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Visi */}
                <div>
                  <label className="text-base font-semibold text-gray-700 block mb-3">
                    Visi Desa
                  </label>
                  <textarea
                    name="visi"
                    value={formData.visi}
                    onChange={handleInputChange}
                    placeholder="Masukkan visi desa..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-base"
                    rows={4}
                    required
                  />
                  <div className="mt-3">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Foto Visi (Opsional)
                    </label>
                    
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      id="fileInputVisi"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'visi')}
                      className="hidden"
                    />
                    
                    {/* Button Pilih Foto atau Preview */}
                    {!formData.visiImageUrl ? (
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInputVisi')?.click()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-600">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <path d="M21 15l-5-5L5 21"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Pilih Foto</span>
                        </div>
                      </button>
                    ) : (
                      <div className="relative">
                        <div 
                          className="relative rounded-xl overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-red-500 transition-colors group"
                          onClick={() => setShowImageModal('visi')}
                        >
                          <img
                            src={formData.visiImageUrl}
                            alt="Preview Visi"
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-800">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (formData.visiImageUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(formData.visiImageUrl);
                            }
                            setFormData(prev => ({ ...prev, visiImageUrl: "", visiImageFile: null }));
                            const input = document.getElementById('fileInputVisi') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">Klik untuk melihat ukuran penuh</p>
                        
                        {/* Button Ganti Foto */}
                        <button
                          type="button"
                          onClick={() => document.getElementById('fileInputVisi')?.click()}
                          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <span>Ganti Foto</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Misi */}
                <div>
                  <label className="text-base font-semibold text-gray-700 block mb-3">
                    Misi Desa
                  </label>
                  <textarea
                    name="misi"
                    value={formData.misi}
                    onChange={handleInputChange}
                    placeholder="Masukkan misi desa..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-base"
                    rows={6}
                    required
                  />
                  <div className="mt-3">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Foto Misi (Opsional)
                    </label>
                    
                    {/* Hidden File Input */}
                    <input
                      type="file"
                      id="fileInputMisi"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'misi')}
                      className="hidden"
                    />
                    
                    {/* Button Pilih Foto atau Preview */}
                    {!formData.misiImageUrl ? (
                      <button
                        type="button"
                        onClick={() => document.getElementById('fileInputMisi')?.click()}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-red-100 group-hover:bg-red-200 transition-colors">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-600">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <path d="M21 15l-5-5L5 21"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Pilih Foto</span>
                        </div>
                      </button>
                    ) : (
                      <div className="relative">
                        <div 
                          className="relative rounded-xl overflow-hidden border-2 border-gray-300 cursor-pointer hover:border-red-500 transition-colors group"
                          onClick={() => setShowImageModal('misi')}
                        >
                          <img
                            src={formData.misiImageUrl}
                            alt="Preview Misi"
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-800">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (formData.misiImageUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(formData.misiImageUrl);
                            }
                            setFormData(prev => ({ ...prev, misiImageUrl: "", misiImageFile: null }));
                            const input = document.getElementById('fileInputMisi') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-2 text-center">Klik untuk melihat ukuran penuh</p>
                        
                        {/* Button Ganti Foto */}
                        <button
                          type="button"
                          onClick={() => document.getElementById('fileInputMisi')?.click()}
                          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <span>Ganti Foto</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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
                    disabled={uploading}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 text-base disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {visiMisiData && visiMisiData.visi ? "Memperbarui..." : "Menyimpan..."}
                      </>
                    ) : (
                      <span>
                        {visiMisiData && visiMisiData.visi ? "Perbarui" : "Simpan"}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Pop-up Foto Full Size */}
        {showImageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowImageModal(null)}
            ></div>
            
            {/* Modal Content */}
            <div className="relative z-10 max-w-5xl max-h-[90vh] w-full">
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(null)}
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
                  src={showImageModal === 'visi' ? formData.visiImageUrl : formData.misiImageUrl} 
                  alt={`Full size ${showImageModal}`} 
                  className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Review Modal (for existing images in display) */}
        {showImageReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowImageReview(null)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden z-60 max-w-2xl max-h-[80vh]">
              <button
                onClick={() => setShowImageReview(null)}
                className="absolute top-4 right-4 z-70 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={showImageReview === 'visi' ? visiMisiData?.visiImageUrl : visiMisiData?.misiImageUrl}
                alt={`Review ${showImageReview}`}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
