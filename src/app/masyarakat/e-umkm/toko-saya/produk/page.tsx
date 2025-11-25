'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  namaProduk: string;
  hargaProduk: number;
  stok: number;
  kategori: string;
  deskripsiProduk: string;
  fotoProduk: string[];
  umkmName: string;
  rating: number;
  jumlahTerjual: number;
  status: string;
}

export default function ProdukPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const umkmId = searchParams.get('umkmId');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [umkmName, setUmkmName] = useState('');

  useEffect(() => {
    if (!umkmId) {
      alert('ID UMKM tidak ditemukan');
      router.push('/masyarakat/e-umkm/toko-saya');
      return;
    }
    fetchProducts();
  }, [umkmId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, 'produk-umkm'),
        where('umkmId', '==', umkmId)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedProducts.push({
          id: doc.id,
          ...data
        } as Product);
        
        if (!umkmName && data.umkmName) {
          setUmkmName(data.umkmName);
        }
      });
      
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'produk-umkm', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Produk berhasil dihapus');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Gagal menghapus produk');
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
            <Link href="/masyarakat/e-umkm/toko-saya">
              <button className="group flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex-shrink-0">
                <svg className="h-5 w-5 text-white transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>

            {/* Center - Title */}
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">Produk Saya</h1>
              <p className="text-red-100 text-xs sm:text-sm mt-1 drop-shadow">{umkmName || 'Sistem Informasi Desa'}</p>
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

      {/* Quick Add Button */}
      <div className="max-w-4xl mx-auto px-4 -mt-3 mb-6">
        <Link href={`/masyarakat/e-umkm/toko-saya/tambah-produk?umkmId=${umkmId}`}>
          <button className="w-full px-4 py-3 bg-white text-red-600 text-sm font-bold rounded-2xl hover:bg-red-50 transition-all shadow-lg border-2 border-red-100">
            + Tambah Produk Baru
          </button>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Belum Ada Produk</h3>
            <p className="text-gray-600 mb-6">Mulai tambahkan produk untuk toko Anda</p>
            <Link href={`/masyarakat/e-umkm/toko-saya/tambah-produk?umkmId=${umkmId}`}>
              <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-700 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                + Tambah Produk Pertama
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-red-100 to-pink-100">
                  {product.fotoProduk && product.fotoProduk[0] ? (
                    <img
                      src={product.fotoProduk[0]}
                      alt={product.namaProduk}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      product.stok > 10 ? 'bg-green-500' : product.stok > 0 ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white shadow-lg`}>
                      Stok: {product.stok}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{product.namaProduk}</h3>
                    <p className="text-sm text-gray-500">{product.kategori}</p>
                  </div>

                  <p className="text-2xl font-bold text-red-600 mb-4">
                    {formatRupiah(product.hargaProduk)}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{product.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>{product.jumlahTerjual || 0} Terjual</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/masyarakat/e-umkm/toko-saya/edit-produk?id=${product.id}&umkmId=${umkmId}`} className="flex-1">
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
