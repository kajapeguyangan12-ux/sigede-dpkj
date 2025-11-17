"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from "../components/AdminLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../lib/logoutHelper";
import { 
  getAllLayananPublik, 
  updateStatusLayanan, 
  LayananPublik,
  getLayananStats,
  approveByAdmin,
  approveByKadus,
  approveByKades,
  markAsCompleted
} from "../../../lib/layananPublikService";
import { getDataDesa } from "../../../lib/dataDesaService";

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
  const { logout, user } = useAuth();
  const [layananData, setLayananData] = useState<LayananPublik[]>([]);
  const [filteredData, setFilteredData] = useState<LayananPublik[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("semua");
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLayanan, setSelectedLayanan] = useState<LayananPublik | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [userDaerah, setUserDaerah] = useState<string>("");

  useEffect(() => {
    fetchUserDaerah();
    fetchData();
    fetchStats();
  }, [user]);

  // Fetch daerah user dari data-desa berdasarkan NIK (hanya untuk kepala_dusun)
  const fetchUserDaerah = async () => {
    if (user?.role === 'kepala_dusun' && user?.nik) {
      try {
        const allData = await getDataDesa();
        const userData = allData.find(d => d.nik === user.nik);
        if (userData?.daerah) {
          setUserDaerah(userData.daerah);
        }
      } catch (error) {
        console.error("Error fetching user daerah:", error);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAllLayananPublik();
      
      // Filter berdasarkan role
      let filtered = data;
      
      // Kepala Dusun: hanya lihat layanan dari daerah mereka
      if (user?.role === 'kepala_dusun' && userDaerah) {
        filtered = data.filter(layanan => layanan.daerah === userDaerah);
      }
      
      // Kepala Desa: lihat semua layanan yang sudah approved_kadus atau auto_approved
      // (tidak tergantung daerah, menunggu kadus approve saja)
      if (user?.role === 'kepala_desa') {
        filtered = data.filter(layanan => 
          layanan.status === 'approved_kadus' || 
          layanan.status === 'auto_approved'
        );
      }
      
      setLayananData(filtered);
      setFilteredData(filtered);
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

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenisLayanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm)
      );
    }

    if (selectedJenis !== "semua") {
      filtered = filtered.filter(item => item.jenisLayanan === selectedJenis);
    }

    if (selectedStatus !== "semua") {
      filtered = filtered.filter(item => item.status.includes(selectedStatus));
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedJenis, selectedStatus, layananData]);

  const handleDetailClick = (layanan: LayananPublik) => {
    setSelectedLayanan(layanan);
    setShowDetailModal(true);
  };

  const handleApprove = async (layananId: string, role: string) => {
    try {
      setProcessingAction(true);
      if (role === 'admin_desa') {
        await approveByAdmin(layananId, {});
      } else if (role === 'kepala_dusun') {
        await approveByKadus(layananId, {});
      } else if (role === 'kepala_desa') {
        await approveByKades(layananId, {});
      }
      await fetchData();
      setShowDetailModal(false);
      alert('Permohonan berhasil disetujui!');
    } catch (error) {
      console.error("Error approving:", error);
      alert('Gagal menyetujui permohonan');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTolak = async (layananId: string, alasan: string) => {
    try {
      setProcessingAction(true);
      await updateStatusLayanan(layananId, 'ditolak', { alasanTolak: alasan });
      await fetchData();
      setShowDetailModal(false);
      alert('Permohonan ditolak');
    } catch (error) {
      console.error("Error rejecting:", error);
      alert('Gagal menolak permohonan');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status.includes('approved')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'ditolak') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending_admin': 'Menunggu Admin',
      'approved_admin': 'Disetujui Admin',
      'pending_kadus': 'Menunggu Kadus',
      'approved_kadus': 'Disetujui Kadus',
      'pending_kades': 'Menunggu Kades',
      'approved_kades': 'Disetujui Kades',
      'completed': 'Selesai',
      'ditolak': 'Ditolak'
    };
    return statusMap[status] || status;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
        {/* Modern Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Layanan Publik
                </h1>
                <p className="text-gray-600 mt-1">Kelola permohonan layanan masyarakat</p>
                {user?.role === 'kepala_dusun' && userDaerah && (
                  <p className="text-sm text-purple-600 font-semibold mt-1">
                    📍 Daerah: {userDaerah}
                  </p>
                )}
                {user?.role === 'kepala_desa' && (
                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    👁️ Melihat semua daerah (menunggu approval Kadus)
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-yellow-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Menunggu</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Diproses</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.diproses || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-green-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Selesai</p>
                  <p className="text-3xl font-bold text-green-600">{stats.selesai || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Ditolak</p>
                  <p className="text-3xl font-bold text-red-600">{stats.ditolak || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama, NIK, atau jenis layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-gray-900"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-900"
            >
              <option value="semua">Semua Jenis Layanan</option>
              {jenisLayananList.map(jenis => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-gray-900"
            >
              <option value="semua">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="completed">Selesai</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Layanan Table - Modern Design */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Jenis Layanan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Pemohon</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">NIK</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Daerah</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 font-semibold">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada layanan</h3>
                      <p className="text-gray-600">Belum ada permohonan layanan yang masuk</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((layanan, index) => (
                    <tr key={layanan.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900">{layanan.jenisLayanan}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{layanan.namaLengkap}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">{layanan.nik}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{layanan.daerah || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {layanan.createdAt ? new Date(layanan.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(layanan.status)}`}>
                          {getStatusText(layanan.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDetailClick(layanan)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modern Detail Modal */}
        {showDetailModal && selectedLayanan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full my-8 shadow-2xl border-2 border-purple-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Detail Permohonan Layanan</h3>
                    <p className="text-purple-100 mt-1">Informasi lengkap permohonan</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <span className={`px-6 py-3 text-lg font-bold rounded-full border-2 ${getStatusColor(selectedLayanan.status)}`}>
                    {getStatusText(selectedLayanan.status)}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informasi Pemohon */}
                  <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                    <h4 className="font-bold text-lg text-purple-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Pemohon
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">Nama Lengkap:</span>
                        <p className="text-gray-900 font-bold mt-1">{selectedLayanan.namaLengkap}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">NIK:</span>
                        <p className="text-gray-900 font-bold font-mono mt-1">{selectedLayanan.nik}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">No. KK:</span>
                        <p className="text-gray-900 font-bold font-mono mt-1">{selectedLayanan.noKK}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Alamat:</span>
                        <p className="text-gray-900 font-bold mt-1">{selectedLayanan.alamat}</p>
                      </div>
                      {selectedLayanan.daerah && (
                        <div>
                          <span className="text-gray-600 font-semibold">Daerah:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.daerah}</p>
                        </div>
                      )}
                      {selectedLayanan.noTelepon && (
                        <div>
                          <span className="text-gray-600 font-semibold">No. Telepon:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.noTelepon}</p>
                        </div>
                      )}
                      {selectedLayanan.email && (
                        <div>
                          <span className="text-gray-600 font-semibold">Email:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.email}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detail Layanan */}
                  <div className="bg-pink-50 rounded-xl p-6 border-2 border-pink-200">
                    <h4 className="font-bold text-lg text-pink-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Detail Layanan
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">Jenis Layanan:</span>
                        <p className="text-gray-900 font-bold mt-1">{selectedLayanan.jenisLayanan}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Tanggal Permohonan:</span>
                        <p className="text-gray-900 font-bold mt-1">
                          {selectedLayanan.createdAt ? new Date(selectedLayanan.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : '-'}
                        </p>
                      </div>
                      {selectedLayanan.keperluan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Keperluan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.keperluan}</p>
                        </div>
                      )}
                      {selectedLayanan.tujuan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tujuan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tujuan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Data */}
                {(selectedLayanan.tempatLahir || selectedLayanan.tanggalLahir) && (
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <h4 className="font-bold text-lg text-blue-900 mb-4">Data Pribadi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedLayanan.tempatLahir && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tempat Lahir:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tempatLahir}</p>
                        </div>
                      )}
                      {selectedLayanan.tanggalLahir && (
                        <div>
                          <span className="text-gray-600 font-semibold">Tanggal Lahir:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.tanggalLahir}</p>
                        </div>
                      )}
                      {selectedLayanan.jenisKelamin && (
                        <div>
                          <span className="text-gray-600 font-semibold">Jenis Kelamin:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.jenisKelamin}</p>
                        </div>
                      )}
                      {selectedLayanan.agama && (
                        <div>
                          <span className="text-gray-600 font-semibold">Agama:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.agama}</p>
                        </div>
                      )}
                      {selectedLayanan.pekerjaan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Pekerjaan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.pekerjaan}</p>
                        </div>
                      )}
                      {selectedLayanan.statusPerkawinan && (
                        <div>
                          <span className="text-gray-600 font-semibold">Status Perkawinan:</span>
                          <p className="text-gray-900 font-bold mt-1">{selectedLayanan.statusPerkawinan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Catatan/Alasan Tolak */}
                {selectedLayanan.alasanTolak && (
                  <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                    <h4 className="font-bold text-lg text-red-900 mb-2">Alasan Penolakan</h4>
                    <p className="text-gray-900 font-semibold">{selectedLayanan.alasanTolak}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer - Action Buttons */}
              <div className="bg-gray-50 px-8 py-6 rounded-b-2xl border-t-2 border-gray-200">
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Tutup
                  </button>
                  
                  {/* Role-based Approve Buttons */}
                  {user?.role === 'admin_desa' && selectedLayanan.status === 'pending_admin' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedLayanan.id!, 'admin_desa')}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✓ Setujui
                      </button>
                      <button
                        onClick={() => {
                          const alasan = prompt('Masukkan alasan penolakan:');
                          if (alasan) handleTolak(selectedLayanan.id!, alasan);
                        }}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✗ Tolak
                      </button>
                    </>
                  )}
                  
                  {user?.role === 'kepala_dusun' && selectedLayanan.status === 'approved_admin' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedLayanan.id!, 'kepala_dusun')}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✓ Setujui (Kadus)
                      </button>
                      <button
                        onClick={() => {
                          const alasan = prompt('Masukkan alasan penolakan:');
                          if (alasan) handleTolak(selectedLayanan.id!, alasan);
                        }}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✗ Tolak
                      </button>
                    </>
                  )}
                  
                  {user?.role === 'kepala_desa' && (selectedLayanan.status === 'approved_kadus' || selectedLayanan.status === 'auto_approved') && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedLayanan.id!, 'kepala_desa')}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✓ Setujui (Kades)
                      </button>
                      <button
                        onClick={() => {
                          const alasan = prompt('Masukkan alasan penolakan:');
                          if (alasan) handleTolak(selectedLayanan.id!, alasan);
                        }}
                        disabled={processingAction}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        ✗ Tolak
                      </button>
                      {selectedLayanan.status === 'auto_approved' && (
                        <div className="text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                          ⚡ Auto-approved (Kadus tidak merespon 24 jam)
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
