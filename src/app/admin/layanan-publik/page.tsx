"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../lib/logoutHelper";
import { 
  getAllLayananPublik, 
  getLayananByJenis, 
  updateStatusLayanan, 
  LayananPublik,
  getLayananStats 
} from "../../../lib/layananPublikService";

const jenisLayananList = [
  "Surat Kelakuan Baik",
  "Surat Keterangan Belum Nikah/Kawin", 
  "Surat Keterangan Belum Bekerja",
  "Surat Keterangan Kawin/Menikah",
  "Surat Keterangan Kematian",
  "Surat Keterangan Perjalanan",
  "Pelayanan Taring Dukcapil"
];

export default function LayananPublikAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [layananData, setLayananData] = useState<LayananPublik[]>([]);
  const [filteredData, setFilteredData] = useState<LayananPublik[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLayanan, setSelectedLayanan] = useState<LayananPublik | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [actionModal, setActionModal] = useState<{
    show: boolean;
    type: 'terima' | 'tolak' | 'selesai' | null;
    layanan: LayananPublik | null;
  }>({
    show: false,
    type: null,
    layanan: null
  });
  const [actionForm, setActionForm] = useState({
    catatanAdmin: "",
    alasanTolak: ""
  });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllLayananPublik();
      setLayananData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching layanan:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getLayananStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  // Filter data berdasarkan search, jenis, dan status
  useEffect(() => {
    let filtered = layananData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenisLayanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm)
      );
    }

    // Filter by jenis layanan
    if (selectedJenis !== "semua") {
      filtered = filtered.filter(item => item.jenisLayanan === selectedJenis);
    }

    // Filter by status
    if (selectedStatus !== "semua") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedJenis, selectedStatus, layananData]);

  const handleDetailClick = (layanan: LayananPublik) => {
    setSelectedLayanan(layanan);
    setShowDetailModal(true);
  };

  const handleActionClick = (type: 'terima' | 'tolak' | 'selesai', layanan: LayananPublik) => {
    setActionModal({
      show: true,
      type,
      layanan
    });
    setActionForm({ catatanAdmin: "", alasanTolak: "" });
  };

  const processAction = async () => {
    if (!actionModal.layanan || !actionModal.type) return;
    
    try {
      setProcessingAction(true);
      
      let newStatus: LayananPublik['status'];
      switch (actionModal.type) {
        case 'terima':
          newStatus = 'diterima';
          break;
        case 'tolak':
          newStatus = 'ditolak';
          break;
        case 'selesai':
          newStatus = 'selesai';
          break;
        default:
          return;
      }

      await updateStatusLayanan(
        actionModal.layanan.id!,
        newStatus,
        {
          processedBy: "Admin", // Replace with actual admin name
          catatanAdmin: actionForm.catatanAdmin,
          alasanTolak: actionForm.alasanTolak
        }
      );

      await fetchData();
      await fetchStats();
      setActionModal({ show: false, type: null, layanan: null });
      alert(`Layanan berhasil ${actionModal.type === 'terima' ? 'diterima' : actionModal.type === 'tolak' ? 'ditolak' : 'diselesaikan'}!`);
    } catch (error) {
      console.error("Error processing action:", error);
      alert("Terjadi kesalahan saat memproses layanan!");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'diproses': return 'bg-blue-100 text-blue-800';
      case 'diterima': return 'bg-green-100 text-green-800';
      case 'ditolak': return 'bg-red-100 text-red-800';
      case 'selesai': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'diproses': return 'Diproses';
      case 'diterima': return 'Diterima';
      case 'ditolak': return 'Ditolak';
      case 'selesai': return 'Selesai';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminHeaderCard title="Layanan Publik">
          <AdminHeaderSearchBar />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manajemen Layanan Publik
            </h1>
            <p className="text-gray-600">
              Kelola permohonan layanan publik dari masyarakat
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Menunggu</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.diproses}</p>
                  <p className="text-sm text-gray-600">Diproses</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.diterima}</p>
                  <p className="text-sm text-gray-600">Diterima</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.ditolak}</p>
                  <p className="text-sm text-gray-600">Ditolak</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.selesai}</p>
                  <p className="text-sm text-gray-600">Selesai</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIK, atau jenis layanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="semua">Semua Jenis Layanan</option>
                {jenisLayananList.map(jenis => (
                  <option key={jenis} value={jenis}>{jenis}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="semua">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="diproses">Diproses</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* Layanan Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data layanan...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada layanan</h3>
                <p className="text-gray-600">Belum ada permohonan layanan yang masuk</p>
              </div>
            ) : (
              filteredData.map((layanan) => (
                <div key={layanan.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{layanan.jenisLayanan}</h3>
                          <p className="text-sm text-gray-600">{layanan.namaLengkap}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(layanan.status)}`}>
                          {getStatusText(layanan.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">NIK:</span>
                          <span className="ml-2 font-medium">{layanan.nik}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tanggal Upload:</span>
                          <span className="ml-2 font-medium">
                            {layanan.createdAt ? new Date(layanan.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Keperluan:</span>
                          <span className="ml-2 font-medium">{layanan.keperluan || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <button
                        onClick={() => handleDetailClick(layanan)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      >
                        Detail
                      </button>
                      
                      {layanan.status === 'pending' && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleActionClick('terima', layanan)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            Diterima
                          </button>
                          <button
                            onClick={() => handleActionClick('tolak', layanan)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            Di Tolak
                          </button>
                        </div>
                      )}
                      
                      {layanan.status === 'diterima' && (
                        <button
                          onClick={() => handleActionClick('selesai', layanan)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                        >
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedLayanan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Detail Permohonan</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Informasi Pemohon</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nama Lengkap:</strong> {selectedLayanan.namaLengkap}</div>
                      <div><strong>NIK:</strong> {selectedLayanan.nik}</div>
                      <div><strong>No. KK:</strong> {selectedLayanan.noKK}</div>
                      <div><strong>Alamat:</strong> {selectedLayanan.alamat}</div>
                      {selectedLayanan.noTelepon && <div><strong>No. Telepon:</strong> {selectedLayanan.noTelepon}</div>}
                      {selectedLayanan.email && <div><strong>Email:</strong> {selectedLayanan.email}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Detail Layanan</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Jenis Layanan:</strong> {selectedLayanan.jenisLayanan}</div>
                      <div><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedLayanan.status)}`}>
                          {getStatusText(selectedLayanan.status)}
                        </span>
                      </div>
                      <div><strong>Tanggal Permohonan:</strong> 
                        {selectedLayanan.createdAt ? new Date(selectedLayanan.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                      </div>
                      {selectedLayanan.keperluan && <div><strong>Keperluan:</strong> {selectedLayanan.keperluan}</div>}
                      {selectedLayanan.tujuan && <div><strong>Tujuan:</strong> {selectedLayanan.tujuan}</div>}
                    </div>
                  </div>
                </div>

                {/* Additional Information based on jenis layanan */}
                {(selectedLayanan.tempatLahir || selectedLayanan.tanggalLahir || selectedLayanan.jenisKelamin) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Data Pribadi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedLayanan.tempatLahir && <div><strong>Tempat Lahir:</strong> {selectedLayanan.tempatLahir}</div>}
                      {selectedLayanan.tanggalLahir && <div><strong>Tanggal Lahir:</strong> {selectedLayanan.tanggalLahir}</div>}
                      {selectedLayanan.jenisKelamin && <div><strong>Jenis Kelamin:</strong> {selectedLayanan.jenisKelamin}</div>}
                      {selectedLayanan.agama && <div><strong>Agama:</strong> {selectedLayanan.agama}</div>}
                      {selectedLayanan.pekerjaan && <div><strong>Pekerjaan:</strong> {selectedLayanan.pekerjaan}</div>}
                      {selectedLayanan.statusPerkawinan && <div><strong>Status Perkawinan:</strong> {selectedLayanan.statusPerkawinan}</div>}
                    </div>
                  </div>
                )}

                {selectedLayanan.catatanTambahan && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Catatan Tambahan</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedLayanan.catatanTambahan}</p>
                  </div>
                )}

                {selectedLayanan.catatanAdmin && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Catatan Admin</h4>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedLayanan.catatanAdmin}</p>
                  </div>
                )}

                {selectedLayanan.alasanTolak && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Alasan Penolakan</h4>
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{selectedLayanan.alasanTolak}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {actionModal.show && actionModal.layanan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  {actionModal.type === 'terima' ? 'Terima Permohonan' : 
                   actionModal.type === 'tolak' ? 'Tolak Permohonan' : 'Selesaikan Layanan'}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {actionModal.type === 'tolak' ? 'Alasan Penolakan *' : 'Catatan Admin'}
                  </label>
                  <textarea
                    value={actionModal.type === 'tolak' ? actionForm.alasanTolak : actionForm.catatanAdmin}
                    onChange={(e) => setActionForm(prev => ({
                      ...prev,
                      [actionModal.type === 'tolak' ? 'alasanTolak' : 'catatanAdmin']: e.target.value
                    }))}
                    placeholder={
                      actionModal.type === 'tolak' 
                        ? 'Berikan alasan mengapa permohonan ditolak...' 
                        : 'Tambahkan catatan atau instruksi...'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required={actionModal.type === 'tolak'}
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActionModal({ show: false, type: null, layanan: null })}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={processingAction}
                  >
                    Batal
                  </button>
                  <button
                    onClick={processAction}
                    disabled={processingAction || (actionModal.type === 'tolak' && !actionForm.alasanTolak.trim())}
                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      actionModal.type === 'terima' ? 'bg-green-500 hover:bg-green-600' :
                      actionModal.type === 'tolak' ? 'bg-red-500 hover:bg-red-600' :
                      'bg-purple-500 hover:bg-purple-600'
                    }`}
                  >
                    {processingAction ? 'Memproses...' : 
                     actionModal.type === 'terima' ? 'Terima' :
                     actionModal.type === 'tolak' ? 'Tolak' : 'Selesai'}
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