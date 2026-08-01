"use client";

import BottomNavigation from '../../../../../components/BottomNavigation';
import Link from "next/link";
import { useState } from "react";
import HeaderCard from "../../../../../components/HeaderCard";

export default function UbahKataSandiPage() {
  const [formData, setFormData] = useState({
    kataSandiSaatIni: "",
    kataSandiBaru: "",
    konfirmasiKataSandi: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Saving password data:", formData);
    setIsLoading(false);
  };

  return (
    <main className="min-h-[100svh] bg-merah-putih animate-bg-pan text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Pengaturan Akun" backUrl="/masyarakat/profil/edit/akun" showBackButton={true} />

        {/* Info Section */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-800">Ubah Kata Sandi</h3>
          <p className="text-xs text-blue-700 mt-1">
            Kata Sandi Anda harus lebih dari enam karakter dan berisi kombinasi angka, huruf, dan karakter khusus (!@#$%)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kata Sandi Saat Ini Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={formData.kataSandiSaatIni}
                onChange={(e) => handleInputChange("kataSandiSaatIni", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm pr-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Masukkan Kata Sandi Saat Ini"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.current ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Kata Sandi Baru Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={formData.kataSandiBaru}
                onChange={(e) => handleInputChange("kataSandiBaru", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm pr-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Masukkan Kata Sandi Baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.new ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={formData.konfirmasiKataSandi}
                onChange={(e) => handleInputChange("konfirmasiKataSandi", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm pr-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Masukkan Kembali Kata Sandi Baru"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword.confirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 px-2">
            <Link
              href="/masyarakat/profil/edit/akun"
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_-2px_0_#059669,0_2px_0_#05966933] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      <BottomNavigation />
    </main>
  );
}
