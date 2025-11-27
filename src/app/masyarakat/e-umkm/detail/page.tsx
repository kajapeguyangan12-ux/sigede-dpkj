'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UMKM {
  id: string;
  namaUsaha: string;
  namaPemilik: string;
  kategori: string;
  deskripsi: string;
  alamat: string;
  noTelepon: string;
  email?: string;
  jamOperasional?: string;
  hargaRataRata?: string;
  fotoUsaha?: string[];
  rating?: number;
  jumlahProduk?: number;
  totalKunjungan?: number;
}

interface Product {
  id: string;
  namaProduk: string;
  hargaProduk: number;
  stok: number;
  kategori: string;
  deskripsiProduk: string;
  fotoProduk: string[];
  rating: number;
  jumlahTerjual: number;
  status: string;
}

const KATEGORI_PRODUK = [
  'Semua',
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

function DetailTokoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const umkmId = searchParams.get('id');

  const [umkmData, setUmkmData] = useState<UMKM | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (!umkmId) {
      alert('ID toko tidak ditemukan');
      router.push('/masyarakat/e-umkm');
      return;
    }
    fetchTokoData();
    trackVisit();
  }, [umkmId]);

  const trackVisit = async () => {
    try {
      if (!umkmId) return;
      const umkmRef = doc(db, 'e-umkm', umkmId);
      await updateDoc(umkmRef, {
        totalKunjungan: increment(1),
        lastVisited: new Date()
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const fetchTokoData = async () => {
    try {
      setLoading(true);

      // Fetch UMKM data
      const umkmDoc = await getDoc(doc(db, 'e-umkm', umkmId!));
      if (umkmDoc.exists()) {
        setUmkmData({ id: umkmDoc.id, ...umkmDoc.data() } as UMKM);
      } else {
        alert('Toko tidak ditemukan');
        router.push('/masyarakat/e-umkm');
        return;
      }

      // Fetch products
      const q = query(
        collection(db, 'produk-umkm'),
        where('umkmId', '==', umkmId),
        where('status', '==', 'aktif')
      );

      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];

      querySnapshot.forEach((doc) => {
        fetchedProducts.push({
          id: doc.id,
          ...doc.data()
        } as Product);
      });

      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data toko');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Semua' || product.kategori === selectedCategory;
    const matchesSearch = product.namaProduk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.deskripsiProduk.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleContactSeller = () => {
    if (umkmData?.noTelepon) {
      const message = encodeURIComponent(`Halo, saya tertarik dengan produk di toko ${umkmData.namaUsaha}`);
      window.open(`https://wa.me/${umkmData.noTelepon.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleOrderProduct = () => {
    if (selectedProduct && umkmData?.noTelepon) {
      const message = encodeURIComponent(`Halo, Apakah Produk ${selectedProduct.namaProduk} Tersedia?`);
      window.open(`https://wa.me/${umkmData.noTelepon.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
      </div>
    );
  }

  if (!umkmData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 pb-32">
      {/* Header */}
      <div className="mb-6 mt-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8 xl:mx-10 overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10"></div>
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}></div>

          <div className="relative z-10 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5">
            {/* Left - Back Button */}
            <Link href="/masyarakat/e-umkm">
              <button className="group flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex-shrink-0">
                <svg className="h-5 w-5 text-white transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>

            {/* Center - Title */}
            <div className="flex-1 text-center">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg line-clamp-1">{umkmData.namaUsaha}</h1>
              <p className="text-red-100 text-xs sm:text-sm mt-0.5 sm:mt-1 drop-shadow">Detail Toko & Produk</p>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        {/* Toko Info Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* Store Image */}
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 bg-gradient-to-br from-red-100 to-pink-100">
            {umkmData.fotoUsaha && umkmData.fotoUsaha[0] ? (
              <img
                src={umkmData.fotoUsaha[0]}
                alt={umkmData.namaUsaha}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>

          {/* Store Details */}
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">{umkmData.namaUsaha}</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-2">{umkmData.namaPemilik}</p>
                <span className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs sm:text-sm font-semibold rounded-full">
                  {umkmData.kategori}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold">{umkmData.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold">{products.length} Produk</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold">{umkmData.totalKunjungan || 0} Kunjungan</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">{umkmData.deskripsi}</p>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs sm:text-sm">{umkmData.alamat}</span>
              </div>
              {umkmData.jamOperasional && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm">{umkmData.jamOperasional}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleContactSeller}
              className="w-full mt-6 px-6 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Hubungi Penjual
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900 text-sm sm:text-base"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-lg mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {KATEGORI_PRODUK.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produk Tersedia ({filteredProducts.length})
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Produk</h4>
              <p className="text-gray-500 text-sm">
                {searchQuery || selectedCategory !== 'Semua' 
                  ? 'Tidak ada produk yang sesuai dengan pencarian' 
                  : 'Toko ini belum menambahkan produk'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => handleProductClick(product)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100 cursor-pointer hover:scale-105 duration-300"
                >
                  {/* Product Image */}
                  <div className="relative h-36 sm:h-40 md:h-44 lg:h-48 bg-gradient-to-br from-red-100 to-pink-100">
                    {product.fotoProduk && product.fotoProduk[0] ? (
                      <img
                        src={product.fotoProduk[0]}
                        alt={product.namaProduk}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        product.stok > 10 ? 'bg-green-500' : product.stok > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white shadow-lg`}>
                        Stok: {product.stok}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 text-xs sm:text-sm">{product.namaProduk}</h4>
                    <p className="text-red-600 font-bold mb-2 text-sm sm:text-base">{formatRupiah(product.hargaProduk)}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{product.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span>{product.jumlahTerjual || 0} Terjual</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 sm:p-5 md:p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Detail Produk</h2>
                    <p className="text-red-100 text-xs sm:text-sm">Informasi lengkap produk</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
              {/* Product Images Gallery */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Foto Produk
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {selectedProduct.fotoProduk && selectedProduct.fotoProduk.length > 0 ? (
                    selectedProduct.fotoProduk.map((foto, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={foto}
                          alt={`${selectedProduct.namaProduk} ${index + 1}`}
                          className="w-full h-40 sm:h-44 md:h-48 object-cover rounded-xl shadow-md"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 w-full h-40 sm:h-44 md:h-48 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                      <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedProduct.namaProduk}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-600 text-xs sm:text-sm font-semibold rounded-full">
                    {selectedProduct.kategori}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedProduct.stok > 10 ? 'bg-green-100 text-green-700' : 
                    selectedProduct.stok > 0 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    Stok: {selectedProduct.stok}
                  </span>
                </div>

                <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{selectedProduct.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-semibold">{selectedProduct.jumlahTerjual || 0} Terjual</span>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 sm:p-4 mb-4">
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">{formatRupiah(selectedProduct.hargaProduk)}</p>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Deskripsi Produk
                </h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-xl whitespace-pre-line">
                  {selectedProduct.deskripsiProduk}
                </p>
              </div>

              {/* Store Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Informasi Toko
                </h4>
                <p className="text-gray-900 font-semibold">{umkmData?.namaUsaha}</p>
                <p className="text-gray-600 text-sm">{umkmData?.namaPemilik}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 sm:p-5 md:p-6 rounded-b-3xl">
              <button
                onClick={handleOrderProduct}
                className="w-full px-4 sm:px-6 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 duration-300"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm sm:text-base md:text-lg">Pesan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailTokoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
      </div>
    }>
      <DetailTokoContent />
    </Suspense>
  );
}
