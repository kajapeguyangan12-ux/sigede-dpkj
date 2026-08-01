"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import BottomNavigation from '../../../components/BottomNavigation';
import HeaderCard from '../../../components/HeaderCard';
import { getServiceContent } from '@/lib/taringDukcapilService';
import type { ServiceContent } from '@/lib/taringDukcapilService';
import Link from "next/link";
import Image from "next/image";

const DesaLogo = "/logo/LOGO_DPKJ.png";
const BgdLogo = "/logo/Logo_BGD1.png";

function ChildIdIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      <rect x="6" y="16" width="12" height="2" rx="1"/>
    </svg>
  );
}

export default function KartuIdentitasAnakPage() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ServiceContent | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await getServiceContent('kartu-identitas-anak');
      setContent(data);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-pink-50 to-red-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-red-50 via-pink-50 to-red-50">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-32 pt-4">
        <HeaderCard title="Kartu Identitas Anak" backUrl="/masyarakat/layanan-publik/pelayanan-taring-dukcapil" showBackButton={true} />

        {/* Service Icon and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-3xl bg-gradient-to-br from-red-100 via-pink-100 to-red-200 shadow-xl ring-2 ring-red-300">
            <ChildIdIcon className="h-12 w-12 sm:h-14 sm:w-14 text-red-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Kartu Identitas Anak</h2>
          <p className="text-sm text-gray-600">Informasi persyaratan dan dokumen yang didapatkan</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Syarat Permohonan Section */}
          {content?.syaratPermohonan && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Syarat Permohonan</h3>
              </div>
              
              <div 
                className="prose prose-sm sm:prose-base max-w-none text-gray-900 prose-headings:text-gray-900 prose-p:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-900"
                dangerouslySetInnerHTML={{ __html: content.syaratPermohonan }}
              />
            </div>
          )}

          {/* Keterangan Tambahan Section */}
          {content?.keteranganTambahan && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Keterangan Tambahan</h3>
              </div>
              
              <div 
                className="prose prose-sm sm:prose-base max-w-none text-gray-900 prose-headings:text-gray-900 prose-p:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-900"
                dangerouslySetInnerHTML={{ __html: content.keteranganTambahan }}
              />
            </div>
          )}

          {/* Empty State */}
          {!content?.syaratPermohonan && !content?.keteranganTambahan && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Konten</h3>
              <p className="text-gray-500">Konten untuk layanan ini sedang dalam proses pembuatan</p>
            </div>
          )}

          {/* Back to Service List */}
          <div className="flex justify-center pt-4">
            <Link
              href="/masyarakat/layanan-publik/pelayanan-taring-dukcapil"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Layanan
            </Link>
          </div>

          {/* Logo Footer */}
          <div className="flex justify-center items-center gap-8 pt-8 pb-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <Image
                src={DesaLogo}
                alt="Logo Desa"
                fill
                className="object-contain"
              />
            </div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <Image
                src={BgdLogo}
                alt="Logo BGD"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation />
    </main>
  );
}
