"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PopupIklanProps {
  onClose: () => void;
}

export default function PopupIklan({ onClose }: PopupIklanProps) {
  const [popupData, setPopupData] = useState<{
    popupAktif: boolean;
    popupTipe: 'gambar' | 'youtube';
    popupJudul: string;
    popupIsi: string;
    popupFoto: string;
    popupYoutubeUrl: string;
    popupYoutubeStartTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopupData();
  }, []);

  const fetchPopupData = async () => {
    try {
      const docRef = doc(db, 'pengaturan', 'home');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setPopupData({
          popupAktif: data.popupAktif || false,
          popupTipe: data.popupTipe || 'gambar',
          popupJudul: data.popupJudul || '',
          popupIsi: data.popupIsi || '',
          popupFoto: data.popupFoto || '',
          popupYoutubeUrl: data.popupYoutubeUrl || '',
          popupYoutubeStartTime: data.popupYoutubeStartTime || 0,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching popup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (url: string, startTime: number = 0): string => {
    const videoId = extractYoutubeId(url);
    if (!videoId) return '';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startTime}`;
  };

  const extractYoutubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  };

  // Don't show popup if loading or not active
  if (loading || !popupData || !popupData.popupAktif) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
          aria-label="Close popup"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Popup Content */}
        <div className="p-6">
          {/* Judul */}
          {popupData.popupJudul && (
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pr-8">
              {popupData.popupJudul}
            </h2>
          )}

          {/* Gambar atau YouTube */}
          {popupData.popupTipe === 'gambar' && popupData.popupFoto && (
            <div className="relative w-full h-64 md:h-96 mb-4 rounded-lg overflow-hidden">
              <Image
                src={popupData.popupFoto}
                alt={popupData.popupJudul || 'Popup Iklan'}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          {popupData.popupTipe === 'youtube' && popupData.popupYoutubeUrl && (
            <div className="relative w-full h-64 md:h-96 mb-4 rounded-lg overflow-hidden">
              <iframe
                src={getYoutubeEmbedUrl(popupData.popupYoutubeUrl, popupData.popupYoutubeStartTime)}
                title={popupData.popupJudul || 'YouTube Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Isi */}
          {popupData.popupIsi && (
            <div className="prose prose-sm max-w-none text-gray-700 mb-4">
              <p className="whitespace-pre-wrap">{popupData.popupIsi}</p>
            </div>
          )}

          {/* Close Button (Alternative) */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-800 transition-all shadow-lg hover:shadow-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
