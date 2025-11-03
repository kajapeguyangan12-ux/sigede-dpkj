"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, {
  AdminHeaderSearchBar,
  AdminHeaderAccount,
} from "../../components/AdminHeaderCard";
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { db as firestore } from "../../../lib/firebase";

// Interface untuk data IKM
interface IKMData {
  id: string;
  namaPengisi: string;
  nik: string;
  jenisLayanan: string;
  tanggalPengisian: Date;
  rating: number;
  komentar?: string;
  pertanyaan: {
    [key: string]: number; // key: pertanyaan, value: rating 1-5
  };
}

export default function IKMPage() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [ikmData, setIkmData] = useState<IKMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIKM, setSelectedIKM] = useState<IKMData | null>(null);

  useEffect(() => {
    loadIKMData();
  }, []);

  const loadIKMData = async () => {
    try {
      setLoading(true);
      const ikmCollection = collection(firestore, "ikm-survey");
      const q = query(ikmCollection, orderBy("tanggalPengisian", "desc"));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          namaPengisi: docData.namaPengisi || "-",
          nik: docData.nik || "-",
          jenisLayanan: docData.jenisLayanan || "-",
          tanggalPengisian: docData.tanggalPengisian?.toDate() || new Date(),
          rating: docData.rating || 0,
          komentar: docData.komentar || "",
          pertanyaan: docData.pertanyaan || {},
        } as IKMData;
      });
      
      setIkmData(data);
    } catch (error) {
      console.error("Error loading IKM data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(firestore, "ikm-survey", deletingId));
      await loadIKMData();
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting IKM:", error);
      alert("Gagal menghapus data IKM");
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (ikm: IKMData) => {
    setSelectedIKM(ikm);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["Nama Pengisi", "NIK", "Jenis Layanan", "Rating", "Tanggal", "Komentar"];
    const csvData = ikmData.map(item => [
      item.namaPengisi,
      item.nik,
      item.jenisLayanan,
      item.rating,
      item.tanggalPengisian.toLocaleDateString('id-ID'),
      item.komentar || "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `IKM_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    try {
      await logout("admin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Filter data berdasarkan search
  const filteredData = ikmData.filter(
    (item) =>
      item.namaPengisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenisLayanan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate average rating
  const averageRating = ikmData.length > 0
    ? (ikmData.reduce((sum, item) => sum + item.rating, 0) / ikmData.length).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data IKM...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <AdminHeaderCard title="Data IKM">
            <AdminHeaderSearchBar />
            <AdminHeaderAccount onLogout={handleLogout} />
          </AdminHeaderCard>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Kuesioner</p>
                  <h3 className="text-3xl font-bold text-gray-900">{ikmData.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Rating Rata-rata</p>
                  <h3 className="text-3xl font-bold text-gray-900">{averageRating}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Kepuasan</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {averageRating >= "4.0" ? "Baik" : averageRating >= "3.0" ? "Cukup" : "Perlu Perbaikan"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Export */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export IKM
              </button>
            </div>
          </div>

          {/* List Hasil Kuesioner */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">List Hasil Kuesioner</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Pengisi</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">NIK</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Jenis Layanan</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Rating</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">Belum ada data IKM</p>
                          <p className="text-sm">Data kuesioner kepuasan masyarakat akan muncul di sini</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{item.namaPengisi}</p>
                            <p className="text-sm text-gray-500">{item.tanggalPengisian.toLocaleDateString('id-ID')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{item.nik}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {item.jenisLayanan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-700">({item.rating})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => handleView(item)}
                              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Modern & Elegant */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center">Konfirmasi Hapus</h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-center text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data IKM ini?</p>
              <p className="text-center text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingId(null);
                }}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menghapus...
                  </span>
                ) : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Modern & Elegant */}
      {showDetailModal && selectedIKM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            {/* Header with gradient and pattern */}
            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 p-6 text-white overflow-hidden flex-shrink-0">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Detail IKM</h3>
                    <p className="text-blue-100 text-sm mt-1">Hasil Survei Kepuasan Masyarakat</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedIKM(null);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-all backdrop-blur-sm flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content with modern cards - SCROLLABLE */}
            <div className="p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto flex-1">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Nama Pengisi</p>
                  </div>
                  <p className="font-bold text-gray-900 text-base ml-13 truncate">{selectedIKM.namaPengisi}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">NIK</p>
                  </div>
                  <p className="font-bold text-gray-900 text-base ml-13">{selectedIKM.nik}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-green-300 transition-all hover:shadow-lg group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Jenis Layanan</p>
                  </div>
                  <p className="font-bold text-gray-900 text-base ml-13">{selectedIKM.jenisLayanan}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-orange-300 transition-all hover:shadow-lg group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Tanggal</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm ml-13">{selectedIKM.tanggalPengisian.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Rating Section with animation */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 border-2 border-yellow-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating Keseluruhan</p>
                    <p className="text-xs text-gray-500">Kepuasan terhadap pelayanan</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-8 h-8 transition-all duration-300 ${i < selectedIKM.rating ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{selectedIKM.rating}</span>
                    <span className="text-xl font-semibold text-gray-600">/5</span>
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              {selectedIKM.komentar && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Komentar & Saran</p>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-l-4 border-indigo-500">
                    <p className="text-gray-700 italic leading-relaxed text-sm">&ldquo;{selectedIKM.komentar}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Detailed Ratings */}
              {Object.keys(selectedIKM.pertanyaan).length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Detail Penilaian Per Aspek</p>
                      <p className="text-xs text-gray-500">Breakdown rating untuk setiap pertanyaan</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedIKM.pertanyaan).map(([pertanyaan, nilai], index) => (
                      <div key={pertanyaan} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl p-3 transition-all border border-transparent hover:border-blue-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-2 flex-1 min-w-0">
                            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
                              {index + 1}
                            </span>
                            <span className="text-xs text-gray-700 font-medium leading-relaxed line-clamp-2">{pertanyaan}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 transition-all ${i < nilai ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">
                              {nilai}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with action button */}
            <div className="p-5 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedIKM(null);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tutup
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
