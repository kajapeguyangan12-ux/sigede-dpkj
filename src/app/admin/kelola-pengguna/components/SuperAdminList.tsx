"use client";
import React, { useState, useEffect } from 'react';
import superAdminService, { SuperAdminData } from '../../../../lib/superAdminService';
import { useCurrentUser } from '../../../masyarakat/lib/useCurrentUser';

export default function SuperAdminList() {
  const { user: currentUser } = useCurrentUser();
  const [superAdmins, setSuperAdmins] = useState<SuperAdminData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if current user can view Super Admins
  const canViewSuperAdmins = currentUser?.role === 'administrator';

  // Load Super Admins
  const loadSuperAdmins = async () => {
    if (!canViewSuperAdmins) return;
    
    setLoading(true);
    try {
      const admins = await superAdminService.getAllSuperAdmins();
      setSuperAdmins(admins);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuperAdmins();
  }, [canViewSuperAdmins]);

  // Handle status update
  const handleStatusUpdate = async (uid: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      await superAdminService.updateStatus(uid, status);
      loadSuperAdmins(); // Reload list
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!canViewSuperAdmins) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-red-600 font-semibold">Akses Ditolak</div>
        <p className="text-red-700 text-sm">Hanya Super Administrator yang dapat melihat daftar admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-2">👥 Daftar Super Admin</h3>
        <p className="text-indigo-100">Kelola akun administrator dan admin desa</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-gray-800">
          Total: {superAdmins.length} admin
        </h4>
        <button
          onClick={loadSuperAdmins}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '🔄 Memuat...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Super Admin List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : superAdmins.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-600 text-lg font-medium mb-2">Belum ada Super Admin</div>
          <p className="text-gray-500">Buat akun Super Admin pertama menggunakan form di atas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {superAdmins.map((admin) => (
            <div
              key={admin.uid}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-lg">
                        {admin.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800">{admin.displayName}</h5>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ml-1 ${
                        admin.role === 'administrator' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'administrator' ? 'Super Admin' : 'Admin Desa'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ml-1 ${
                        admin.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : admin.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.status === 'active' ? 'Aktif' : 
                         admin.status === 'inactive' ? 'Tidak Aktif' : 'Suspended'}
                      </div>
                    </div>
                    
                    {admin.phoneNumber && (
                      <div>
                        <span className="text-gray-500">Telepon:</span>
                        <div className="font-medium text-gray-800">{admin.phoneNumber}</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Dibuat:</span>
                      <div className="font-medium text-gray-800">
                        {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {admin.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm">Catatan:</span>
                      <p className="text-gray-700 text-sm mt-1">{admin.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 ml-4">
                  {admin.status === 'active' ? (
                    <button
                      onClick={() => handleStatusUpdate(admin.uid, 'inactive')}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Nonaktifkan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusUpdate(admin.uid, 'active')}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Aktifkan
                    </button>
                  )}
                  
                  {admin.status !== 'suspended' && (
                    <button
                      onClick={() => handleStatusUpdate(admin.uid, 'suspended')}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
              
              {/* Metadata */}
              <div className="border-t pt-3 text-xs text-gray-500 flex justify-between">
                <span>UID: {admin.uid}</span>
                <span>Collection: Super_admin</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}