'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import BottomNavigation from '../../components/BottomNavigation';
import { collection, getDocs, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
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
  status: 'aktif' | 'tidak_aktif' | 'pending';
  rating?: number;
  jumlahProduk?: number;
  totalKunjungan?: number;
  lastVisited?: any;
}

const categories = ['Semua', 'Makanan & Minuman', 'Fashion & Pakaian', 'Kerajinan Tangan', 'Jasa', 'Pertanian', 'Teknologi', 'Kesehatan & Kecantikan', 'Lainnya'];

export default function EUMKMPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    const saved = localStorage.getItem('savedProducts');
    if (saved) {
      setSavedProducts(JSON.parse(saved).map((p: any) => p.id));
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'e-umkm'),
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
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveProduct = (product: Product) => {
    const existingSaved = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    
    // Check if product already saved
    const isSaved = existingSaved.some((p: any) => p.id === product.id);
    
    let updatedProducts;
    if (isSaved) {
      // Remove from saved
      updatedProducts = existingSaved.filter((p: any) => p.id !== product.id);
      setSavedProducts(savedProducts.filter(id => id !== product.id));
    } else {
      // Add to saved - transform to match SavedProduct interface
      const savedProduct = {
        id: product.id,
        name: product.namaUsaha,
        price: product.hargaRataRata || 'Hubungi penjual',
        store: product.namaPemilik,
        rating: product.rating || 0,
        description: product.deskripsi || '',
        image: product.fotoUsaha?.[0] || '',
        phone: product.noTelepon || '',
        kategori: product.kategori || ''
      };
      updatedProducts = [...existingSaved, savedProduct];
      setSavedProducts([...savedProducts, product.id]);
    }
    
    localStorage.setItem('savedProducts', JSON.stringify(updatedProducts));
    
    // Show toast notification
    if (isSaved) {
      showToast('Dihapus dari produk tersimpan', 'error');
    } else {
      showToast('Berhasil disimpan!', 'success');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white'
    }`;
    toast.textContent = message;
    toast.style.animation = 'slideDown 0.3s ease-out';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  // Handle product click - track visits and navigate to detail page
  const handleProductClick = async (product: Product) => {
    try {
      // Update visit count in Firestore
      const productRef = doc(db, 'e-umkm', product.id);
      await updateDoc(productRef, {
        totalKunjungan: increment(1),
        lastVisited: new Date()
      });
      
      console.log(`🏪 UMKM "${product.namaUsaha}" dikunjungi. Total kunjungan bertambah.`);
      
      // Navigate to detail page
      router.push(`/masyarakat/e-umkm/detail?id=${product.id}`);
      
    } catch (error) {
      console.error('Error updating visit count:', error);
      // Still navigate even if visit tracking fails
      router.push(`/masyarakat/e-umkm/detail?id=${product.id}`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'Semua' || product.kategori === selectedCategory;
      const matchesSearch = product.namaUsaha.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.namaPemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-800">
      {/* Enhanced Professional Sidebar Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" 
            onClick={() => setIsMenuOpen(false)} 
          />
          
          {/* Sidebar Panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out">
            {/* Header Section */}
            <div className="relative p-6 bg-gradient-to-br from-red-500 to-red-600">
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <p className="text-red-100 text-sm mt-1">E-UMKM Dauh Puri Kaja</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="group p-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
                >
                  <svg className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-6 space-y-3">
              <a 
                href="/masyarakat/e-umkm/disimpan" 
                className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 border border-gray-200/50 hover:border-red-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-red-50 transition-colors duration-300">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <span className="text-gray-800 font-semibold group-hover:text-red-700 transition-colors duration-300">Disimpan</span>
                  <p className="text-gray-500 text-sm mt-0.5">Produk tersimpan</p>
                </div>
              </a>

              {/* Toko Saya - Only for non-external users */}
              {user?.role !== 'warga_luar_dpkj' && (
                <a 
                  href="/masyarakat/e-umkm/toko-saya" 
                  className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 border border-gray-200/50 hover:border-red-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-red-50 transition-colors duration-300">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-800 font-semibold group-hover:text-red-700 transition-colors duration-300">Toko Saya</span>
                    <p className="text-gray-500 text-sm mt-0.5">Kelola toko Anda</p>
                  </div>
                </a>
              )}

              <a 
                href="/masyarakat/e-umkm/voucher-saya" 
                className="group flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 border border-gray-200/50 hover:border-red-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-red-50 transition-colors duration-300">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <span className="text-gray-800 font-semibold group-hover:text-red-700 transition-colors duration-300">Voucher Saya</span>
                  <p className="text-gray-500 text-sm mt-0.5">Voucher & promo</p>
                </div>
              </a>
            </nav>

            {/* Footer Section */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50 bg-gradient-to-t from-gray-50/50">
              <div className="text-center">
                <p className="text-gray-500 text-xs">E-UMKM Desa Peguyangan</p>
                <p className="text-gray-400 text-xs mt-1">Marketplace Lokal Terpercaya</p>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4">
        {/* Header Card - Custom untuk E-UMKM */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-200/50 backdrop-blur-xl">
          <div className="relative">
            {/* Enhanced Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700 opacity-95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10"></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%), 
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }}></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4">
              {/* Left Section - Back Button */}
              <Link 
                href="/masyarakat/home"
                className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
              >
                <svg className="h-5 w-5 text-white transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {/* Center Section - Title & Subtitle */}
              <div className="text-center">
                <h1 className="text-lg font-bold text-white tracking-wide">E-UMKM</h1>
                <p className="text-xs text-white/80 font-medium mt-0.5">Marketplace Desa</p>
              </div>

              {/* Right Section - Menu Button (No Logo) */}
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
        </div>

        {/* Search Bar */}
        <section className="mb-6">
          <div className="rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 bg-white/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-6">
          <div className="rounded-3xl bg-white/90 p-4 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="mb-6">
          <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-red-200 backdrop-blur-sm">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Tidak Ada UMKM</h3>
                <p className="text-gray-500 text-sm">Belum ada UMKM yang terdaftar</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl shadow-lg p-4 ring-1 ring-red-100 relative group hover:shadow-2xl hover:ring-2 hover:ring-red-300 transition-all duration-300 cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Bookmark Button with Animation */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveProduct(product);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full z-10 transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                        savedProducts.includes(product.id)
                          ? 'bg-red-100 text-red-600 shadow-lg shadow-red-200'
                          : 'bg-white/80 text-gray-400 hover:bg-gray-100 shadow-md'
                      }`}
                      title={savedProducts.includes(product.id) ? 'Hapus dari tersimpan' : 'Simpan produk'}
                    >
                      <svg 
                        className={`w-5 h-5 transition-all duration-300 ${
                          savedProducts.includes(product.id) ? 'scale-110' : ''
                        }`} 
                        fill={savedProducts.includes(product.id) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    
                    {/* Image */}
                    <div className="w-full h-32 bg-gradient-to-br from-red-100 to-red-200 rounded-xl mb-3 flex items-center justify-center shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-300">
                      {product.fotoUsaha && product.fotoUsaha[0] ? (
                        <img 
                          src={product.fotoUsaha[0]} 
                          alt={product.namaUsaha}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-red-600 text-sm font-medium">Foto Produk</span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 group-hover:text-red-600 transition-colors">{product.namaUsaha}</h3>
                    <p className="text-red-600 font-bold mb-1">{product.hargaRataRata || 'Hubungi penjual'}</p>
                    <p className="text-gray-500 text-sm mb-1 line-clamp-1">{product.namaPemilik}</p>
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-gray-600 text-sm ml-1">{product.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Action Button - Buat Toko (Only for non-external users) */}
      {user?.role !== 'warga_luar_dpkj' && (
        <Link href="/masyarakat/e-umkm/create">
          <button className="fixed right-6 bottom-24 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 group">
            <svg className="w-6 h-6 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-bold">Buat Toko</span>
          </button>
        </Link>
      )}

      {/* Navigation Bar */}
      <BottomNavigation />
    </main>
  );
}

