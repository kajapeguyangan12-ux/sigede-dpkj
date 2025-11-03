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
import { addDataDesa, updateDataDesa, deleteDataDesa, subscribeToDataDesa, DataDesaItem } from "../../../lib/dataDesaService";
import UploadExcel from "./components/UploadExcel";
import KKCard from "./components/KKCard";

interface DataDesa {
  id: string;
  noKK: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  daerah: string;
  statusNikah: string;
  agama: string;
  sukuBangsa: string;
  kewarganegaraan: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  penghasilan: string;
  golonganDarah: string;
  shdk: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DataDesaPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [dataWarga, setDataWarga] = useState<DataDesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBanjar, setFilterBanjar] = useState("all");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default ke cards
  const [formData, setFormData] = useState({
    noKK: "",
    namaLengkap: "",
    nik: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    daerah: "",
    statusNikah: "",
    agama: "",
    sukuBangsa: "",
    kewarganegaraan: "",
    pendidikanTerakhir: "",
    pekerjaan: "",
    penghasilan: "",
    golonganDarah: "",
    shdk: ""
  });

  const handleLogout = async () => {
    try {
      await logout('admin');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToDataDesa((data) => {
      const formattedData = data.map(item => ({
        ...item,
        createdAt: item.createdAt.toDate(),
        updatedAt: item.updatedAt.toDate()
      })) as DataDesa[];
      setDataWarga(formattedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      noKK: "",
      namaLengkap: "",
      nik: "",
      jenisKelamin: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      daerah: "",
      statusNikah: "",
      agama: "",
      sukuBangsa: "",
      kewarganegaraan: "",
      pendidikanTerakhir: "",
      pekerjaan: "",
      penghasilan: "",
      golonganDarah: "",
      shdk: ""
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingId) {
        await updateDataDesa(editingId, formData);
        alert("Data warga berhasil diperbarui!");
      } else {
        await addDataDesa(formData);
        alert("Data warga berhasil ditambahkan!");
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Terjadi kesalahan saat menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: DataDesa) => {
    setFormData({
      noKK: item.noKK,
      namaLengkap: item.namaLengkap,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir,
      alamat: item.alamat,
      daerah: item.daerah,
      statusNikah: item.statusNikah,
      agama: item.agama,
      sukuBangsa: item.sukuBangsa,
      kewarganegaraan: item.kewarganegaraan,
      pendidikanTerakhir: item.pendidikanTerakhir,
      pekerjaan: item.pekerjaan,
      penghasilan: item.penghasilan,
      golonganDarah: item.golonganDarah,
      shdk: item.shdk
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDataDesa(id);
        alert("Data berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting data:", error);
        alert("Terjadi kesalahan saat menghapus data!");
      }
    }
  };

  const filteredData = dataWarga.filter(item => 
    item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nik.includes(searchTerm)
  );

  // Group data by No KK for card view
  const groupedByKK = filteredData.reduce((groups, warga) => {
    const noKK = warga.noKK || 'Tanpa KK';
    if (!groups[noKK]) {
      groups[noKK] = [];
    }
    groups[noKK].push(warga);
    return groups;
  }, {} as Record<string, DataDesa[]>);

  // Calculate statistics
  const totalKK = Object.keys(groupedByKK).filter(kk => kk !== 'Tanpa KK').length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <AdminHeaderCard title="Data Desa">
          <AdminHeaderSearchBar />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Data Desa Dauh Puri Kaja
            </h1>
            <p className="text-gray-600">
              Kelola data kependudukan dan informasi warga desa
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="flex-1 relative">
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
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama atau NIK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={filterBanjar}
                  onChange={(e) => setFilterBanjar(e.target.value)}
                  className="px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer transition-all min-w-[160px]"
                >
                  <option value="all">Semua Banjar</option>
                  <option value="banjar1">Banjar Dauh Puri</option>
                  <option value="banjar2">Banjar Kaja</option>
                  <option value="banjar3">Banjar Tengah</option>
                </select>
              </div>
              <div className="flex gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Kartu KK
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2" />
                    </svg>
                    Tabel
                  </button>
                </div>

                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Excel
                </button>
                
                <button 
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Tambah Data Warga
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Penduduk</p>
                  <p className="text-2xl font-bold text-blue-600">{dataWarga.length.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Laki-laki</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dataWarga.filter(item => item.jenisKelamin === 'Laki-laki').length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Perempuan</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {dataWarga.filter(item => item.jenisKelamin === 'Perempuan').length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Kepala Keluarga</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dataWarga.filter(item => item.shdk === 'Kepala Keluarga').length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total KK</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalKK.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Display */}
          {viewMode === 'cards' ? (
            // Card View for KK
            filteredData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                  <p className="text-gray-600 mb-4">Mulai dengan menambahkan data penduduk pertama.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByKK).map(([noKK, keluargaMembers]) => (
                  <KKCard key={noKK} noKK={noKK} members={keluargaMembers} />
                ))}
              </div>
            )
          ) : (
            // Table View
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Data Penduduk</h3>
              </div>
              
              {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada data penduduk</h3>
                <p className="text-gray-600 mb-4">Mulai dengan menambahkan data penduduk pertama.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">No KK</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nama Lengkap</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">NIK</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Jenis Kelamin</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pekerjaan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status Nikah</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{item.noKK}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.namaLengkap}</div>
                            <div className="text-sm text-gray-500">{item.tempatLahir}, {item.tanggalLahir}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{item.nik}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {item.jenisKelamin}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.pekerjaan}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.statusNikah}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
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
          )}
        </div>

        {/* Upload Excel Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Upload Data Excel</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <UploadExcel onUploadComplete={() => {
                  setShowUploadModal(false);
                  // Data will be updated automatically via real-time listener
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Data Warga' : 'Tambah Data Warga'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No KK
                    </label>
                    <input
                      type="text"
                      value={formData.noKK}
                      onChange={(e) => setFormData(prev => ({...prev, noKK: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="Masukkan No KK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agama
                    </label>
                    <input
                      type="text"
                      value={formData.agama}
                      onChange={(e) => setFormData(prev => ({...prev, agama: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Agama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.namaLengkap}
                      onChange={(e) => setFormData(prev => ({...prev, namaLengkap: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan Nama Lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suku Bangsa
                    </label>
                    <input
                      type="text"
                      value={formData.sukuBangsa}
                      onChange={(e) => setFormData(prev => ({...prev, sukuBangsa: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan suku bangsa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIK
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData(prev => ({...prev, nik: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="Masukkan NIK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kewarganegaraan
                    </label>
                    <input
                      type="text"
                      value={formData.kewarganegaraan}
                      onChange={(e) => setFormData(prev => ({...prev, kewarganegaraan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan kewarganegaraan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData(prev => ({...prev, jenisKelamin: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih Jenis Kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pendidikan Terakhir
                    </label>
                    <input
                      type="text"
                      value={formData.pendidikanTerakhir}
                      onChange={(e) => setFormData(prev => ({...prev, pendidikanTerakhir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Pendidikan terakhir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempat lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData(prev => ({...prev, tempatLahir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan Tempat Lahir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pekerjaan
                    </label>
                    <input
                      type="text"
                      value={formData.pekerjaan}
                      onChange={(e) => setFormData(prev => ({...prev, pekerjaan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Pekerjaan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData(prev => ({...prev, tanggalLahir: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Penghasilan
                    </label>
                    <input
                      type="text"
                      value={formData.penghasilan}
                      onChange={(e) => setFormData(prev => ({...prev, penghasilan: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Penghasilan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat
                    </label>
                    <textarea
                      rows={3}
                      value={formData.alamat}
                      onChange={(e) => setFormData(prev => ({...prev, alamat: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Alamat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Golongan Darah
                    </label>
                    <input
                      type="text"
                      value={formData.golonganDarah}
                      onChange={(e) => setFormData(prev => ({...prev, golonganDarah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan Golongan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daerah
                    </label>
                    <input
                      type="text"
                      value={formData.daerah}
                      onChange={(e) => setFormData(prev => ({...prev, daerah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan Daerah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SHDK
                    </label>
                    <input
                      type="text"
                      value={formData.shdk}
                      onChange={(e) => setFormData(prev => ({...prev, shdk: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan SHDK"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Nikah
                    </label>
                    <input
                      type="text"
                      value={formData.statusNikah}
                      onChange={(e) => setFormData(prev => ({...prev, statusNikah: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="masukkan status nikah"
                    />
                  </div>



                </div>

                <div className="flex justify-center mt-8 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-xs px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
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