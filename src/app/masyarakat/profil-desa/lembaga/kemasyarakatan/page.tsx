"use client";

import { useState, useEffect } from 'react';
import HeaderCard from "../../../../components/HeaderCard";
import BottomNavigation from '../../../../components/BottomNavigation';
import { 
  getLembagaKemasyarakatan, 
  getLembagaCoverImage 
} from '../../../../../lib/profilDesaService';

interface AnggotaLembaga {
  id?: string;
  nama: string;
  jabatan: string;
  email: string;
  noTelepon: string;
  foto?: string;
  urutanTampil: number;
}

type LembagaType = 'kemasyarakatan' | 'karang-taruna';

const lembagaOptions = [
  { value: 'kemasyarakatan' as LembagaType, label: 'Lembaga Pemberdayaan Masyarakat', icon: '🤝' },
  { value: 'karang-taruna' as LembagaType, label: 'Karang Taruna', icon: '🎯' },
];

export default function LembagaKemasyarakatanPage() {
  const [selectedLembaga, setSelectedLembaga] = useState<LembagaType>('kemasyarakatan');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lembagaData, setLembagaData] = useState<AnggotaLembaga[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [dataAnggota, coverImageUrl] = await Promise.all([
          getLembagaKemasyarakatan(selectedLembaga),
          getLembagaCoverImage(selectedLembaga)
        ]);
        
        setLembagaData(dataAnggota as AnggotaLembaga[]);
        setCoverImage(coverImageUrl);
      } catch (error) {
        console.error('Error fetching lembaga data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedLembaga]);

  const currentLembaga = lembagaOptions.find(opt => opt.value === selectedLembaga);

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-800">
      {isDropdownOpen && (
        <button
          type="button"
          aria-label="Tutup dropdown"
          className="fixed inset-0 z-10 cursor-default bg-black/10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-24 sm:pb-28 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <HeaderCard 
          title="Lembaga Desa" 
          backUrl="/masyarakat/profil-desa"
          showBackButton={true}
        />

        {/* Dropdown Section */}
        <section className="mb-6 sm:mb-8 lg:mb-10 max-w-5xl mx-auto">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-2xl sm:rounded-3xl border border-red-200 bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-xl ring-1 ring-red-100/50 hover:bg-red-50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-2xl sm:text-3xl">{currentLembaga?.icon}</span>
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800">
                  {currentLembaga?.label}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-red-200 bg-white/95 backdrop-blur-sm shadow-2xl ring-1 ring-red-100/50 overflow-hidden">
                {lembagaOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedLembaga(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors duration-200 ${
                      selectedLembaga === option.value
                        ? 'bg-red-100 text-red-800'
                        : 'text-gray-700 hover:bg-red-50'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{option.icon}</span>
                    <span className="text-sm sm:text-base font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="mb-6 sm:mb-8 lg:mb-10 max-w-5xl mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-xl ring-1 ring-red-200">
            <div className="mb-4 sm:mb-5 lg:mb-6 text-center text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-red-700">
              Foto Lembaga
            </div>
            {coverImage ? (
              <div className="rounded-2xl overflow-hidden shadow-inner">
                <img 
                  src={coverImage} 
                  alt="Cover Lembaga Kemasyarakatan"
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-red-100 to-red-200 h-48 sm:h-64 md:h-80 text-center shadow-inner flex items-center justify-center">
                <span className="text-6xl sm:text-7xl lg:text-8xl">🏛️</span>
              </div>
            )}
          </div>
        </section>

        {/* Community Institutions */}
        <section className="mb-6 sm:mb-8 lg:mb-10 max-w-5xl mx-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-xl ring-1 ring-red-200">
            <div className="mb-4 sm:mb-5 lg:mb-6 text-center text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-red-700">
              Anggota {currentLembaga?.label}
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm sm:text-base">Memuat data...</div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                {lembagaData.length > 0 ? (
                  lembagaData.map((item, index) => (
                    <div key={item.id || index} className="rounded-xl sm:rounded-2xl bg-gray-50 p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
                      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 mb-2">
                        <div className="grid h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 place-items-center rounded-full bg-gray-800 text-white overflow-hidden">
                          {item.foto ? (
                            <img 
                              src={item.foto} 
                              alt={item.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            <span className="text-gray-500 font-normal">Nama: </span>
                            {item.nama}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="text-gray-500 font-normal">Jabatan: </span>
                            {item.jabatan}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Belum ada data {currentLembaga?.label.toLowerCase()}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <BottomNavigation />
    </main>
  );
}
