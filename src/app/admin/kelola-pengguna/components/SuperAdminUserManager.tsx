"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { UserRole } from '../../../masyarakat/lib/useCurrentUser';
import { useCurrentUser } from '../../../masyarakat/lib/useCurrentUser';
import { roleDescriptions, getRoleTitle, getRoleDescription } from '../../../../lib/rolePermissions';
import superAdminUserService, { ManagedUser, CreateManagedUserData } from '../../../../lib/superAdminUserService';

// Use types from service
type UserData = ManagedUser;
type CreateUserFormData = CreateManagedUserData;

export default function SuperAdminUserManager() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const router = useRouter();

  // State management
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    displayName: '',
    userName: '',
    role: 'warga_dpkj',
    phoneNumber: '',
    idNumber: '',
    address: '',
    notes: ''
  });

  // Check if current user is super administrator
  const isSuperAdmin = currentUser?.role === 'administrator';

  // Load users on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  // Load all users using service
  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await superAdminUserService.getAllUsers();
      setUsers(usersData);
      console.log('✅ Loaded users:', usersData.length);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setError('Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phoneNumber') {
      // Only allow numbers and + symbol, remove spaces and dashes
      const cleanValue = value.replace(/[^0-9+]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('Email, password, dan nama wajib diisi');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }

    // Validate Indonesian phone number
    if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
      const phoneRegex = /^(08|628|\+628)[0-9]{8,12}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError('Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx (10-13 digit) atau +628xxxxxxxxx');
        return false;
      }
      
      // Additional length check
      const phoneLength = formData.phoneNumber.replace(/^\+/, '').length;
      if (phoneLength < 10 || phoneLength > 15) {
        setError('Nomor telepon harus 10-15 digit');
        return false;
      }
    }

    return true;
  };

  // Create new user using service
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔐 Creating user via service...');
      
      const createdUser = await superAdminUserService.createUser(
        formData,
        currentUser?.uid || 'system'
      );
      
      console.log('✅ User created successfully');
      setSuccess(`✅ User ${formData.displayName} berhasil dibuat! 
      📧 Email: ${formData.email}
      🔑 Password: ${formData.password}
      🆔 User ID: ${createdUser.uid}
      
      Simpan informasi login ini untuk diberikan kepada user.`);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        displayName: '',
        userName: '',
        role: 'warga_dpkj',
        phoneNumber: '',
        idNumber: '',
        address: '',
        notes: ''
      });
      
      setShowCreateForm(false);
      loadUsers(); // Reload users list
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      setError(`Gagal membuat user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update user using service
  const handleUpdateUser = async (userId: string, updates: Partial<UserData>) => {
    setLoading(true);
    try {
      await superAdminUserService.updateUser(userId, updates);
      setSuccess('✅ User berhasil diperbarui');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      setError(`Gagal memperbarui user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete user using service
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${userName}?`)) return;
    
    setLoading(true);
    try {
      await superAdminUserService.deleteUser(userId);
      setSuccess('✅ User berhasil dihapus');
      loadUsers();
    } catch (error: any) {
      setError(`Gagal menghapus user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset password using service
  const handleResetPassword = async (user: UserData) => {
    const newPassword = prompt(`Masukkan password baru untuk ${user.displayName}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      // Update password using service
      await superAdminUserService.updateUserPassword(user.uid, newPassword);
      
      // Also update notes
      await superAdminUserService.updateUser(user.uid, {
        notes: `${user.notes || ''}\n[${new Date().toLocaleString()}] Password reset oleh admin`
      });
      
      setSuccess(`✅ Password untuk ${user.displayName} berhasil direset. 
      Password baru: ${newPassword}
      
      Berikan informasi ini kepada user untuk login.`);
      loadUsers();
    } catch (error: any) {
      setError(`Gagal reset password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check permissions
  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Akses Ditolak</div>
        <p className="text-red-700">Halaman ini hanya dapat diakses oleh Super Administrator</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">🔧 Super Admin - Kelola Pengguna</h2>
        <p className="text-blue-100">Kelola semua pengguna sistem dengan autentikasi lengkap</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          {showCreateForm ? '❌ Batal' : '➕ Buat User Baru'}
        </button>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? '🔄 Memuat...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4">➕ Buat User Baru</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  required
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Otomatis dari email jika kosong"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="warga_dpkj">Warga DPKJ</option>
                  <option value="warga_luar_dpkj">Warga Luar DPKJ</option>
                  <option value="kepala_dusun">Kepala Dusun</option>
                  <option value="kepala_desa">Kepala Desa</option>
                  <option value="admin_desa">Admin Desa</option>
                  <option value="administrator">Super Administrator</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  pattern="^(08|628|\+628)[0-9]{8,12}$"
                  minLength={10}
                  maxLength={15}
                  title="Format nomor telepon: 08xxxxxxxxxx (10-13 digit) atau +628xxxxxxxxx"
                  placeholder="08xxxxxxxxxx (contoh: 081234567890)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NIK/ID Number
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan tambahan untuk user ini..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? '🔄 Membuat...' : '✅ Buat User'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                ❌ Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            👥 Daftar Pengguna ({users.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dibuat</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{user.displayName}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">ID: {user.uid}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleTitle(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 'N/A'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                      >
                        🔑 Reset
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.uid, user.displayName)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👤</div>
              <p className="text-lg">Belum ada pengguna</p>
              <p className="text-sm">Klik "Buat User Baru" untuk menambah pengguna pertama</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">✏️ Edit User: {editingUser.displayName}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="warga_dpkj">Warga DPKJ</option>
                    <option value="warga_luar_dpkj">Warga Luar DPKJ</option>
                    <option value="kepala_dusun">Kepala Dusun</option>
                    <option value="kepala_desa">Kepala Desa</option>
                    <option value="admin_desa">Admin Desa</option>
                    <option value="administrator">Super Administrator</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser({...editingUser, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => handleUpdateUser(editingUser.uid, editingUser)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ✅ Simpan
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ❌ Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}