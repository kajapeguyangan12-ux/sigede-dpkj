"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from "../../../components/BottomNavigation";

interface FormLayananProps {
  jenisLayanan: string;
  onBack: () => void;
}

export default function FormLayanan({ jenisLayanan, onBack }: FormLayananProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Identitas Surat
    jenisSurat: '',
    kepalaDusun: '',
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
    if (!formData.nama || !formData.nik || !formData.noKK || !formData.alamat || !formData.noHandphone) {
      alert('Mohon lengkapi semua field yang wajib diisi');
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
        catatanTambahan: `Kepala Dusun: ${formData.kepalaDusun}, Tanggal Surat: ${formData.tanggalSurat}`,
        // User ID - nanti bisa diambil dari context autentikasi
        userId: 'user-' + Date.now().toString(), // temporary user ID
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
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-white to-red-50 text-gray-800">
      <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-4">
        <HeaderCard 
          title="Form Permohonan"
          subtitle={jenisLayanan}
          onBack={onBack}
          showBackButton={true}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Jenis Surat */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-lg ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jenis Surat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Jenis Surat
                </label>
                <input
                  type="text"
                  name="jenisSurat"
                  value={jenisLayanan}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Jenis surat akan terisi otomatis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kepala Dusun
                </label>
                <input
                  type="text"
                  name="kepalaDusun"
                  value={formData.kepalaDusun}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input Kepala Dusun"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  name="tanggalSurat"
                  value={formData.tanggalSurat}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Data Pribadi */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-lg ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIK *
                </label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleChange}
                  required
                  maxLength={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input NIK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No KK *
                </label>
                <input
                  type="text"
                  name="noKK"
                  value={formData.noKK}
                  onChange={handleChange}
                  required
                  maxLength={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input No KK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama *
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input Nama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat *
                </label>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input Alamat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No Handphone *
                </label>
                <input
                  type="tel"
                  name="noHandphone"
                  value={formData.noHandphone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Input No Handphone"
                />
              </div>
            </div>
          </section>

          {/* Deskripsi */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-lg ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deskripsi</h3>
            
            <div>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Input Deskripsi"
              />
            </div>
          </section>

          {/* File Upload Section */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-md p-6 shadow-lg ring-1 ring-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Dokumen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto/Scan KK
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="fileKK"
                  />
                  <label htmlFor="fileKK" className="cursor-pointer">
                    <div className="text-gray-600">
                      <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm">Pilih file atau drag & drop</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto/Scan KTP
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="fileKTP"
                  />
                  <label htmlFor="fileKTP" className="cursor-pointer">
                    <div className="text-gray-600">
                      <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm">Pilih file atau drag & drop</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Syarat dan Ketentuan */}
          <section className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Informasi Penting
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Pastikan semua data yang dimasukkan benar dan sesuai dengan dokumen resmi</p>
              <p>• Permohonan akan diproses dalam 1-3 hari kerja</p>
              <p>• Anda akan mendapat notifikasi melalui sistem jika ada update status</p>
              <p>• Untuk informasi lebih lanjut, hubungi kantor desa pada jam kerja</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
      <BottomNavigation />
    </main>
  );
}