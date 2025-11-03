"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { handleAdminLogout } from "../../../lib/logoutHelper";
import AdminLayout from "../components/AdminLayout";
import BeritaList from "./components/BeritaList";
import PengumumanList from "./components/PengumumanList";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderIcons, AdminHeaderAccount } from "../../components/AdminHeaderCard";

export default function AdminENewsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tab, setTab] = React.useState<'berita' | 'pengumuman'>('berita');

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <AdminHeaderCard title="E-News">
          <AdminHeaderSearchBar />
          <AdminHeaderIcons />
          <AdminHeaderAccount onLogout={handleLogout} />
        </AdminHeaderCard>
        
        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2 mb-8">
          <button
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
              tab === 'berita' 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setTab('berita')}
          >
            📰 Berita
          </button>
          <button
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 ${
              tab === 'pengumuman' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105' 
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setTab('pengumuman')}
          >
            📢 Pengumuman
          </button>
        </div>
        
        {tab === 'berita' ? <BeritaList /> : <PengumumanList />}
      </div>
    </AdminLayout>
  );
}
