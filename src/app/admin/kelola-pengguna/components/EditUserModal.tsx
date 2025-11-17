"use client";
import React, { useState, useEffect } from 'react';
import { UserRole } from '../../../masyarakat/lib/useCurrentUser';
import { getRoleTitle } from '../../../../lib/rolePermissions';
import userManagementService, { FirestoreUser, UpdateUserData, UserStatus } from '../../../../lib/userManagementService';

interface EditUserModalProps {
  user: FirestoreUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    role: 'warga_dpkj' as UserRole,
    status: 'active' as UserStatus,
    userName: '',
    phoneNumber: '',
    address: '',
    notes: '',
    idNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when user changes
  useEffect(() => {
    if (user && isOpen) {
      console.log('🔍 EDIT MODAL: Received user data:', user);
      console.log('📝 EDIT MODAL: Setting form data...');
      
      // Add small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        // More defensive data extraction
        const newFormData = {
          displayName: user.displayName || user.email?.split('@')[0] || '',
          role: (user.role as UserRole) || 'warga_dpkj',
          status: (user.status as UserStatus) || 'active',
          userName: user.userName || user.displayName || '',
          phoneNumber: user.phoneNumber || '',
          address: user.address || '',
          notes: user.notes || '',
          idNumber: user.idNumber || ''
        };
        
        console.log('📋 EDIT MODAL: Form data to set:', newFormData);
        console.log('🔍 EDIT MODAL: Individual field check:', {
          'user.displayName': user.displayName,
          'user.role': user.role,
          'user.status': user.status,
          'user.userName': user.userName,
          'user.phoneNumber': user.phoneNumber
        });
        
        setFormData(newFormData);
        setError('');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.uid, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🔄 EDIT MODAL: Modal closed, resetting form');
      setFormData({
        displayName: '',
        role: 'warga_dpkj' as UserRole,
        status: 'active' as UserStatus,
        userName: '',
        phoneNumber: '',
        address: '',
        notes: '',
        idNumber: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Updating user:', user.uid);
      console.log('📝 Update data:', formData);

      const updateData: UpdateUserData = {
        displayName: formData.displayName,
        // role: formData.role, // Role tidak dapat diubah
        status: formData.status,
        userName: formData.userName || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
        idNumber: formData.idNumber || undefined
      };

      await userManagementService.updateUser(user.uid, updateData, 'current-admin-id');
      
      console.log('✅ User updated successfully');
      onUpdate(); // Refresh parent list
      onClose(); // Close modal
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Gagal mengupdate pengguna');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  // Debug current form state
  console.log('🎭 EDIT MODAL: Rendering with form state:', formData);
  console.log('👤 EDIT MODAL: Current user:', user);

  const availableRoles: UserRole[] = [
    'super_admin',
    'administrator',
    'admin_desa', 
    'kepala_desa',
    'kepala_dusun',
    'warga_dpkj',
    'warga_luar_dpkj'
  ];

  const availableStatuses: UserStatus[] = [
    'active',
    'inactive', 
    'suspended',
    'pending'
  ];

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Tidak Aktif';
      case 'suspended': return 'Ditangguhkan';
      case 'pending': return 'Menunggu';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ubah Data Pengguna</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6" key={user?.uid || 'empty'}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => {
                  console.log('📝 Display name changed:', e.target.value);
                  setFormData({ ...formData, displayName: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => {
                    console.log('👑 Role changed:', e.target.value);
                    setFormData({ ...formData, role: e.target.value as UserRole });
                  }}
                  disabled={true}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-75"
                  required
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleTitle(role)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Role tidak dapat diubah untuk menjaga konsistensi data
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Username (opsional)"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            {/* ID Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Identitas (KTP/KK)
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nomor KTP atau Kartu Keluarga"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Alamat lengkap"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Catatan tambahan tentang pengguna ini"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}