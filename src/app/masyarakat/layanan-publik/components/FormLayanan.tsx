"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from "../../../components/BottomNavigation";
import { useAuth } from '@/contexts/AuthContext';
import { getDataDesa } from '@/lib/dataDesaService';

interface FormLayananProps {
  jenisLayanan: string;
  onBack: () => void;
}

export default function FormLayanan({ jenisLayanan, onBack }: FormLayananProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    // Identitas Surat
    jenisSurat: '',
    tanggalSurat: '',
    
    // Data Pribadi
    nik: '',
    noKK: '',
    nama: '',
    alamat: '',
    email: '',
    noHandphone: '',
    
    // Deskripsi/Keperluan
    deskripsi: ''
  });

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setLoadingData(false);
        return;
      }

      try {
        console.log('🔍 Loading user data for:', user);
        
        // Get NIK from user object (stored in authenticationService)
        const userNik = user.nik || (user as any).idNumber;
        
        if (!userNik) {
          console.log('⚠️ No NIK found in user object');
          setLoadingData(false);
          return;
        }

        console.log('🔑 User NIK:', userNik);
        
        // Fetch all data from data-desa collection
        const allData = await getDataDesa();
        console.log('📊 Total data from data-desa:', allData.length);
        
        // Find user data by matching NIK
        const userData = allData.find(person => person.nik === userNik);
        
        if (userData) {
          console.log('✅ Found user data:', userData);
          // Auto-fill form with user data from data-desa
          setFormData(prev => ({
            ...prev,
            nik: userData.nik || '',
            noKK: userData.noKK || '',
            nama: userData.namaLengkap || '',
            alamat: userData.alamat || '',
            // Prioritize email and phone from data-desa, fallback to user auth data
            email: userData.email || user.email || '',
            noHandphone: userData.noTelepon || user.phoneNumber || ''
          }));
        } else {
          console.log('⚠️ User data not found in data-desa, using auth data');
          // Fallback to auth user data if not found in data-desa
          setFormData(prev => ({
            ...prev,
            nik: userNik,
            nama: user.displayName || '',
            email: user.email || '',
            noHandphone: user.phoneNumber || ''
          }));
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi required fields
    if (!formData.nama || !formData.nik || !formData.noKK || !formData.alamat || !formData.email || !formData.noHandphone) {
      alert('Mohon lengkapi semua field yang wajib diisi. Jika data tidak terisi otomatis, silakan hubungi administrator.');
      return;
    }

    setLoading(true);

    try {
      // Import layanan publik service
      const { addLayananPublik } = await import('@/lib/layananPublikService');
      
      // Prepare data untuk database
      const layananData = {
        jenisLayanan: jenisLayanan,
        judulSurat: jenisLayanan,
        namaLengkap: formData.nama,
        nik: formData.nik,
        noKK: formData.noKK,
        alamat: formData.alamat,
        noTelepon: formData.noHandphone,
        email: formData.email || '',
        keperluan: formData.deskripsi,
        catatanTambahan: `Tanggal Surat: ${formData.tanggalSurat}`,
        userId: user?.uid || 'user-' + Date.now().toString(),
      };
      
      await addLayananPublik(layananData);
      
      alert('Permohonan layanan berhasil diajukan!');
      onBack();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-blue-50 to-gray-100 text-gray-800">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-32 sm:pb-36 pt-3 sm:pt-4 md:pt-5 lg:pt-6">
        <div className="max-w-4xl mx-auto">
        <HeaderCard 
          title="Form Permohonan"
          subtitle={jenisLayanan}
          onBack={onBack}
          showBackButton={true}
        />

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 lg:space-y-10">
          {loadingData && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Memuat data...</span>
              </div>
            </div>
          )}

          {/* Jenis Surat */}
          <section className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-5 lg:mb-6">Jenis Surat</h3>
            
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Input Jenis Surat
                </label>
                <input
                  type="text"
                  name="jenisSurat"
                  value={jenisLayanan}
                  readOnly
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700"
                  placeholder="Jenis surat akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  name="tanggalSurat"
                  value={formData.tanggalSurat}
                  onChange={handleChange}
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Data Pribadi */}
          <section className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <div className="flex items-start justify-between mb-4 sm:mb-5 lg:mb-6">
              <div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">Data Pribadi</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Data terisi otomatis dari akun Anda</p>
              </div>
            </div>
            
            {/* Info Notice */}
            <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex gap-2 sm:gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-1">Pastikan Data Anda Sudah Benar</h4>
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                    Data pribadi diambil dari akun Anda yang terdaftar. Jika terdapat kesalahan data, silakan hubungi administrator untuk pembaruan data.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  NIK *
                </label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  readOnly
                  required
                  maxLength={16}
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="NIK akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  No KK *
                </label>
                <input
                  type="text"
                  name="noKK"
                  value={formData.noKK}
                  readOnly
                  required
                  maxLength={16}
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="No KK akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  readOnly
                  required
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Nama akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Alamat *
                </label>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  readOnly
                  required
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Alamat akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  required
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Email akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  No Handphone *
                </label>
                <input
                  type="tel"
                  name="noHandphone"
                  value={formData.noHandphone}
                  readOnly
                  required
                  className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="No Handphone akan terisi otomatis"
                />
              </div>
            </div>
          </section>

          {/* Deskripsi */}
          <section className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-5 lg:mb-6">Deskripsi</h3>
            
            <div>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 border border-gray-300 rounded-xl text-sm sm:text-base lg:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Input Deskripsi"
              />
            </div>
          </section>

          {/* File Upload Section */}
          <section className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg ring-1 ring-gray-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-5 lg:mb-6">Upload Dokumen</h3>
            
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Foto/Scan KK
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-5 lg:p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="fileKK"
                  />
                  <label htmlFor="fileKK" className="cursor-pointer">
                    <div className="text-gray-600">
                      <svg className="mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs sm:text-sm lg:text-base">Pilih file atau drag & drop</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                  Foto/Scan KTP
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-5 lg:p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="fileKTP"
                  />
                  <label htmlFor="fileKTP" className="cursor-pointer">
                    <div className="text-gray-600">
                      <svg className="mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs sm:text-sm lg:text-base">Pilih file atau drag & drop</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Syarat dan Ketentuan */}
          <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 md:p-6 lg:p-7 border border-blue-200">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Informasi Penting
            </h3>
            <div className="text-xs sm:text-sm lg:text-base text-blue-800 space-y-2">
              <p>• Pastikan semua data yang dimasukkan benar dan sesuai dengan dokumen resmi</p>
              <p>• Permohonan akan diproses dalam 1-3 hari kerja</p>
              <p>• Anda akan mendapat notifikasi melalui sistem jika ada update status</p>
              <p>• Untuk informasi lebih lanjut, hubungi kantor desa pada jam kerja</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 sm:py-4 border border-gray-300 text-gray-700 font-medium rounded-xl text-sm sm:text-base lg:text-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 sm:py-4 px-6 rounded-xl text-sm sm:text-base lg:text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengirim...
                </>
              ) : (
                'Ajukan Permohonan'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
      <BottomNavigation />
    </main>
  );
}