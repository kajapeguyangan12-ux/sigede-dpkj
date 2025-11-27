"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/AdminLayout";
import { hasPermission } from "../../../../lib/rolePermissions";
import RichTextEditor from "../../../../components/RichTextEditor";
import {
  getServiceContent,
  saveServiceContent,
  getAllServicesContent,
  TARING_SERVICES,
  type ServiceContent,
} from "../../../../lib/taringDukcapilService";

export default function TaringDukcapilCMSPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<ServiceContent | null>(null);
  const [servicesStatus, setServicesStatus] = useState<Record<string, boolean>>({});

  // Check permissions
  useEffect(() => {
    if (!authLoading && user) {
      if (!hasPermission(user.role, "layanan-publik", "update")) {
        router.push("/admin");
      }
    }
  }, [user, authLoading, router]);

  // Fetch all services status
  useEffect(() => {
    fetchAllServicesStatus();
  }, []);

  const fetchAllServicesStatus = async () => {
    try {
      const allContent = await getAllServicesContent();
      const status: Record<string, boolean> = {};
      TARING_SERVICES.forEach((service) => {
        status[service.id] = !!allContent[service.id];
      });
      setServicesStatus(status);
    } catch (error) {
      console.error("Error fetching services status:", error);
    }
  };

  const handleSelectService = async (serviceId: string, serviceName: string) => {
    setLoading(true);
    try {
      const content = await getServiceContent(serviceId);
      if (content) {
        setEditingContent(content);
      } else {
        // Create new empty content
        setEditingContent({
          serviceId,
          serviceName,
          syaratPermohonan: "",
          keteranganTambahan: "",
        });
      }
      setSelectedService(serviceId);
    } catch (error) {
      console.error("Error loading service content:", error);
      alert("Gagal memuat konten");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingContent) return;

    setLoading(true);
    try {
      await saveServiceContent(
        editingContent.serviceId,
        editingContent.serviceName,
        {
          syaratPermohonan: editingContent.syaratPermohonan,
          keteranganTambahan: editingContent.keteranganTambahan,
        },
        user?.uid
      );

      // Update status
      setServicesStatus((prev) => ({
        ...prev,
        [editingContent.serviceId]: true,
      }));

      alert("Konten berhasil disimpan!");
      setSelectedService(null);
      setEditingContent(null);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Gagal menyimpan konten");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedService(null);
    setEditingContent(null);
  };

  const handleLogout = async () => {
    try {
      sessionStorage.setItem('admin_logout_in_progress', 'true');
      localStorage.clear();
      sessionStorage.setItem('admin_logout_in_progress', 'true');
      
      try {
        await logout('admin');
      } catch (error) {
        console.error('Context logout failed, but continuing with manual logout');
      }
      
      sessionStorage.removeItem('admin_logout_in_progress');
      window.location.replace('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/admin/login');
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Memuat...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-8">
        <div className="max-w-7xl mx-auto">
          {!selectedService ? (
            // Service Grid View
            <>
              {/* Header with gradient */}
              <div className="mb-10">
                {/* Main Header Card */}
                <div className="relative bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-3xl shadow-2xl overflow-hidden mb-6">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }} />
                  </div>
                  
                  {/* Floating Shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                  
                  {/* Content */}
                  <div className="relative px-8 py-10">
                    <div className="flex items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl" />
                          <div className="relative p-5 bg-white/20 backdrop-blur-sm rounded-3xl border-2 border-white/40 shadow-xl">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-5xl font-black text-white tracking-tight">
                              Form Taring Dukcapil
                            </h1>
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white border border-white/30">
                              CMS
                            </span>
                          </div>
                          <p className="text-white/90 text-xl font-medium">
                            Kelola konten untuk 13 layanan administrasi kependudukan
                          </p>
                        </div>
                      </div>
                      
                      {/* User Profile with Logout */}
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                              <span className="text-xl font-bold text-white">
                                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-white truncate max-w-[150px]">
                              {user?.displayName || user?.email}
                            </p>
                            <p className="text-xs text-white/80 capitalize font-medium">
                              {user?.role || 'Administrator'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          type="button"
                          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-red-200 transition-all duration-200 border border-white/20 hover:border-white/40"
                          title="Logout"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Quick Stats Bar */}
                    <div className="flex items-center gap-8 text-white/90">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold">
                          {Object.values(servicesStatus).filter(Boolean).length}/{TARING_SERVICES.length} Layanan Terisi
                        </span>
                      </div>
                      <div className="h-6 w-px bg-white/30" />
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <span className="font-semibold">Rich Text Editor</span>
                      </div>
                      <div className="h-6 w-px bg-white/30" />
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="font-semibold">Auto Save</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-1">Total Layanan</p>
                        <p className="text-4xl font-black text-gray-800 mt-1">{TARING_SERVICES.length}</p>
                        <p className="text-xs text-gray-500 mt-2">Layanan tersedia</p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-1">Sudah Diisi</p>
                        <p className="text-4xl font-black text-green-600 mt-1">
                          {Object.values(servicesStatus).filter(Boolean).length}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${(Object.values(servicesStatus).filter(Boolean).length / TARING_SERVICES.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-green-600">
                              {Math.round((Object.values(servicesStatus).filter(Boolean).length / TARING_SERVICES.length) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-1">Belum Diisi</p>
                        <p className="text-4xl font-black text-orange-600 mt-1">
                          {TARING_SERVICES.length - Object.values(servicesStatus).filter(Boolean).length}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Perlu dilengkapi</p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative p-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {TARING_SERVICES.map((service, index) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelectService(service.id, service.name)}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100 overflow-hidden text-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          servicesStatus[service.id]
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            servicesStatus[service.id]
                              ? "bg-green-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        />
                        {servicesStatus[service.id] ? "Sudah" : "Belum"}
                      </div>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content */}
                    <div className="relative p-6">
                      <div className="mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-800 group-hover:text-red-600 transition-colors duration-300 leading-tight mb-2 pr-20">
                        {service.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="font-medium">Edit Konten</span>
                      </div>
                    </div>

                    {/* Bottom Accent */}
                    <div className="h-1 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Edit Form View
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 p-8 text-white">
                <button
                  onClick={handleBack}
                  className="mb-4 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-medium flex items-center gap-2 transition-all duration-300 border border-white/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Daftar
                </button>
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {editingContent?.serviceName}
                    </h1>
                    <p className="text-white/90 text-lg">
                      Edit konten layanan menggunakan rich text editor
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8 space-y-8">
                {/* Syarat Permohonan */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <label className="text-xl font-bold text-gray-800">
                      Syarat Permohonan
                    </label>
                  </div>
                  <RichTextEditor
                    value={editingContent?.syaratPermohonan || ""}
                    onChange={(value) =>
                      setEditingContent((prev) =>
                        prev ? { ...prev, syaratPermohonan: value } : null
                      )
                    }
                    placeholder="Tuliskan syarat-syarat permohonan di sini..."
                  />
                  <p className="text-sm text-blue-700 mt-3 flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Gunakan toolbar untuk memformat teks (tebal, miring, list, link, dll)
                  </p>
                </div>

                {/* Keterangan Tambahan */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <label className="text-xl font-bold text-gray-800">
                      Keterangan Tambahan
                    </label>
                  </div>
                  <RichTextEditor
                    value={editingContent?.keteranganTambahan || ""}
                    onChange={(value) =>
                      setEditingContent((prev) =>
                        prev ? { ...prev, keteranganTambahan: value } : null
                      )
                    }
                    placeholder="Tuliskan keterangan tambahan di sini..."
                  />
                  <p className="text-sm text-purple-700 mt-3 flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informasi tambahan, penjelasan, atau catatan penting lainnya
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleBack}
                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-gray-200"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
