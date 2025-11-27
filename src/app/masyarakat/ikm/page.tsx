'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../components/BottomNavigation';
import HeaderCard from '../../components/HeaderCard';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db as firestore } from '../../../lib/firebase';

const JENIS_LAYANAN = [
  "Administrasi Kependudukan",
  "Surat Keterangan",
  "Pelayanan Kesehatan",
  "Pelayanan Pendidikan",
  "Perizinan",
  "Layanan Umum",
  "Lainnya"
];

const PERTANYAAN_IKM = [
  "Bagaimana persyaratan pelayanan?",
  "Bagaimana prosedur pelayanan?",
  "Bagaimana waktu pelayanan?",
  "Bagaimana biaya/tarif pelayanan?",
  "Bagaimana kualitas hasil pelayanan?",
  "Bagaimana kompetensi petugas?",
  "Bagaimana perilaku petugas?",
  "Bagaimana fasilitas pelayanan?",
  "Bagaimana penanganan pengaduan?"
];

export default function IKMPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [jenisLayanan, setJenisLayanan] = useState('');
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [komentar, setKomentar] = useState('');

  const JENIS_LAYANAN = useMemo(() => [
    "Administrasi Kependudukan",
    "Surat Keterangan",
    "Pelayanan Kesehatan",
    "Pelayanan Pendidikan",
    "Perizinan",
    "Layanan Umum",
    "Lainnya"
  ], []);

  const PERTANYAAN_IKM = useMemo(() => [
    "Bagaimana persyaratan pelayanan?",
    "Bagaimana prosedur pelayanan?",
    "Bagaimana waktu pelayanan?",
    "Bagaimana biaya/tarif pelayanan?",
    "Bagaimana kualitas hasil pelayanan?",
    "Bagaimana kompetensi petugas?",
    "Bagaimana perilaku petugas?",
    "Bagaimana fasilitas pelayanan?",
    "Bagaimana penanganan pengaduan?"
  ], []);

  // Remove individual auth check since layout handles it
  // useEffect(() => {
  //   if (!user) {
  //     router.push('/masyarakat/login');
  //   }
  // }, [user, router]);

  const handleRating = (pertanyaan: string, nilai: number) => {
    setRatings(prev => ({
      ...prev,
      [pertanyaan]: nilai
    }));
  };

  const calculateAverageRating = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  const handleSubmit = async () => {
    if (!jenisLayanan) {
      alert('Silakan pilih jenis layanan terlebih dahulu');
      return;
    }

    if (Object.keys(ratings).length < PERTANYAAN_IKM.length) {
      alert('Silakan jawab semua pertanyaan');
      return;
    }

    if (!user) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    try {
      setLoading(true);

      const ikmData = {
        namaPengisi: user.userName || user.email,
        nik: user.idNumber || '-',
        jenisLayanan: jenisLayanan,
        tanggalPengisian: Timestamp.now(),
        rating: calculateAverageRating(),
        komentar: komentar,
        pertanyaan: ratings,
        userId: user.uid,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(firestore, 'ikm-survey'), ikmData);

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setStep(1);
        setJenisLayanan('');
        setRatings({});
        setKomentar('');
      }, 3000);

    } catch (error) {
      console.error('Error saving IKM:', error);
      alert('Gagal menyimpan data IKM. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-white to-blue-50">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-32 pt-3 sm:pt-4">
        <HeaderCard 
          title="Indeks Kepuasan Masyarakat" 
          subtitle="Survei IKM Desa Peguyangan"
          backUrl="/masyarakat/home"
          showBackButton={true}
        />
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-red-500' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 px-2">
            <span>Layanan</span>
            <span>Penilaian</span>
            <span>Selesai</span>
          </div>
        </div>
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 shadow-xl ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Pilih Jenis Layanan</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">Layanan apa yang baru saja Anda gunakan?</p>
            <div className="space-y-3">
              {JENIS_LAYANAN.map((layanan) => (
                <button key={layanan} onClick={() => setJenisLayanan(layanan)} className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${jenisLayanan === layanan ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-300 text-gray-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${jenisLayanan === layanan ? 'border-red-500' : 'border-gray-300'}`}>
                      {jenisLayanan === layanan && <div className="w-3 h-3 rounded-full bg-red-500"></div>}
                    </div>
                    <span>{layanan}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => jenisLayanan && setStep(2)} disabled={!jenisLayanan} className="w-full mt-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">Lanjut ke Penilaian</button>
          </div>
        )}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 shadow-xl ring-1 ring-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Penilaian Layanan</h2>
            <p className="text-gray-600 text-sm mb-6 text-center">Berikan penilaian Anda untuk setiap aspek pelayanan</p>
            <div className="space-y-6 mb-6">
              {PERTANYAAN_IKM.map((pertanyaan, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">{index + 1}. {pertanyaan}</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((nilai) => (
                      <button key={nilai} onClick={() => handleRating(pertanyaan, nilai)} className={`w-12 h-12 rounded-full font-bold transition-all ${ratings[pertanyaan] === nilai ? 'bg-yellow-400 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-600 hover:bg-yellow-200'}`}>{nilai}</button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                    <span>Kurang</span>
                    <span>Sangat Baik</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Komentar/Saran (Opsional)</label>
              <textarea value={komentar} onChange={(e) => setKomentar(e.target.value)} rows={4} placeholder="Berikan kritik dan saran untuk perbaikan layanan..." className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all">Kembali</button>
              <button onClick={() => { if (Object.keys(ratings).length === PERTANYAAN_IKM.length) { setStep(3); } else { alert('Silakan jawab semua pertanyaan'); }}} disabled={Object.keys(ratings).length < PERTANYAAN_IKM.length} className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">Lihat Ringkasan</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 shadow-xl ring-1 ring-gray-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ringkasan Penilaian</h2>
            </div>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600 mb-1">Jenis Layanan</p><p className="font-semibold text-gray-900">{jenisLayanan}</p></div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600 mb-1">Nama Pengisi</p><p className="font-semibold text-gray-900">{user.userName || user.email}</p></div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600 mb-1">NIK</p><p className="font-semibold text-gray-900">{user.idNumber || '-'}</p></div>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300">
                <p className="text-sm text-gray-600 mb-2">Rating Rata-rata</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-8 h-8 ${i < calculateAverageRating() ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{calculateAverageRating()}/5</span>
                </div>
              </div>
              {komentar && (
                <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-600 mb-2">Komentar Anda</p><p className="text-gray-700 italic">&ldquo;{komentar}&rdquo;</p></div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all">Kembali</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Mengirim...</span></>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>Kirim Penilaian</span></>)}
              </button>
            </div>
          </div>
        )}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Terima Kasih!</h3>
              <p className="text-gray-600 mb-2">Penilaian Anda telah berhasil dikirim</p>
              <p className="text-sm text-gray-500">Masukan Anda sangat berharga untuk perbaikan layanan kami</p>
            </div>
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
