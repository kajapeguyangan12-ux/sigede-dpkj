"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminHeaderCard({ title, children, className = '' }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
  <div className={"w-full bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-sm border border-gray-200 px-8 py-6 flex items-center justify-between mb-8 -mt-10 md:-mt-14 lg:-mt-16 z-50 relative backdrop-blur-sm " + className}>
      <div className="font-bold text-3xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{title}</div>
      <div className="flex items-center gap-6">{children}</div>
    </div>
  );
}

export function AdminHeaderSearchBar({ placeholder = "Cari menu..." }: { placeholder?: string }) {
  return (
    <div className="flex items-center w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-300 px-5 py-3 hover:border-gray-400 transition-colors">
      <input
        type="text"
        placeholder={placeholder}
        className="flex-1 bg-transparent text-gray-700 text-base font-medium focus:outline-none placeholder-gray-400"
      />
      <svg
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
  );
}

export function AdminHeaderIcons() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="text-gray-600"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      </div>
    </div>
  );
}

export function AdminHeaderAccount({ onLogout }: { onLogout?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  // Get user data from auth context or fallback
  const username = user?.displayName || user?.userName || "Admin";
  const email = user?.email || "admin@example.com";
  const role = user?.role || "administrator";
  
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

  const handleDetailAkun = () => {
    setOpen(false);
    router.push('/admin/profil-admin');
  };

  return (
    <div className="relative z-[100]">
      <button
        className="rounded-lg bg-gradient-to-br from-red-100 to-red-50 p-2 ml-2 hover:from-red-200 hover:to-red-100 transition-colors shadow-sm border border-red-200"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-600"><circle cx="12" cy="8" r="4"/><path d="M6 20c0-2.5 3-4 6-4s6 1.5 6 4"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-[200] animate-pop">
          <div className="absolute -top-2 right-8 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-200" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-gray-800 truncate">{username}</div>
                <div className="text-sm text-gray-500 truncate">{email}</div>
                <div className="text-xs text-red-600 font-medium mt-1">{getRoleDisplay(role)}</div>
              </div>
            </div>
            <hr className="my-4 border-gray-200" />
            <button 
              onClick={handleDetailAkun}
              className="flex items-center gap-3 text-gray-700 py-2 w-full text-left hover:bg-gray-50 rounded-lg px-3 transition-colors font-medium"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><circle cx="10" cy="8" r="3.2"/><path d="M3.5 18a6.5 6.5 0 0 1 13 0"/></svg>
              Detail Akun
            </button>
            <button
              className="flex items-center gap-3 text-red-600 py-2 w-full text-left hover:bg-red-50 rounded-lg px-3 mt-1 font-semibold transition-colors"
              onClick={onLogout}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-600"><path d="M16 17l5-5-5-5M21 12H9"/><path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7"/></svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
