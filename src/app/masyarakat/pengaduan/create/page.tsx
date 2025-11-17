'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createLaporan } from '@/lib/laporanPengaduanService';
import { getDataDesa } from '@/lib/dataDesaService';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

const kategoriOptions = [
  'Infrastruktur',
  'Pelayanan Publik',
  'Kebersihan',
  'Keamanan',
  'Kesehatan',
  'Pendidikan',
  'Sosial',
  'Lingkungan',
  'Lainnya'
];

export default function BuatLaporanPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    judul: '',
    kategori: '',
    isi: '',
    namaLengkap: '',
    nik: '',
    alamat: '',
    daerah: '', // Daerah/banjar
    noTelepon: '',
    email: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/masyarakat/login');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Initialize form data with user info
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userNik = (user as any).nik || '';
        let userDaerah = '';
        
        // Fetch daerah dari data-desa jika ada NIK
        if (userNik) {
          try {
            const allData = await getDataDesa();
            const userData = allData.find(d => d.nik === userNik);
            if (userData?.daerah) {
              userDaerah = userData.daerah;
            }
          } catch (error) {
            console.error('Error fetching daerah:', error);
          }
        }
        
        setFormData(prev => ({
          ...prev,
          namaLengkap: user.displayName || user.email || '',
          nik: userNik,
          alamat: (user as any).address || '',
          daerah: userDaerah,
          noTelepon: user.phoneNumber || '',
          email: user.email || '',
        }));
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Convert image to WebP
  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          }, 'image/webp', 0.9);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Convert to WebP
      const webpBlob = await convertToWebP(file);
      const webpFile = new File([webpBlob], `${Date.now()}.webp`, { type: 'image/webp' });
      
      setImageFile(webpFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(webpBlob);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Gagal memproses gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user?.uid) return null;

    try {
      const fileName = `pengaduan/${user.uid}/${Date.now()}.webp`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      alert('Anda harus login untuk membuat laporan');
      router.push('/masyarakat/login');
      return;
    }

    // Validasi form
    if (!formData.judul.trim() || !formData.kategori || !formData.isi.trim()) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Validasi minimal karakter
    if (formData.isi.length < 20) {
      alert('Isi laporan minimal 20 karakter');
      return;
    }

    try {
      setLoading(true);
      
      // Create laporan dengan foto (akan otomatis convert ke WebP)
      await createLaporan(
        {
          userId: user.uid,
          userName: user.displayName || user.email || 'Pengguna',
          judul: formData.judul.trim(),
          kategori: formData.kategori,
          isi: formData.isi.trim(),
          namaLengkap: formData.namaLengkap.trim(),
          nik: formData.nik.trim(),
          alamat: formData.alamat.trim(),
          daerah: formData.daerah.trim(), // Sertakan daerah
          noTelepon: formData.noTelepon.trim(),
          email: formData.email.trim(),
        },
        imageFile || undefined
      );

      alert('✅ Laporan berhasil dikirim!\n\nLaporan Anda akan diproses oleh admin dalam 1-3 hari kerja.');
      router.push('/masyarakat/riwayat');
      
    } catch (error) {
      console.error('Error submitting laporan:', error);
      alert('❌ Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 pb-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-500 to-pink-600 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">Buat Laporan Pengaduan</h1>
                <p className="text-xs text-white/90 mt-0.5">Sampaikan keluhan Anda kepada kami</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Info Card */}
            <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl p-4 border border-red-200">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-sm mb-1">Informasi Penting</h3>
                  <p className="text-xs text-red-800 leading-relaxed">
                    Pastikan data yang Anda isi sudah benar. Laporan akan diproses oleh admin dalam 1-3 hari kerja.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/95 rounded-3xl shadow-xl ring-1 ring-red-100/50 overflow-hidden">
              <div className="p-6 space-y-5">
                {/* Section: Informasi Laporan */}
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></span>
                    Informasi Laporan
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Judul Laporan */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Judul Laporan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="judul"
                        value={formData.judul}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400"
                        placeholder="Contoh: Jalan Rusak di Gang Mawar"
                        required
                      />
                    </div>

                    {/* Kategori */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="kategori"
                        value={formData.kategori}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-sm font-medium text-gray-900"
                        required
                      >
                        <option value="" className="text-gray-400">Pilih kategori laporan</option>
                        {kategoriOptions.map(kategori => (
                          <option key={kategori} value={kategori}>{kategori}</option>
                        ))}
                      </select>
                    </div>

                    {/* Isi Laporan */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Isi Laporan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="isi"
                        value={formData.isi}
                        onChange={handleChange}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-sm resize-none text-gray-900 placeholder:text-gray-400"
                        placeholder="Jelaskan detail laporan Anda dengan jelas..."
                        required
                      />
                      <p className="mt-1.5 text-xs text-gray-500">Minimal 20 karakter</p>
                    </div>

                    {/* Upload Foto */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Foto Pendukung
                      </label>
                      
                      {!imagePreview ? (
                        <div className="space-y-3">
                          {/* Upload Button */}
                          <label className="block">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageChange}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                            <div className="w-full px-4 py-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-gray-50 hover:bg-red-50/50 transition-all cursor-pointer group">
                              <div className="text-center">
                                {uploadingImage ? (
                                  <>
                                    <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center">
                                      <svg className="animate-spin h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">Memproses gambar...</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="mx-auto w-12 h-12 mb-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-700 mb-1">Ambil atau Pilih Foto</p>
                                    <p className="text-xs text-gray-500">Klik untuk buka kamera atau pilih dari galeri</p>
                                    <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG (Maks. 5MB)</p>
                                    <p className="text-xs text-green-600 mt-1">✓ Otomatis convert ke WebP</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>

                          {/* Alternative: Manual camera/gallery selection */}
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                              <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-bold text-center cursor-pointer transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Kamera</span>
                              </div>
                            </label>
                            
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                              <div className="px-4 py-3 rounded-xl bg-white border-2 border-red-300 hover:border-red-500 text-red-600 hover:text-red-700 text-sm font-bold text-center cursor-pointer transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Galeri</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden border-2 border-red-200">
                          <div className="relative aspect-video bg-gray-100">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-white text-xs font-medium flex items-center gap-1">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Foto siap dikirim (WebP Format)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100"></div>

                {/* Section: Data Pelapor */}
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-pink-600 rounded-full"></span>
                    Data Pelapor
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Info Note */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Data di bawah ini diambil dari akun Anda dan tidak dapat diubah. Pastikan data akun Anda sudah benar.</span>
                      </p>
                    </div>

                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Tidak dapat diubah
                        </span>
                      </label>
                      <input
                        type="text"
                        name="namaLengkap"
                        value={formData.namaLengkap}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 ring-1 ring-gray-300 text-sm text-gray-700 cursor-not-allowed"
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>

                    {/* NIK */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        NIK <span className="text-red-500">*</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Tidak dapat diubah
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nik"
                        value={formData.nik}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 ring-1 ring-gray-300 text-sm text-gray-700 cursor-not-allowed"
                        placeholder="Masukkan NIK (16 digit)"
                        maxLength={16}
                        required
                      />
                    </div>

                    {/* Alamat */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        Alamat <span className="text-red-500">*</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Dapat diubah
                        </span>
                      </label>
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-50 ring-1 ring-gray-200 focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-sm resize-none text-gray-900 placeholder:text-gray-400"
                        placeholder="Masukkan alamat lengkap"
                        required
                      />
                    </div>

                    {/* No. Telepon */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        No. Telepon <span className="text-red-500">*</span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Tidak dapat diubah
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="noTelepon"
                        value={formData.noTelepon}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 ring-1 ring-gray-300 text-sm text-gray-700 cursor-not-allowed"
                        placeholder="Contoh: 08123456789"
                        required
                      />
                    </div>

                    {/* Email (Opsional) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        Email
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Tidak dapat diubah
                        </span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 ring-1 ring-gray-300 text-sm text-gray-700 cursor-not-allowed"
                        placeholder="email@contoh.com (opsional)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-4 z-10">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all duration-300 transform ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Mengirim Laporan...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Kirim Laporan</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}