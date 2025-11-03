"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderAccount } from "../../components/AdminHeaderCard";

export default function ProfilAdminPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  // Get role display name
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'administrator': 'Administrator',
      'admin_desa': 'Admin Desa',
      'kepala_desa': 'Kepala Desa',
      'warga': 'Warga',
    };
    return roleMap[role] || role;
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'active': { text: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200' },
      'inactive': { text: 'Tidak Aktif', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      'suspended': { text: 'Ditangguhkan', color: 'bg-red-100 text-red-700 border-red-200' },
      'pending': { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    };
    return statusMap[status] || statusMap['active'];
  };

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusBadge = getStatusBadge(user.status);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-red-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 p-8 mb-10">
            <AdminHeaderCard title="Profil Akun">
              <AdminHeaderAccount onLogout={handleLogout} />
            </AdminHeaderCard>
          </div>

          {/* Profile Content */}
          <div className="max-w-4xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              {/* Header Section with Gradient */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex items-center gap-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white/30">
                    {user.displayName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{user.displayName || 'Admin User'}</h2>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                        {getRoleDisplay(user.role)}
                      </span>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300 border border-white/30"
                  >
                    {isEditMode ? 'Batal Edit' : 'Edit Profil'}
                  </button>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Username</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{user.userName || '-'}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{user.email}</p>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">No. Telepon</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{user.phoneNumber || '-'}</p>
                    </div>
                  </div>

                  {/* ID Number / NIK */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">NIK / ID Number</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{user.idNumber || '-'}</p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">User ID</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium text-xs break-all">{user.uid}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{getRoleDisplay(user.role)}</p>
                    </div>
                  </div>
                </div>

                {/* Address (Full Width) */}
                {user.address && (
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Alamat</label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 font-medium">{user.address}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => router.push('/admin/home')}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 border border-gray-300"
                  >
                    Kembali ke Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all duration-300 border border-red-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Informasi Akun</h4>
                  <p className="text-sm text-blue-700">
                    Untuk mengubah data akun, silakan hubungi administrator sistem atau kepala desa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
