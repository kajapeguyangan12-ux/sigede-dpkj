'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const KATEGORI_OPTIONS = [
  'Makanan & Minuman',
  'Fashion & Pakaian',
  'Kerajinan Tangan',
  'Jasa',
  'Pertanian',
  'Teknologi',
  'Kesehatan & Kecantikan',
  'Lainnya'
];

export default function CreateUMKMPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    namaUsaha: '',
    kategori: '',
    deskripsi: '',
    alamat: '',
    noTelepon: '',
    email: '',
    jamOperasional: '',
    hargaRataRata: '',
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [jamBuka, setJamBuka] = useState('08:00');
  const [jamTutup, setJamTutup] = useState('20:00');

  // Load user data and check access
  useEffect(() => {
    if (user) {
      // Block access for external users
      if (user.role === 'warga_luar_dpkj') {
        alert('Akses ditolak. Fitur ini hanya tersedia untuk warga lokal DPKJ.');
        router.push('/masyarakat/e-umkm');
        return;
      }
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, ''); // Remove dots
    if (/^\d*$/.test(value)) { // Only allow numbers
      const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Add thousand separators
      setFormData(prev => ({
        ...prev,
        hargaRataRata: formattedValue
      }));
    }
  };

  const handleTimeModalOpen = () => {
    // Parse existing jamOperasional if available
    if (formData.jamOperasional) {
      const parts = formData.jamOperasional.split(' - ');
      if (parts.length === 2) {
        setJamBuka(parts[0]);
        setJamTutup(parts[1]);
      }
    }
    setShowTimeModal(true);
  };

  const handleTimeSave = () => {
    const jamOperasional = `${jamBuka} - ${jamTutup}`;
    setFormData(prev => ({
      ...prev,
      jamOperasional
    }));
    setShowTimeModal(false);
  };

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          0.9
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      alert('Harap pilih file gambar yang valid');
      return;
    }

    // Check total photos limit
    if (photos.length + validFiles.length > 5) {
      alert('Maksimal 5 foto');
      return;
    }

    // Add photos
    setPhotos(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setShowCameraOptions(false);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePhotoSelect(e);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      try {
        // Convert to WebP
        const webpBlob = await convertToWebP(photo);
        
        // Create filename
        const timestamp = Date.now();
        const filename = `${user?.uid}/${timestamp}.webp`;
        const storageRef = ref(storage, `e-umkm/${filename}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, webpBlob);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.namaUsaha || !formData.kategori || !formData.deskripsi || 
        !formData.alamat || !formData.noTelepon) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    // Foto tidak wajib untuk testing
    // if (photos.length === 0) {
    //   alert('Mohon tambahkan minimal 1 foto usaha');
    //   return;
    // }

    try {
      setUploading(true);

      // Upload images only if photos exist
      const imageUrls = photos.length > 0 ? await uploadImages() : [];

      // Get user data
      const userId = user?.uid;
      const namaPemilik = user?.displayName || user?.email || 'User';

      // Save to Firestore
      await addDoc(collection(db, 'e-umkm'), {
        ...formData,
        userId: userId || '',
        namaPemilik,
        fotoUsaha: imageUrls,
        status: 'pending',
        tanggalDaftar: serverTimestamp(),
        rating: 0,
        jumlahProduk: 0,
        totalKunjungan: 0, // Initialize visit count
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert('UMKM berhasil didaftarkan! Menunggu persetujuan admin.');
      router.push('/masyarakat/e-umkm/toko-saya');
    } catch (error) {
      console.error('Error submitting UMKM:', error);
      alert('Gagal mendaftarkan UMKM. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/masyarakat/e-umkm">
                  <button className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </Link>
                <div className="flex-1 flex items-center gap-2 sm:gap-4">
                  {/* Logo Vercel */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 border-red-100 flex-shrink-0">
                    <img src="/vercel.svg" alt="Logo" className="w-7 h-7 sm:w-10 sm:h-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-2xl font-bold text-gray-800 truncate">Daftarkan UMKM Anda</h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">Lengkapi informasi usaha Anda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Alert */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Informasi Penting</h4>
                <p className="text-sm text-blue-800">
                  Pendaftaran UMKM akan diverifikasi oleh admin desa. Pastikan semua informasi yang Anda masukkan akurat dan lengkap.
                </p>
              </div>
            </div>

            {/* Informasi Usaha */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Informasi Usaha
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nama Usaha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaUsaha"
                    value={formData.namaUsaha}
                    onChange={handleInputChange}
                    placeholder="Contoh: Warung Mbak Sri"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {KATEGORI_OPTIONS.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Deskripsi Usaha <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    placeholder="Jelaskan tentang usaha Anda, produk/layanan yang ditawarkan, dan keunikan usaha Anda..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Alamat Usaha <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    placeholder="Alamat lengkap usaha Anda"
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      No. Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="noTelepon"
                      value={formData.noTelepon}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email (Opsional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Jam Operasional (Opsional)
                    </label>
                    <button
                      type="button"
                      onClick={handleTimeModalOpen}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-left flex items-center justify-between group"
                    >
                      <span className={formData.jamOperasional ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        {formData.jamOperasional || 'Pilih jam operasional'}
                      </span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Harga Rata-rata (Opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="hargaRataRata"
                        value={formData.hargaRataRata}
                        onChange={handleHargaChange}
                        placeholder="5.000.000"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Format otomatis: 5.000.000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Foto */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Foto Usaha <span className="text-gray-400 text-sm font-normal">(Opsional)</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload foto usaha, produk, atau suasana tempat usaha Anda (Maksimal 5 foto)
              </p>

              {/* Camera Options Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowCameraOptions(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Foto
                </button>
              </div>

              {/* Photo Preview Grid */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-2xl shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 italic">
                * Foto akan otomatis dikonversi ke format WebP untuk menghemat penyimpanan
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link href="/masyarakat/e-umkm" className="flex-1">
                <button
                  type="button"
                  className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                  disabled={uploading}
                >
                  Batal
                </button>
              </Link>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengirim...
                  </span>
                ) : (
                  'Daftarkan UMKM'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Camera Options Modal */}
        {showCameraOptions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Pilih Sumber Foto</h3>
                  <button
                    onClick={() => setShowCameraOptions(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-900">Ambil Foto</span>
                      <p className="text-sm text-gray-600">Gunakan kamera</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      className="hidden"
                      multiple
                    />
                  </label>

                  <label className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl cursor-pointer hover:from-green-100 hover:to-green-200 transition-all">
                    <div className="p-3 bg-green-500 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-gray-900">Pilih dari Galeri</span>
                      <p className="text-sm text-gray-600">Pilih foto yang ada</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Picker Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Jam Operasional</h3>
                    <p className="text-sm text-red-100 mt-1">Pilih jam buka dan tutup</p>
                  </div>
                  <button
                    onClick={() => setShowTimeModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Jam Buka */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Jam Buka
                  </label>
                  <div className="relative group">
                    <input
                      type="time"
                      value={jamBuka}
                      onChange={(e) => setJamBuka(e.target.value)}
                      className="w-full pl-14 pr-4 py-5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 text-2xl font-bold hover:border-red-300"
                      style={{
                        colorScheme: 'light'
                      }}
                    />
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <div className="p-2 bg-red-500 rounded-xl shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="flex items-center justify-center py-2">
                  <div className="px-6 py-2.5 bg-gradient-to-r from-red-100 to-pink-100 rounded-full shadow-sm border-2 border-red-200">
                    <span className="text-red-700 font-bold text-base">s/d</span>
                  </div>
                </div>

                {/* Jam Tutup */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Jam Tutup
                  </label>
                  <div className="relative group">
                    <input
                      type="time"
                      value={jamTutup}
                      onChange={(e) => setJamTutup(e.target.value)}
                      className="w-full pl-14 pr-4 py-5 bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-gray-900 text-2xl font-bold hover:border-pink-300"
                      style={{
                        colorScheme: 'light'
                      }}
                    />
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <div className="p-2 bg-pink-500 rounded-xl shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-br from-red-50 via-pink-50 to-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-inner">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-500 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-red-800">Preview:</span>
                  </div>
                  <p className="text-center text-2xl font-bold text-gray-900 tracking-wide">
                    {jamBuka} - {jamTutup}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleTimeSave}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

