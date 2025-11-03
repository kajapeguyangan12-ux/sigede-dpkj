"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../../components/AdminHeaderCard";
import { 
  getSejarahContent, 
  saveSejarahContent, 
  uploadImageToStorage,
  subscribeToSejarahContent,
  type SejarahContent 
} from "../../../../lib/profilDesaService";

export default function SejarahDesaAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [sejarahData, setSejarahData] = useState<SejarahContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      
      // Upload foto jika ada file yang dipilih
      if (selectedFile) {
        const fileName = `sejarah-${Date.now()}`;
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

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };


  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <AdminHeaderCard title="Sejarah Desa">
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data sejarah...</p>
            </div>
          ) : sejarahData && sejarahData.deskripsi ? (
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Foto Preview */}
                <div className="w-full sm:w-48 h-48 sm:h-auto bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold overflow-hidden flex-shrink-0">
                  {sejarahData.fotoUrl ? (
                    <img 
                      src={sejarahData.fotoUrl} 
                      alt="Foto Sejarah" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">📚</span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 px-6 sm:px-8 py-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">Sejarah Desa</h2>
                  <p className="text-gray-700 text-base leading-relaxed mb-6">
                    {sejarahData.deskripsi}
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
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">Belum ada data sejarah</p>
              <p className="text-gray-500">Klik tombol &quot;Buat&quot; untuk menambah data sejarah</p>
            </div>
          )}
          
          <div className="flex justify-end mt-8">
            {!sejarahData || !sejarahData.deskripsi ? (
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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-60 p-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {sejarahData && sejarahData.deskripsi ? 'Edit Sejarah Desa' : 'Buat Sejarah Desa'}
              </h2>
              <p className="text-gray-600 mb-8">
                Foto otomatis dikonversi ke format WebP untuk performa optimal.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-7">
                {/* Upload Foto */}
                <div>
                  <label className="text-base font-semibold text-gray-700 block mb-3">Upload Foto</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex-1 px-5 py-4 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 focus:outline-none focus:border-red-500 transition-colors text-base"
                    />
                    <button
                      type="button"
                      className="p-4 rounded-2xl bg-gray-200 hover:bg-gray-300 transition-colors"
                      title="Foto akan otomatis dikonversi ke format WebP"
                    >
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-600">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Foto Preview */}
                {previewUrl && (
                  <div>
                    <label className="text-base font-semibold text-gray-700 block mb-3">Preview Foto</label>
                    <div className="rounded-2xl overflow-hidden border border-gray-300 bg-gray-100 p-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ File dipilih: {selectedFile.name} (akan dikonversi ke WebP)
                      </p>
                    )}
                  </div>
                )}

                {/* Deskripsi */}
                <div>
                  <label className="text-base font-semibold text-gray-700 block mb-3">Detail Sejarah Desa</label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    placeholder="Masukkan detail sejarah desa..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white transition-colors text-base"
                    rows={6}
                    required
                  />
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
        )}
      </div>
    </AdminLayout>
  );
}