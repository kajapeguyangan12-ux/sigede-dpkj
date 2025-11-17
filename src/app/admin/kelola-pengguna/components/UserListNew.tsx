"use client";
import React, { useState, useEffect } from 'react';
import { UserRole } from '../../../masyarakat/lib/useCurrentUser';
import { getRoleTitle, getRoleDescription } from '../../../../lib/rolePermissions';
import userManagementService, { FirestoreUser } from '../../../../lib/userManagementService';
import UserRegistrationForm from './UserRegistrationForm';
import EditUserModal from './EditUserModal';

// Animation styles
const animationStyles = `
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

interface UserListProps {
  roleId: UserRole | 'masyarakat_dpkj' | 'masyarakat_luar_dpkj';
  roleLabel: string;
}

interface UserCardProps {
  user: FirestoreUser;
  onEdit: (user: FirestoreUser) => void;
  onDelete: (user: FirestoreUser) => void;
  onApprove?: (user: FirestoreUser) => void;
  onReject?: (user: FirestoreUser) => void;
}

// Helper functions - moved outside to be accessible by both card and table
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Tidak Aktif';
    case 'suspended': return 'Ditangguhkan';
    case 'pending': return 'Menunggu';
    default: return 'Unknown';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return '✓';
    case 'inactive': return '○';
    case 'suspended': return '⚠';
    case 'pending': return '⏳';
    default: return '?';
  }
};

const formatDate = (date: any) => {
  if (!date) return 'Belum pernah login';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Tanggal tidak valid';
  }
};

const formatCreatedDate = (date: any) => {
  if (!date) return '-';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const getInitials = (name: string) => {
  return name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
};

const getUserGradient = (name: string) => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-indigo-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-teal-500 to-cyan-500',
    'from-violet-500 to-purple-500',
    'from-rose-500 to-pink-500'
  ];
  const index = name?.charCodeAt(0) % gradients.length || 0;
  return gradients[index];
};

function UserCard({ user, onEdit, onDelete, onApprove, onReject }: UserCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className={`group relative bg-white rounded-2xl border hover:shadow-xl transition-all duration-300 overflow-hidden ${
      user.status === 'pending' 
        ? 'border-amber-200 shadow-amber-100/50 hover:shadow-amber-200/30' 
        : 'border-gray-200 shadow-sm hover:shadow-lg'
    } hover:-translate-y-1`}>
      
      {/* Top Accent Bar */}
      <div className={`h-1 w-full ${
        user.status === 'pending' 
          ? 'bg-gradient-to-r from-amber-400 to-orange-400' 
          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
      }`}></div>

      {/* Pending Alert Banner */}
      {user.status === 'pending' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-3 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <span className="text-amber-800 text-sm font-semibold">Menunggu Persetujuan</span>
              <p className="text-amber-700 text-xs">User baru memerlukan aktivasi admin</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Enhanced Avatar */}
            <div className={`relative w-14 h-14 bg-gradient-to-br ${getUserGradient(user.displayName || '')} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
              <span className="text-lg font-bold text-white relative z-10">
                {getInitials(user.displayName || '')}
              </span>
              
              {/* Online Indicator */}
              {user.status === 'active' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                {user.displayName || 'Nama tidak tersedia'}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                {user.email}
              </p>
            </div>
          </div>
          
          {/* Enhanced Status Badge */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${getStatusColor(user.status)}`}>
              <span>{getStatusIcon(user.status)}</span>
              {getStatusText(user.status)}
            </span>
            
            {/* Role Badge */}
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
              User ID: {user.uid?.slice(-6) || 'N/A'}
            </span>
          </div>
        </div>



        {/* Enhanced User Details */}
        {(user.nik || user.alamat || user.noTelp || user.jenisKelamin) && (
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Informasi Pribadi</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {user.nik && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">NIK</span>
                  <span className="text-gray-800 font-mono bg-white px-2 py-1 rounded border">{user.nik}</span>
                </div>
              )}
              {user.noTelp && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">No. Telepon</span>
                  <span className="text-gray-800 bg-white px-2 py-1 rounded border">{user.noTelp}</span>
                </div>
              )}
              {user.jenisKelamin && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">Jenis Kelamin</span>
                  <span className="text-gray-800 bg-white px-2 py-1 rounded border">
                    {user.jenisKelamin === 'L' ? '👨 Laki-laki' : user.jenisKelamin === 'P' ? '👩 Perempuan' : user.jenisKelamin}
                  </span>
                </div>
              )}
              {user.tanggalLahir && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">Tanggal Lahir</span>
                  <span className="text-gray-800 bg-white px-2 py-1 rounded border">{formatCreatedDate(user.tanggalLahir)}</span>
                </div>
              )}
              {user.pekerjaan && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">Pekerjaan</span>
                  <span className="text-gray-800 bg-white px-2 py-1 rounded border">{user.pekerjaan}</span>
                </div>
              )}
              {user.agama && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs font-medium mb-1">Agama</span>
                  <span className="text-gray-800 bg-white px-2 py-1 rounded border">{user.agama}</span>
                </div>
              )}
            </div>
            
            {user.alamat && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="block text-gray-500 text-xs font-medium mb-2">Alamat Lengkap</span>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="text-gray-800 text-sm leading-relaxed">{user.alamat}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Metadata */}
        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Metadata Akun</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium mb-1">Tanggal Dibuat</span>
              <div className="bg-white px-3 py-2 rounded-lg border">
                <span className="text-gray-800">{formatCreatedDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium mb-1">
                {user.status === 'pending' ? 'Dibuat Oleh' : 'Login Terakhir'}
              </span>
              <div className="bg-white px-3 py-2 rounded-lg border">
                <span className="text-gray-800">
                  {user.status === 'pending' ? (user.createdBy || 'Admin') : formatDate(user.lastLoginAt)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Additional info for pending users or masyarakat data */}
          {user.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className={`p-3 rounded-lg border-2 ${
                user.status === 'pending' 
                  ? 'bg-amber-50 border-amber-200' 
                  : user.notes.includes('Data dari collection masyarakat')
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${
                    user.status === 'pending' 
                      ? '⚠️' 
                      : user.notes.includes('Data dari collection masyarakat')
                        ? '📋'
                        : 'ℹ️'
                  }`}>
                    {user.status === 'pending' 
                      ? '⚠️' 
                      : user.notes.includes('Data dari collection masyarakat')
                        ? '📋'
                        : 'ℹ️'
                    }
                  </span>
                  <span className={`text-sm font-semibold ${
                    user.status === 'pending' 
                      ? 'text-amber-800' 
                      : user.notes.includes('Data dari collection masyarakat')
                        ? 'text-blue-800'
                        : 'text-gray-800'
                  }`}>
                    {user.status === 'pending' ? 'Catatan Khusus' : 'Sumber Data'}
                  </span>
                </div>
                <span className={`text-sm ${
                  user.status === 'pending' 
                    ? 'text-amber-700' 
                    : user.notes.includes('Data dari collection masyarakat')
                      ? 'text-blue-700'
                      : 'text-gray-700'
                }`}>
                  {user.notes.includes('Data dari collection masyarakat') 
                    ? 'Data diambil dari Collection Masyarakat Firestore' 
                    : user.notes
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Actions */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowActions(!showActions)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                user.status === 'pending' 
                  ? 'text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200' 
                  : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <svg className={`w-4 h-4 transition-transform duration-200 ${showActions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showActions ? 'Tutup Menu' : (user.status === 'pending' ? 'Tindakan Diperlukan' : 'Opsi Tindakan')}
            </button>
            
            {showActions && (
              <div className="flex gap-2 flex-wrap">
                {/* Pending users get approve/reject buttons */}
                {user.status === 'pending' && onApprove && onReject ? (
                  <>
                    <button
                      onClick={() => onApprove(user)}
                      className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all duration-200 flex items-center gap-2 border border-emerald-200 hover:border-emerald-300 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Setujui
                    </button>
                    <button
                      onClick={() => onReject(user)}
                      className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tolak
                    </button>
                  </>
                ) : (
                  /* Regular users get edit/delete */
                  <>
                    <button
                      onClick={() => onEdit(user)}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center gap-2 border border-blue-200 hover:border-blue-300 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Ubah Role
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center gap-2 border border-red-200 hover:border-red-300 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserList({ roleId, roleLabel }: UserListProps) {
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (roleId === 'masyarakat_dpkj') {
        // Load masyarakat DPKJ data
        const userData = await userManagementService.getUsersByCollection('masyarakat');
        setUsers(userData);
      } else if (roleId === 'masyarakat_luar_dpkj') {
        // Load masyarakat luar DPKJ data
        const userData = await userManagementService.getUsersByCollection('Warga_LuarDPKJ');
        setUsers(userData);
      } else if (roleId === 'super_admin') {
        // Load super admin data from Super_Admin collection
        console.log('🔍 Loading data from Super_Admin collection...');
        const userData = await userManagementService.getUsersByCollection('Super_Admin');
        console.log('📊 Super_Admin data loaded:', userData.length, 'users found');
        setUsers(userData);
      } else {
        const userData = await userManagementService.getUsersByRole(roleId as UserRole);
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount and when roleId changes
  useEffect(() => {
    loadUsers();
  }, [roleId]);

  // Handle edit user
  const handleEditUser = (user: FirestoreUser) => {
    console.log('🎯 USER LIST: Edit button clicked for user:', user);
    console.log('📊 USER LIST: User data structure:', {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      notes: user.notes,
      idNumber: user.idNumber
    });
    
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    console.log('🚪 USER LIST: Closing edit modal');
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Handle user update success
  const handleUserUpdated = () => {
    loadUsers(); // Refresh the list
  };

  // Handle delete user
  const handleDeleteUser = async (user: FirestoreUser) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${user.displayName}?`)) {
      return;
    }

    try {
      // TODO: Get current admin user ID
      await userManagementService.deleteUser(user.uid, 'current-admin-id');
      await loadUsers(); // Refresh list
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Gagal menghapus user');
    }
  };

  // Handle approve user (pending -> active)
  const handleApproveUser = async (user: FirestoreUser) => {
    if (!confirm(`Apakah Anda yakin ingin menerima user ${user.displayName}?`)) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Get current admin user ID properly
      await userManagementService.approveUser(user.uid, 'current-admin-id');
      await loadUsers(); // Refresh list
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Gagal menerima user');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject user (delete pending user)
  const handleRejectUser = async (user: FirestoreUser) => {
    const reason = prompt(`Alasan menolak user ${user.displayName}:`);
    if (reason === null) return; // User cancelled
    
    if (!confirm(`Apakah Anda yakin ingin menolak user ${user.displayName}?\n\nUser ini akan dihapus dari sistem.`)) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Get current admin user ID properly
      await userManagementService.rejectUser(user.uid, 'current-admin-id', reason);
      await loadUsers(); // Refresh list
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Gagal menolak user');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show registration form
  if (showRegistrationForm) {
    return (
      <div>

        <UserRegistrationForm
          fixedRole={roleId as UserRole}
          onSuccess={() => {
            setShowRegistrationForm(false);
            loadUsers();
          }}
          onCancel={() => setShowRegistrationForm(false)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {roleLabel}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium">
                    {loading ? 'Memuat...' : `${filteredUsers.length} Pengguna`}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
              {roleId === 'masyarakat_dpkj' 
                ? '📋 Data lengkap masyarakat DPKJ dari koleksi masyarakat dengan informasi demografis terperinci' 
                : roleId === 'masyarakat_luar_dpkj'
                  ? '🌐 Data lengkap masyarakat luar DPKJ dari koleksi Warga_LuarDPKJ'
                  : roleId === 'super_admin'
                    ? '👑 Data lengkap super administrator dari koleksi Super_Admin dengan akses penuh sistem'
                    : getRoleDescription(roleId as UserRole)
              }
            </p>
          </div>
          
          {/* Enhanced Add Button */}
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
          >
            {/* Button Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            
            <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center relative z-10">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="relative z-10">Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* Enhanced Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className="w-5 h-5 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white focus:bg-white placeholder-gray-500"
            placeholder="🔍 Cari pengguna berdasarkan nama, email, atau informasi lainnya..."
          />
          
          {/* Search Results Counter */}
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                {filteredUsers.length} hasil
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Error Message */}
      {error && (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500"></div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-red-800 font-semibold mb-1">Terjadi Kesalahan</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Memuat Data Pengguna</h3>
            <p className="text-gray-500">Sedang mengambil informasi dari database...</p>
          </div>
        </div>
      )}

      {/* Enhanced Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute top-4 right-8 w-3 h-3 bg-purple-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-800">
              {searchTerm ? 'Tidak Ada Hasil' : 'Belum Ada Pengguna'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {searchTerm 
                ? `Pencarian "${searchTerm}" tidak menemukan pengguna yang sesuai. Coba gunakan kata kunci yang berbeda.` 
                : `Belum ada pengguna yang terdaftar dengan peran ${roleLabel}. Mulai dengan menambahkan pengguna pertama.`
              }
            </p>
            
            {!searchTerm && (
              <div className="pt-4">
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center relative z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="relative z-10">Tambah Pengguna Pertama</span>
                </button>
              </div>
            )}
            
            {searchTerm && (
              <div className="pt-4">
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced User List */}
      {!loading && filteredUsers.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {searchTerm ? `${filteredUsers.length} pengguna ditemukan` : `${filteredUsers.length} total pengguna`}
                </p>
                {searchTerm && (
                  <p className="text-xs text-gray-600">
                    Dari pencarian: "{searchTerm}"
                  </p>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs px-3 py-1.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hapus Filter
                </button>
              )}
              <span className="text-xs text-gray-500">
                Tampilan List
              </span>
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Terdaftar
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.uid}
                      className="hover:bg-gray-50 transition-colors duration-150 animate-scaleIn"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`relative w-10 h-10 bg-gradient-to-br ${getUserGradient(user.displayName || '')} rounded-xl flex items-center justify-center shadow flex-shrink-0`}>
                            <span className="text-sm font-bold text-white">
                              {getInitials(user.displayName || '')}
                            </span>
                            {user.status === 'active' && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.displayName || 'Nama tidak tersedia'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              ID: {user.uid?.slice(-8) || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span className="truncate">{user.email}</span>
                          </p>
                          {user.phoneNumber && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{user.phoneNumber}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
                          <span>{getStatusIcon(user.status)}</span>
                          {getStatusText(user.status)}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{formatCreatedDate(user.createdAt)}</p>
                        <p className="text-xs text-gray-500">Login: {formatDate(user.lastLoginAt)}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveUser(user)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300"
                                title="Setujui"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRejectUser(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                title="Tolak"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                title="Hapus"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Results Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <span>Menampilkan {filteredUsers.length} dari {users.length} total pengguna</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onUpdate={handleUserUpdated}
      />
    </div>
  );
}