"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, {
  AdminHeaderSearchBar,
  AdminHeaderAccount,
} from "../../components/AdminHeaderCard";
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

export default function RegulasiDesaPage() {
  const router = useRouter();
  const { logout } = useAuth();
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data regulasi desa...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Enhanced AdminHeaderCard with better styling */}
        <div className="w-full bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-8 -mt-10 md:-mt-14 lg:-mt-16 z-50 relative backdrop-blur-sm overflow-hidden">
          {/* Floating Background Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 rounded-full blur-lg animate-pulse delay-500"></div>
          {/* Enhanced Title Section */}
          {/* Enhanced Controls Section */}
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                Kelola Regulasi Desa
              </h1>
              <p className="text-slate-600 font-medium text-lg">
                Manajemen peraturan desa dan kelurahan
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  {regulasiData.length} Total Regulasi
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {stats.berlaku} Aktif
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Title Section */}
          <div className="flex items-center gap-6 relative z-10">
            {/* Enhanced Search Bar */}
            <div className="flex items-center w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-300/50 px-5 py-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group">
              <input
                type="text"
                placeholder="Cari regulasi, nomor, atau jenis..."
                className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-500"
              />
              <svg
                className="ml-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            
            {/* Enhanced Account Section */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer shadow-md">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="text-gray-600"
                >
                  <path d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5h2A5.5 5.5 0 0110 10z"/>
                </svg>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg group"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className="text-red-600 group-hover:text-red-700"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter Section */}
          <div className="mb-8 bg-white rounded-2xl shadow-md p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari regulasi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-medium"
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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Regulasi
                </button>
              </div>
            </div>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total</p>
                  <p className="text-4xl font-bold">{regulasiData.length}</p>
                  <p className="text-blue-100 text-xs mt-1">Regulasi</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Perdes</p>
                  <p className="text-4xl font-bold">{stats.totalPerdes}</p>
                  <p className="text-green-100 text-xs mt-1">Peraturan</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Perkel</p>
                  <p className="text-4xl font-bold">{stats.totalPerkel}</p>
                  <p className="text-purple-100 text-xs mt-1">Peraturan</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium mb-1">Berlaku</p>
                  <p className="text-4xl font-bold">{stats.berlaku}</p>
                  <p className="text-amber-100 text-xs mt-1">Tidak: {stats.tidakBerlaku}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari regulasi (judul, nomor, tentang)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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

              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-medium"
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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Regulasi
                </button>
              </div>
            </div>
          </div>

          {/* Regulasi List */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-6">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Regulasi
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nomor & Tahun
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Judul / Tentang
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            No. {item.nomor}
                          </div>
                          <div className="text-sm text-gray-500">
                            Tahun {item.tahun}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            {item.judul}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.tentang}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.kategori === "perdes"
                              ? "bg-blue-100 text-blue-800"
                              : item.kategori === "peraturan_bersama"
                              ? "bg-purple-100 text-purple-800"
                              : item.kategori === "keputusan_kepala_desa"
                              ? "bg-green-100 text-green-800"
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === "aktif"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.status === "aktif" ? "Berlaku" : "Tidak Berlaku"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(item.tanggalDitetapkan).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {item.filePdf && (
                              <a
                                href={item.filePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                title="Lihat PDF"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
    </AdminLayout>
  );
}
