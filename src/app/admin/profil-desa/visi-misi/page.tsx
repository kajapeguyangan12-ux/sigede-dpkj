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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageReview, setShowImageReview] = useState<'visi' | 'misi' | null>(null);
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          [`${imageType}ImageFile`]: file,
          [`${imageType}ImageUrl`]: imageUrl,
        }));
      };
      reader.readAsDataURL(file);
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

      // Upload Visi image if selected
      if (formData.visiImageFile) {
        visiImageUrl = await uploadImageToStorage(
          formData.visiImageFile,
          `visi-misi/visi-${Date.now()}`
        );
      } else if (formData.visiImageUrl && !formData.visiImageUrl.startsWith('data:')) {
        visiImageUrl = formData.visiImageUrl;
      }

      // Upload Misi image if selected
      if (formData.misiImageFile) {
        misiImageUrl = await uploadImageToStorage(
          formData.misiImageFile,
          `visi-misi/misi-${Date.now()}`
        );
      } else if (formData.misiImageUrl && !formData.misiImageUrl.startsWith('data:')) {
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data visi & misi...</p>
            </div>
          ) : visiMisiData && visiMisiData.visi ? (
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'visi')}
                      className="block w-full text-sm text-gray-600 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 transition-colors"
                    />
                    {formData.visiImageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img
                          src={formData.visiImageUrl}
                          alt="Preview Visi"
                          className="max-h-40 w-auto"
                        />
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'misi')}
                      className="block w-full text-sm text-gray-600 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 transition-colors"
                    />
                    {formData.misiImageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img
                          src={formData.misiImageUrl}
                          alt="Preview Misi"
                          className="max-h-40 w-auto"
                        />
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

        {/* Image Review Modal */}
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
