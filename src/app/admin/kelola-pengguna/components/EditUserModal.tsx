"use client";
import React, { useState, useEffect } from 'react';
import { UserRole } from '../../../masyarakat/lib/useCurrentUser';
import { getRoleTitle } from '../../../../lib/rolePermissions';
import userManagementService, { FirestoreUser, UpdateUserData, UserStatus } from '../../../../lib/userManagementService';
import Portal from '../../../../components/Portal';

interface EditUserModalProps {
  user: FirestoreUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form when user changes
  useEffect(() => {
    if (user && isOpen) {
      console.log('🔍 EDIT MODAL: Received user data:', user);
      
      const timer = setTimeout(() => {
        const newFormData = {
          displayName: user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
          oldPassword: '',
          password: '',
          confirmPassword: ''
        };
        
        console.log('📋 EDIT MODAL: Form data to set:', newFormData);
        setFormData(newFormData);
        setError('');
        setSuccess('');
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
        email: '',
        oldPassword: '',
        password: '',
        confirmPassword: ''
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.displayName) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    if (!formData.email) {
      setError('Email wajib diisi');
      return;
    }

    // Validate password if provided
    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Password minimal 6 karakter');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Password dan konfirmasi password tidak sama');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Updating user:', user.uid);
      console.log('📝 Update data:', formData);

      const updateData: UpdateUserData = {
        displayName: formData.displayName,
        // Only include password if it was changed
        ...(formData.password && { password: formData.password })
      };

      await userManagementService.updateUser(user.uid, updateData, 'current-admin-id');
      
      console.log('✅ User updated successfully');
      setSuccess('Data pengguna berhasil diperbarui!');
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onUpdate(); // Refresh parent list
        onClose(); // Close modal
      }, 1500);
    } catch (error) {
      console.error('❌ Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Gagal mengupdate pengguna');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;
  return (
    <Portal>
      <div 
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
        style={{ 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 99999,
          position: 'fixed'
        }}
      >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 100000 }}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 px-8 py-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Ubah Data Pengguna</h2>
                <p className="text-red-100/90 text-sm">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Container with scroll */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-8 pt-8 pb-12" key={user?.uid || 'empty'}>
            {/* Alert Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Info Box - Role tidak dapat diubah */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 text-sm mb-1">
                      Informasi Role
                    </h4>
                    <p className="text-xs text-blue-800">
                      Role otomatis disesuaikan dengan komponen <strong>{getRoleTitle(user.role)}</strong> dan tidak dapat diubah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Username (Read-only) */}
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Username / ID Pengguna
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="username"
                    value={user.userName || user.uid}
                    readOnly
                    disabled
                    className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-gray-900 font-bold text-lg cursor-not-allowed"
                    placeholder="User ID"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Username tidak dapat diubah (bersifat permanen)
                </p>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Nama Lengkap <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                    required
                    placeholder="Masukkan nama lengkap"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  Email <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full px-6 py-4 bg-gray-100 border border-gray-200/70 rounded-2xl text-gray-600 cursor-not-allowed font-medium"
                    placeholder="user@example.com"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Email tidak dapat diubah untuk keamanan akun
                </p>
              </div>

              {/* Password Lama (untuk verifikasi) */}
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  Password Saat Ini
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="oldPassword"
                    value={user.initialPassword || '(Password tidak tersimpan)'}
                    readOnly
                    disabled
                    className="w-full px-6 py-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-gray-900 font-bold text-lg cursor-not-allowed"
                    placeholder="Password saat ini"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-yellow-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-base">🔑</span>
                  <span>Password lama ditampilkan untuk memudahkan verifikasi</span>
                </p>
              </div>

              {/* Kata Sandi */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Kata Sandi Baru
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                    placeholder="Minimal 6 karakter (kosongkan jika tidak ingin mengubah)"
                    minLength={6}
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  💡 Kosongkan jika tidak ingin mengubah password
                </p>
              </div>

              {/* Konfirmasi Kata Sandi */}
              {formData.password && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Konfirmasi Kata Sandi <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-sm hover:shadow-md font-medium"
                      placeholder="Ulangi kata sandi"
                      required
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-10 mb-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm hover:shadow"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </span>
                ) : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </Portal>
  );
}