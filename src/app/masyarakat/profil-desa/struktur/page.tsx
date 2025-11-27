"use client";

import { useState, useEffect } from "react";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';
import { getStrukturPemerintahan, getStrukturCoverImage, AnggotaStruktur } from "../../../../lib/profilDesaService";

export default function StrukturPemerintahanPage() {
  const [selectedStructure, setSelectedStructure] = useState<'pemerintahan-desa' | 'bpd'>('pemerintahan-desa');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [anggotaList, setAnggotaList] = useState<AnggotaStruktur[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrukturData();
  }, [selectedStructure]);

  const fetchStrukturData = async () => {
    try {
      setLoading(true);
      const data = await getStrukturPemerintahan(selectedStructure);
      setAnggotaList(data.sort((a, b) => a.urutan - b.urutan));
      
      // Get cover image
      const coverImageUrl = await getStrukturCoverImage(selectedStructure);
      setCoverImage(coverImageUrl);
    } catch (error) {
      console.error('Error fetching struktur data:', error);
    } finally {
      setLoading(false);
    }
  };

  const structureOptions = [
    { key: 'pemerintahan-desa' as const, label: 'Struktur Pemerintahan Desa' },
    { key: 'bpd' as const, label: 'Badan Permusyawaratan Desa' }
  ];

  const getCurrentTitle = () => {
    return structureOptions.find(opt => opt.key === selectedStructure)?.label || 'Struktur Pemerintahan Desa';
  };

  const getCurrentPhotoTitle = () => {
    switch(selectedStructure) {
      case 'pemerintahan-desa': return 'Foto Struktur Desa';
      case 'bpd': return 'Foto Struktur BPD';
      default: return 'Foto Struktur Desa';
    }
  };

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-800">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <HeaderCard 
          title="Profil Desa" 
          backUrl="/masyarakat/profil-desa"
          showBackButton={true}
        />

        {/* Dropdown Selector */}
        <section className="mb-6 sm:mb-8 lg:mb-10 max-w-4xl mx-auto">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full rounded-full bg-white px-6 py-3 sm:py-4 md:text-base lg:text-lg text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-300 flex items-center justify-between"
            >
              <span>{getCurrentTitle()}</span>
              <span className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg ring-1 ring-gray-300 z-10">
                {structureOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setSelectedStructure(option.key);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-6 py-3 sm:py-4 text-left text-sm md:text-base lg:text-lg font-semibold text-gray-800 hover:bg-gray-50 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Content Section */}
        <section className="mb-6 sm:mb-8 lg:mb-10 max-w-6xl mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-xl ring-1 ring-red-200">
            <div className="mb-4 sm:mb-5 lg:mb-6 text-center text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-red-700">
              {getCurrentPhotoTitle()}
            </div>

            {/* Cover Image */}
            {coverImage ? (
              <div className="rounded-2xl overflow-hidden shadow-inner mb-4 sm:mb-5 lg:mb-6">
                <img
                  src={coverImage}
                  alt={getCurrentPhotoTitle()}
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-red-100 to-red-200 p-16 sm:p-20 lg:p-24 text-center shadow-inner mb-4 sm:mb-5 lg:mb-6">
                <span className="text-6xl sm:text-7xl lg:text-8xl">🏛️</span>
                <p className="text-sm sm:text-base lg:text-lg text-red-700 mt-2 sm:mt-3 lg:mt-4 font-medium">Foto belum tersedia</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center text-sm text-gray-500 py-4">
                Memuat data...
              </div>
            )}

            {/* Anggota List */}
            {!loading && anggotaList.length > 0 ? (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                {anggotaList.map((anggota, index) => (
                  <div key={anggota.id || index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 lg:p-6 shadow-md border border-white/30">
                    <div className="flex items-start gap-4 sm:gap-5 lg:gap-6">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        {anggota.foto ? (
                          <img
                            src={anggota.foto}
                            alt={anggota.nama}
                            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-full object-cover border-2 border-red-200 shadow-sm"
                          />
                        ) : (
                          <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl shadow-sm">
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Nama Section */}
                        <div className="mb-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Nama
                          </div>
                          <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                            {anggota.nama}
                          </h4>
                        </div>
                        
                        {/* Jabatan Section */}
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Jabatan
                          </div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 border border-red-200">
                            <span className="text-sm font-semibold text-red-700">
                              {anggota.jabatan}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading && (
              <div className="text-center text-sm text-gray-500 py-4">
                Belum ada data struktur
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}
