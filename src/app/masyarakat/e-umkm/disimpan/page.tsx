'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../../components/BottomNavigation';
import { ArrowLeft, Bookmark, Search, Trash2, MessageCircle } from 'lucide-react';

interface SavedProduct {
  id: string;
  name: string;
  price: string;
  store: string;
  rating: number;
  description: string;
  image: string;
  phone?: string; // Phone number for WhatsApp
  kategori?: string; // Category for filtering
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'makanan', label: 'Makanan' },
  { id: 'minuman', label: 'Minuman' }
];

export default function DisimpanPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('savedProducts');
    if (saved) {
      setSavedProducts(JSON.parse(saved));
    }
  }, []);

  const filteredProducts = savedProducts.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || 
                           product.kategori?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                           product.name.toLowerCase().includes(selectedCategory);
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const removeProduct = (id: string) => {
    const updated = savedProducts.filter(p => p.id !== id);
    setSavedProducts(updated);
    localStorage.setItem('savedProducts', JSON.stringify(updated));
    
    // Show toast notification
    showToast('Produk dihapus dari daftar tersimpan', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
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

  const contactSeller = (product: SavedProduct) => {
    if (!product.phone) {
      showToast('Nomor telepon tidak tersedia', 'error');
      return;
    }
    
    // Format phone number for WhatsApp
    let phoneNumber = product.phone.replace(/\D/g, ''); // Remove non-numeric characters
    
    // Add country code if not present
    if (!phoneNumber.startsWith('62')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '62' + phoneNumber.substring(1);
      } else {
        phoneNumber = '62' + phoneNumber;
      }
    }
    
    const message = encodeURIComponent(
      `Halo, saya tertarik dengan produk *${product.name}* dari toko *${product.store}*. Bisa info lebih lanjut?`
    );
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-white to-red-50">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-32 pt-4">
        {/* Header Card - Modern Design */}
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-2xl overflow-hidden">
          <div className="relative px-4 sm:px-6 py-4 sm:py-5">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
            
            <div className="relative flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 active:scale-95"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-white fill-white" />
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white">Disimpan</h1>
              </div>
              <div className="w-10"></div> {/* Spacer for alignment */}
            </div>
          </div>
        </div>

        {/* Search Bar - Modern Glass Effect */}
        <section className="mb-4 sm:mb-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Cari produk, toko, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 md:py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-md transition-all duration-300 hover:shadow-lg placeholder:text-gray-400 text-sm sm:text-base"
            />
          </div>
        </section>

        {/* Categories - Modern Pills */}
        <section className="mb-5 sm:mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'bg-white text-gray-600 shadow-md hover:shadow-lg border-2 border-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        {/* Products List - Modern Cards */}
        <section className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 md:p-12 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Belum Ada Produk Tersimpan</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Mulai simpan produk favorit Anda untuk akses cepat</p>
              <button
                onClick={() => router.push('/masyarakat/e-umkm')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                Jelajahi UMKM
              </button>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <p className="text-xs sm:text-sm font-semibold text-gray-600">
                  {filteredProducts.length} Produk Tersimpan
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>

              {/* Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-red-200 group"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex space-x-3 sm:space-x-4">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 via-red-200 to-red-300 rounded-xl flex-shrink-0 shadow-md overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-red-600 text-xs font-bold text-center px-2">Foto Produk</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base line-clamp-1 group-hover:text-red-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-red-600 font-bold text-base sm:text-lg">
                              {product.price}
                            </p>
                            <div className="flex items-center space-x-1 bg-yellow-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                              <span className="text-yellow-500 text-xs sm:text-sm">★</span>
                              <span className="text-gray-700 text-xs font-semibold">{product.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-500 text-xs sm:text-sm flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v3.586l1.707 1.707a1 1 0 01-1.414 1.414l-2-2A1 1 0 019 9V5z" clipRule="evenodd" />
                            </svg>
                            {product.store}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Hapus</span>
                        </button>
                        <button 
                          onClick={() => contactSeller(product)}
                          className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Hubungi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Navigation Bar */}
      <BottomNavigation />
    </main>
  );
}
