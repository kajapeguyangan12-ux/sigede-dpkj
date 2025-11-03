"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import { RoleCardType } from './components/RoleCard';
import UserListNew from './components/UserListNew';
import AdminLayout from '../components/AdminLayout';
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";
import { UserRole } from '../../masyarakat/lib/useCurrentUser';
import { roleDescriptions } from '../../../lib/rolePermissions';

const roleCards: RoleCardType[] = [
  { 
    id: 'administrator', 
    title: 'Super Administrator', 
    description: 'Akses penuh ke seluruh sistem admin dan masyarakat', 
    icon: '👨‍💻' 
  },
  { 
    id: 'admin_desa', 
    title: 'Admin Desa', 
    description: 'Akses admin kecuali kelola pengguna dan data desa', 
    icon: '�' 
  },
  { 
    id: 'kepala_desa', 
    title: 'Kepala Desa', 
    description: 'Akses data desa & layanan publik + halaman masyarakat', 
    icon: '👔' 
  },
  { 
    id: 'kepala_dusun', 
    title: 'Kepala Dusun', 
    description: 'Akses pengaduan & layanan publik + halaman masyarakat', 
    icon: '🏘️' 
  },
  { 
    id: 'warga_dpkj', 
    title: 'Warga DPKJ', 
    description: 'Akses lengkap ke fitur masyarakat', 
    icon: '👨‍🤝‍👨' 
  },
  { 
    id: 'warga_luar_dpkj', 
    title: 'Warga Luar DPKJ', 
    description: 'Akses terbatas: profil desa, e-news, UMKM, wisata budaya', 
    icon: '👤' 
  },
];

export default function KelolaPenggunaPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [listRole, setListRole] = useState<RoleCardType | null>(null);

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <AdminHeaderCard title="Kelola Pengguna">
            <AdminHeaderSearchBar />
            <AdminHeaderAccount onLogout={handleLogout} />
          </AdminHeaderCard>

        {/* Role Selection View */}
        {!listRole && (
          <div>
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-100 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-800">Manajemen Role</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Pilih Role Pengguna</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Kelola pengguna berdasarkan role dan permission mereka dalam sistem SiGede DPKJ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {roleCards.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setListRole(role)}
                  className="group text-left p-6 rounded-2xl bg-white border border-gray-200 shadow-md hover:shadow-lg transform transition-all duration-300 cursor-pointer hover:border-gray-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md flex-shrink-0">
                      <div className="text-4xl">{role.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">{role.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Management View */}
        {listRole && (
          <div>


            <UserListNew 
              roleId={listRole.id as UserRole} 
              roleLabel={listRole.title}
            />
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
}
