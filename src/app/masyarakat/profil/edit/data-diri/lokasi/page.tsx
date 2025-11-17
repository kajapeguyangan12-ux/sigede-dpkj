"use client";

import BottomNavigation from '../../../../../components/BottomNavigation';
import Link from "next/link";
import { useState, useEffect } from "react";
import HeaderCard from "../../../../../components/HeaderCard";
import { useAuth } from '../../../../../../contexts/AuthContext';
import { getMasyarakatByEmail } from '../../../../../../lib/masyarakatService';

export default function LokasiTinggalPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    alamat: "",
    alamatBaru: "",
    kota: "",
    kotaBaru: "",
    kecamatan: "",
    kecamatanBaru: "",
    desa: "",
    desaBaru: "",
    dusun: "",
    dusunBaru: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) {
        setDataLoading(false);
        return;
      }

      console.log('🔍 EDIT LOKASI: Fetching data for:', user.email);

      try {
        const profileData = await getMasyarakatByEmail(user.email);
        
        if (profileData) {
          console.log('✅ EDIT LOKASI: Profile data found:', profileData);
          
          setFormData(prev => ({
            ...prev,
            alamat: profileData.alamat || "-",
            kecamatan: profileData.kecamatan || "-",
            desa: profileData.desa || "-",
          }));
          
          console.log('📋 EDIT LOKASI: Location data set');
        } else {
          console.log('❌ EDIT LOKASI: No profile data found');
          // Fallback to AuthContext
          setFormData(prev => ({
            ...prev,
            alamat: user.address || "-",
          }));
        }
      } catch (error) {
        console.error('💥 EDIT LOKASI ERROR:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Saving location data:", formData);
    setIsLoading(false);
  };

  return (
    <main className="min-h-[100svh] bg-merah-putih animate-bg-pan text-gray-800">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard title="Lokasi Tinggal" backUrl="/masyarakat/profil/edit/data-diri" showBackButton={true} />

        {/* Info Section */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-800">Ubah Lokasi Tinggal</h3>
          <p className="text-xs text-blue-700 mt-1">
            Perhatikan Data yang dapat di lakukan perubahan, perubahan data ini hanya dapat dilakukan 7 hari sekali.
          </p>
        </div>

        {/* Loading State */}
        {dataLoading ? (
          <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alamat Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Alamat
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Alamat</div>
            <textarea
              value={formData.alamat}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3 h-20 resize-none"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Alamat Baru</div>
            <textarea
              value={formData.alamatBaru}
              onChange={(e) => handleInputChange("alamatBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm h-20 resize-none focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Alamat Baru"
            />
          </div>

          {/* Kota Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Kota
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Kota</div>
            <input
              type="text"
              value={formData.kota}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Kota Baru</div>
            <input
              type="text"
              value={formData.kotaBaru}
              onChange={(e) => handleInputChange("kotaBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Kota Baru"
            />
          </div>

          {/* Kecamatan Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Kecamatan
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Kecamatan</div>
            <input
              type="text"
              value={formData.kecamatan}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Kecamatan Baru</div>
            <input
              type="text"
              value={formData.kecamatanBaru}
              onChange={(e) => handleInputChange("kecamatanBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Kecamatan Baru"
            />
          </div>

          {/* Desa Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Desa
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Desa</div>
            <input
              type="text"
              value={formData.desa}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Desa Baru</div>
            <input
              type="text"
              value={formData.desaBaru}
              onChange={(e) => handleInputChange("desaBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Desa Baru"
            />
          </div>

          {/* Dusun Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Dusun
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Dusun</div>
            <input
              type="text"
              value={formData.dusun}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Dusun Baru</div>
            <input
              type="text"
              value={formData.dusunBaru}
              onChange={(e) => handleInputChange("dusunBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Dusun Baru"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 px-2">
            <Link
              href="/masyarakat/profil/edit/data-diri"
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_-2px_0_#0b78c1,0_2px_0_#0b78c133] hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
