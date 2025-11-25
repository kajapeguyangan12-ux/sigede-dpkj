'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface ProductFormData {
  namaProduk: string;
  hargaProduk: string;
  stok: string;
  kategori: string;
  deskripsiProduk: string;
  fotoProduk: File[];
  existingPhotos: string[];
}

const KATEGORI_PRODUK = [
  'Makanan & Minuman',
  'Fashion & Pakaian',
  'Kerajinan Tangan',
  'Elektronik',
  'Kesehatan & Kecantikan',
  'Rumah Tangga',
  'Pertanian',
  'Jasa',
  'Lainnya'
];

export default function EditProdukPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const productId = searchParams.get('id');
  const umkmId = searchParams.get('umkmId');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    namaProduk: '',
    hargaProduk: '',
    stok: '',
    kategori: '',
    deskripsiProduk: '',
    fotoProduk: [],
    existingPhotos: []
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!productId || !umkmId) {
      alert('ID produk atau UMKM tidak ditemukan');
      router.push('/masyarakat/e-umkm/toko-saya');
      return;
    }
    fetchProductData();
  }, [productId, umkmId]);

  const fetchProductData = async () => {
    try {
      setLoadingData(true);
      
      const productDoc = await getDoc(doc(db, 'produk-umkm', productId!));
      if (productDoc.exists()) {
        const data = productDoc.data();
        
        // Verify ownership
        if (data.userId !== user?.uid) {
          alert('Anda tidak memiliki akses ke produk ini');
          router.push('/masyarakat/e-umkm/toko-saya');
          return;
        }

        setFormData({
          namaProduk: data.namaProduk || '',
          hargaProduk: data.hargaProduk?.toString() || '',
          stok: data.stok?.toString() || '',
          kategori: data.kategori || '',
          deskripsiProduk: data.deskripsiProduk || '',
          fotoProduk: [],
          existingPhotos: data.fotoProduk || []
        });
        setPreviewImages(data.fotoProduk || []);
      } else {
        alert('Produk tidak ditemukan');
        router.push(`/masyarakat/e-umkm/toko-saya/produk?umkmId=${umkmId}`);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Gagal memuat data produk');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalImages = formData.existingPhotos.length + formData.fotoProduk.length + files.length;
    if (totalImages > 5) {
      alert('Maksimal 5 foto produk');
      return;
    }

    // Validate file size and type
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} bukan gambar`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        fotoProduk: [...prev.fotoProduk, ...validFiles]
      }));

      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      if (errors.fotoProduk) {
        setErrors(prev => ({ ...prev, fotoProduk: '' }));
      }
    }
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingPhotos: prev.existingPhotos.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    const existingCount = formData.existingPhotos.length;
    const newImageIndex = index - existingCount;
    
    setFormData(prev => ({
      ...prev,
      fotoProduk: prev.fotoProduk.filter((_, i) => i !== newImageIndex)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.namaProduk.trim()) {
      newErrors.namaProduk = 'Nama produk harus diisi';
    }

    if (!formData.hargaProduk || parseFloat(formData.hargaProduk) <= 0) {
      newErrors.hargaProduk = 'Harga produk harus lebih dari 0';
    }

    if (!formData.stok || parseInt(formData.stok) < 0) {
      newErrors.stok = 'Stok tidak boleh negatif';
    }

    if (!formData.kategori) {
      newErrors.kategori = 'Kategori harus dipilih';
    }

    if (!formData.deskripsiProduk.trim()) {
      newErrors.deskripsiProduk = 'Deskripsi produk harus diisi';
    }

    if (formData.existingPhotos.length + formData.fotoProduk.length === 0) {
      newErrors.fotoProduk = 'Minimal 1 foto produk harus ada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    try {
      setLoading(true);

      // Upload new images to Firebase Storage
      const newImageUrls: string[] = [];
      for (const file of formData.fotoProduk) {
        const storageRef = ref(storage, `produk-umkm/${umkmId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        newImageUrls.push(downloadURL);
      }

      // Combine existing and new photos
      const allPhotos = [...formData.existingPhotos, ...newImageUrls];

      // Update product in Firestore
      const productRef = doc(db, 'produk-umkm', productId!);
      await updateDoc(productRef, {
        namaProduk: formData.namaProduk.trim(),
        hargaProduk: parseFloat(formData.hargaProduk),
        stok: parseInt(formData.stok),
        kategori: formData.kategori,
        deskripsiProduk: formData.deskripsiProduk.trim(),
        fotoProduk: allPhotos,
        tanggalDiupdate: serverTimestamp()
      });

      alert('Produk berhasil diperbarui!');
      router.push(`/masyarakat/e-umkm/toko-saya/produk?umkmId=${umkmId}`);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Gagal memperbarui produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 pb-24">
      {/* Header */}
      <div className="mb-6 mt-4 mx-4 overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10"></div>
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}></div>

          <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-5">
            {/* Left - Back Button */}
            <Link href={`/masyarakat/e-umkm/toko-saya/produk?umkmId=${umkmId}`}>
              <button className="group flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex-shrink-0">
                <svg className="h-5 w-5 text-white transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>

            {/* Center - Title */}
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Edit Produk</h1>
              <p className="text-red-100 text-xs sm:text-sm mt-1 drop-shadow">Perbarui informasi produk</p>
            </div>

            {/* Right - Logo */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center">
                <img src="/logo/BDG1.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-700 px-8 py-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Informasi Produk
            </h2>
            <p className="text-red-100 mt-2">Perbarui detail produk Anda</p>
          </div>

          {/* Form Body */}
          <div className="p-8 space-y-6">
            {/* Nama Produk */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="namaProduk"
                value={formData.namaProduk}
                onChange={handleInputChange}
                placeholder="Masukkan nama produk"
                className={`w-full px-4 py-3 border-2 ${errors.namaProduk ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900`}
              />
              {errors.namaProduk && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.namaProduk}
                </p>
              )}
            </div>

            {/* Harga Produk & Stok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Harga Produk (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="hargaProduk"
                  value={formData.hargaProduk}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 border-2 ${errors.hargaProduk ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900`}
                />
                {errors.hargaProduk && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.hargaProduk}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stok"
                  value={formData.stok}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 border-2 ${errors.stok ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900`}
                />
                {errors.stok && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.stok}
                  </p>
                )}
              </div>
            </div>

            {/* Kategori Produk */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 ${errors.kategori ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900 bg-white cursor-pointer`}
              >
                <option value="">Pilih Kategori</option>
                {KATEGORI_PRODUK.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
              {errors.kategori && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.kategori}
                </p>
              )}
            </div>

            {/* Deskripsi Produk */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Deskripsi Produk <span className="text-red-500">*</span>
              </label>
              <textarea
                name="deskripsiProduk"
                value={formData.deskripsiProduk}
                onChange={handleInputChange}
                placeholder="Jelaskan detail produk Anda..."
                rows={5}
                className={`w-full px-4 py-3 border-2 ${errors.deskripsiProduk ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-gray-900`}
              />
              {errors.deskripsiProduk && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.deskripsiProduk}
                </p>
              )}
            </div>

            {/* Upload Foto Produk */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Foto Produk <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">(Maksimal 5 foto, masing-masing 5MB)</span>
              </label>
              
              {/* Preview Images */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (index < formData.existingPhotos.length) {
                            removeExistingImage(index);
                          } else {
                            removeNewImage(index);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {previewImages.length < 5 && (
                <label className={`block w-full border-2 ${errors.fotoProduk ? 'border-red-500' : 'border-dashed border-gray-300'} rounded-xl p-8 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 font-bold">Klik untuk upload gambar</p>
                      <p className="text-gray-500 text-sm mt-1">PNG, JPG hingga 5MB</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              {errors.fotoProduk && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.fotoProduk}
                </p>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-8 py-6 bg-gray-50 flex gap-4">
            <Link href={`/masyarakat/e-umkm/toko-saya/produk?umkmId=${umkmId}`} className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800'
              } text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
