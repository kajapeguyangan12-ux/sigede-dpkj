"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/AdminLayout";
import { FileText, Plus, Edit, Eye, Trash2, ArrowLeft } from 'lucide-react';
import FormTambahRegulasi, {
  type RegulasiFormData,
} from "./components/FormTambahRegulasi";
import {
  addRegulasiDesa,
  updateRegulasiDesa,
  deleteRegulasiDesa,
  uploadPdfToStorage,
  uploadDiagramToStorage,
  subscribeToRegulasiDesa,
  getRegulasiStats,
  type RegulasiDesa,
  type RegulasiStats,
} from "../../../lib/regulasiService";

// Custom animations and mobile optimizations
const customStyles = `
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
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-slide-up {
    animation: slideUp 0.5s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  .animate-card-entrance {
    animation: cardEntrance 0.6s ease-out;
  }

  /* iOS safe area support */
  .safe-area-padding {
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  /* Touch optimizations */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  button, a {
    user-select: none;
    -webkit-user-select: none;
  }

  input, textarea, select {
    user-select: text;
    -webkit-user-select: text;
  }
`

export default function RegulasiDesaPage() {
  const router = useRouter();
  const [regulasiData, setRegulasiData] = useState<RegulasiDesa[]>([]);
  const [stats, setStats] = useState<RegulasiStats>({
    totalPerkel: 0,
    totalPerdes: 0,
    berlaku: 0,
    tidakBerlaku: 0,
  });
  const [loading, setLoading] = useState(false); // Only for data operations
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedDiagramFile, setSelectedDiagramFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "aktif" | "tidak_aktif">("semua");

  useEffect(() => {
    const unsubscribe = subscribeToRegulasiDesa((data) => {
      setRegulasiData(data);
      setLoading(false);
    });

    loadStats();

    return () => unsubscribe();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getRegulasiStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleFormSubmit = async (formData: RegulasiFormData, pdfFile?: File | null) => {
    setUploading(true);

    try {
      // Auto-generate judul if not provided
      if (!formData.judul) {
        const kategoriText =
          formData.kategori === "perdes"
            ? "Peraturan Desa"
            : formData.kategori === "peraturan_bersama"
            ? "Peraturan Bersama"
            : formData.kategori === "keputusan_kepala_desa"
            ? "Keputusan Kepala Desa"
            : "Regulasi";
        formData.judul = `${kategoriText} Nomor ${formData.nomor} Tahun ${formData.tahun} tentang ${formData.tentang}`;
      }

      let pdfUrl = "";
      let diagramUrl = "";

      if (editingId) {
        const existing = regulasiData.find((item) => item.id === editingId);
        pdfUrl = existing?.filePdf || "";
        diagramUrl = existing?.diagramUrl || "";
      }

      // Upload file dari form (pdfFile parameter)
      if (pdfFile) {
        pdfUrl = await uploadPdfToStorage(
          pdfFile,
          `regulasi-${formData.nomor}-${Date.now()}`
        );
      }

      // Upload file dari state page (untuk backward compatibility)
      if (selectedPdfFile && !pdfFile) {
        pdfUrl = await uploadPdfToStorage(
          selectedPdfFile,
          `regulasi-${formData.nomor}-${Date.now()}`
        );
      }

      if (selectedDiagramFile) {
        diagramUrl = await uploadDiagramToStorage(
          selectedDiagramFile,
          `diagram-${formData.nomor}-${Date.now()}`
        );
      }

      const data = {
        ...formData,
        filePdf: pdfUrl,
        diagramUrl: diagramUrl,
      };

      if (editingId) {
        await updateRegulasiDesa(editingId, data);
      } else {
        await addRegulasiDesa(data);
      }

      await loadStats();
      setShowModal(false);
      setSelectedPdfFile(null);
      setSelectedDiagramFile(null);
      setEditingId(null);
      alert("Data regulasi desa berhasil disimpan!");
    } catch (error) {
      console.error("Error saving regulasi:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: RegulasiDesa) => {
    setEditingId(item.id);
    setSelectedPdfFile(null);
    setSelectedDiagramFile(null);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setDeleting(true);
    try {
      await deleteRegulasiDesa(deletingId);
      await loadStats();
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting regulasi:", error);
      alert("Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredData = regulasiData.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tentang.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "semua" || item.status === filterStatus;

    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data regulasi desa...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 p-3 sm:p-4 md:p-6 safe-area-padding">
        <div className="max-w-7xl mx-auto">
          {/* Custom Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 animate-slide-up">
            <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Kelola Regulasi Desa
              </h1>
            </div>
            <p className="text-red-50 text-xs sm:text-sm md:text-base ml-0 sm:ml-14 md:ml-16 mb-3 sm:mb-4">
              Manajemen peraturan desa dan kelurahan
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 ml-0 sm:ml-14 md:ml-16">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium bg-white/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                {regulasiData.length} Total Regulasi
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium bg-white/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                {stats.berlaku} Aktif
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 animate-fade-in">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 text-white transform hover:scale-105 transition-all duration-300 active:scale-[0.98]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-100 text-xs sm:text-sm font-medium mb-1">Total</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{regulasiData.length}</p>
                  <p className="text-red-100 text-xs mt-0.5 sm:mt-1">Regulasi</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 sm:p-3 md:p-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 text-white transform hover:scale-105 transition-all duration-300 active:scale-[0.98]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-100 text-xs sm:text-sm font-medium mb-1">Perdes</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{stats.totalPerdes}</p>
                  <p className="text-red-100 text-xs mt-0.5 sm:mt-1">Peraturan</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 sm:p-3 md:p-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 text-white transform hover:scale-105 transition-all duration-300 active:scale-[0.98]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-rose-100 text-xs sm:text-sm font-medium mb-1">Perkel</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{stats.totalPerkel}</p>
                  <p className="text-rose-100 text-xs mt-0.5 sm:mt-1">Peraturan</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 sm:p-3 md:p-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 text-white transform hover:scale-105 transition-all duration-300 active:scale-[0.98]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-100 text-xs sm:text-sm font-medium mb-1">Berlaku</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{stats.berlaku}</p>
                  <p className="text-red-100 text-xs mt-0.5 sm:mt-1">Tidak: {stats.tidakBerlaku}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 sm:p-3 md:p-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-red-100 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 animate-card-entrance">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari regulasi (judul, nomor, tentang)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all text-sm sm:text-base"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:outline-none transition-colors font-medium text-sm sm:text-base text-gray-900"
                >
                  <option value="semua">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="tidak_aktif">Tidak Aktif</option>
                </select>

                <button
                  onClick={() => {
                    setEditingId(null);
                    setSelectedPdfFile(null);
                    setSelectedDiagramFile(null);
                    setShowModal(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-[0.98] flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Tambah Regulasi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Regulasi List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-red-100 overflow-hidden animate-card-entrance">
            {filteredData.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-500" />
                </div>
                <p className="text-gray-500 text-base sm:text-lg mb-4 sm:mb-6">
                  {searchTerm || filterStatus !== "semua"
                    ? "Tidak ada regulasi yang sesuai dengan filter"
                    : "Belum ada regulasi desa"}
                </p>
                {!searchTerm && filterStatus === "semua" && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setSelectedPdfFile(null);
                      setSelectedDiagramFile(null);
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98] inline-flex items-center gap-2 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Tambah Regulasi</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-red-50 to-rose-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Nomor & Tahun
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Judul / Tentang
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-red-50 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              No. {item.nomor}
                            </div>
                            <div className="text-sm text-gray-500">
                              Tahun {item.tahun}
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-md">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {item.judul}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {item.tentang}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.kategori === "perdes"
                                ? "bg-red-100 text-red-800"
                                : item.kategori === "peraturan_bersama"
                                ? "bg-rose-100 text-rose-800"
                                : item.kategori === "keputusan_kepala_desa"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {item.kategori === "perdes"
                                ? "Perdes"
                                : item.kategori === "peraturan_bersama"
                                ? "Peraturan Bersama"
                                : item.kategori === "keputusan_kepala_desa"
                                ? "Keputusan"
                                : "Lainnya"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === "aktif"
                                ? "bg-red-100 text-red-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {item.status === "aktif" ? "Berlaku" : "Tidak Berlaku"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(item.tanggalDitetapkan).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {item.filePdf && (
                                <a
                                  href={item.filePdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                                  title="Lihat PDF"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <div key={item.id} className="p-4 hover:bg-red-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            item.status === "aktif"
                              ? "bg-red-100 text-red-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.status === "aktif" ? "Berlaku" : "Tidak Berlaku"}
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          item.kategori === "perdes"
                            ? "bg-red-100 text-red-800"
                            : item.kategori === "peraturan_bersama"
                            ? "bg-rose-100 text-rose-800"
                            : item.kategori === "keputusan_kepala_desa"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {item.kategori === "perdes"
                            ? "Perdes"
                            : item.kategori === "peraturan_bersama"
                            ? "Peraturan Bersama"
                            : item.kategori === "keputusan_kepala_desa"
                            ? "Keputusan"
                            : "Lainnya"}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-sm font-bold text-red-600 mb-1">
                          No. {item.nomor} / Tahun {item.tahun}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {item.judul}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.tentang}
                        </p>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        📅 {new Date(item.tanggalDitetapkan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium active:scale-[0.98]"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        {item.filePdf && (
                          <a
                            href={item.filePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium active:scale-[0.98]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Lihat</span>
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors active:scale-[0.98]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
              <div className="w-full flex items-center justify-center min-h-screen">
                <FormTambahRegulasi
                  onSubmit={handleFormSubmit}
                  onCancel={() => setShowModal(false)}
                  initialData={
                    editingId
                      ? regulasiData.find((r) => r.id === editingId)
                      : undefined
                  }
                  isLoading={uploading}
                />
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowDeleteConfirm(false)}
              ></div>
              <div className="bg-white rounded-2xl w-full max-w-md relative z-60 shadow-2xl overflow-hidden">
                <div className="p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Hapus Regulasi?
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Regulasi ini akan dihapus secara permanen beserta file yang terkait.
                    Tindakan ini tidak dapat dibatalkan.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Menghapus...
                        </>
                      ) : (
                        "Ya, Hapus"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
