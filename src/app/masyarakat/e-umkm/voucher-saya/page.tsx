'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../../components/BottomNavigation';
import { ArrowLeft, Ticket, Eye, Trash2, Copy, Gift, Calendar } from 'lucide-react';

interface Voucher {
  id: string;
  name: string;
  code: string;
  description: string;
  image?: string;
  discount: string;
  expiryDate: string;
  minPurchase?: string;
  category: 'makanan' | 'fashion' | 'jasa' | 'umum';
}

export default function VoucherSayaPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Load vouchers from localStorage
    const savedVouchers = localStorage.getItem('myVouchers');
    if (savedVouchers) {
      setVouchers(JSON.parse(savedVouchers));
    }
  }, []);

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Kode voucher berhasil disalin!', 'success');
  };

  const deleteVoucher = (id: string) => {
    const updated = vouchers.filter(v => v.id !== id);
    setVouchers(updated);
    localStorage.setItem('myVouchers', JSON.stringify(updated));
    showToast('Voucher berhasil dihapus', 'error');
    setShowModal(false);
  };

  const viewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowModal(true);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'makanan': return 'from-orange-500 to-orange-600';
      case 'fashion': return 'from-purple-500 to-purple-600';
      case 'jasa': return 'from-blue-500 to-blue-600';
      default: return 'from-red-500 to-red-600';
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'makanan': return 'bg-orange-50 border-orange-200';
      case 'fashion': return 'bg-purple-50 border-purple-200';
      case 'jasa': return 'bg-blue-50 border-blue-200';
      default: return 'bg-red-50 border-red-200';
    }
  };
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {/* Header Card - Modern Design */}
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-2xl overflow-hidden">
          <div className="relative px-6 py-4">
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
                <Ticket className="w-5 h-5 text-white" />
                <h1 className="text-xl font-bold text-white">Voucher Saya</h1>
              </div>
              <div className="w-10"></div> {/* Spacer for alignment */}
            </div>
          </div>
        </div>

        {/* Vouchers List */}
        {vouchers.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
              <Gift className="w-16 h-16 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Voucher</h3>
            <p className="text-gray-500 mb-6">Dapatkan voucher menarik dari berbagai UMKM</p>
            <button
              onClick={() => router.push('/masyarakat/e-umkm')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Jelajahi UMKM
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Voucher Count */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">
                {vouchers.length} Voucher Tersedia
              </p>
            </div>

            {/* Voucher Cards */}
            {vouchers.map((voucher) => (
              <div 
                key={voucher.id}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${getCategoryBg(voucher.category)} group`}
              >
                {/* Voucher Perforated Edge Effect */}
                <div className="absolute top-0 bottom-0 left-1/3 w-8 flex flex-col justify-around items-center">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-slate-50"></div>
                  ))}
                </div>

                <div className="flex">
                  {/* Left Side - Discount */}
                  <div className={`w-1/3 bg-gradient-to-br ${getCategoryColor(voucher.category)} p-6 flex flex-col items-center justify-center relative`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="relative text-center">
                      <Ticket className="w-8 h-8 text-white mb-2 mx-auto" />
                      <p className="text-3xl font-bold text-white">{voucher.discount}</p>
                      <p className="text-xs text-white/90 mt-1">OFF</p>
                    </div>
                  </div>

                  {/* Right Side - Details */}
                  <div className="flex-1 p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {voucher.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {voucher.description}
                      </p>
                      
                      {/* Voucher Code */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 border-2 border-dashed border-gray-300">
                          <p className="text-sm font-mono font-bold text-gray-800 text-center">
                            {voucher.code}
                          </p>
                        </div>
                        <button
                          onClick={() => copyVoucherCode(voucher.code)}
                          className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all duration-300 active:scale-95"
                          title="Salin kode"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Expiry Date */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Berlaku hingga: {voucher.expiryDate}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => viewVoucher(voucher)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-all duration-300 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Lihat</span>
                      </button>
                      <button
                        onClick={() => deleteVoucher(voucher.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all duration-300 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Detail Voucher */}
        {showModal && selectedVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className={`relative bg-gradient-to-br ${getCategoryColor(selectedVoucher.category)} p-6 rounded-t-3xl`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="relative text-center">
                  <Ticket className="w-16 h-16 text-white mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedVoucher.name}</h2>
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                    <p className="text-3xl font-bold text-white">{selectedVoucher.discount} OFF</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Voucher Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kode Voucher</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 border-2 border-dashed border-gray-300">
                      <p className="text-lg font-mono font-bold text-gray-800 text-center">
                        {selectedVoucher.code}
                      </p>
                    </div>
                    <button
                      onClick={() => copyVoucherCode(selectedVoucher.code)}
                      className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-xl transition-all duration-300 active:scale-95"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">
                    {selectedVoucher.description}
                  </p>
                </div>

                {/* Min Purchase */}
                {selectedVoucher.minPurchase && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Minimal Pembelian</label>
                    <p className="text-gray-800 font-semibold bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                      {selectedVoucher.minPurchase}
                    </p>
                  </div>
                )}

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Berlaku Hingga</label>
                  <div className="flex items-center space-x-2 bg-red-50 rounded-xl p-4 border-2 border-red-200">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <p className="text-gray-800 font-semibold">{selectedVoucher.expiryDate}</p>
                  </div>
                </div>

                {/* Image */}
                {selectedVoucher.image && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gambar Voucher</label>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                      <img 
                        src={selectedVoucher.image} 
                        alt={selectedVoucher.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => copyVoucherCode(selectedVoucher.code)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  Salin Kode Voucher
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      <BottomNavigation />
    </main>
  );
}
