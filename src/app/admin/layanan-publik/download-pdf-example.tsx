"use client";

/**
 * PDF Generation Implementation for Layanan Publik
 * Integrated with real data from Firestore
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import generateSuratPDF from '../../utils/generateSuratPDF';
import SuratTemplate from '../../../components/SuratTemplate';
import { getLayananById, LayananPublik } from "../../../lib/layananPublikService";
import JSZip from 'jszip';

interface SuratData {
  jenisLayanan: string;
  nomorSurat: string;
  namaLengkap: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  pekerjaan: string;
  alamat: string;
  daerah: string;
  keperluan: string;
  tanggalSurat: string;
  [key: string]: any;
}

function DownloadPDFPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const layananId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentSurat, setCurrentSurat] = useState<SuratData | null>(null);
  const [layanan, setLayanan] = useState<LayananPublik | null>(null);
  const [nomorSurat, setNomorSurat] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }

    if (!layananId) {
      alert('❌ ID Layanan tidak ditemukan');
      router.back();
      return;
    }

    const fetchData = async () => {
      try {
        const layananData = await getLayananById(layananId);
        setLayanan(layananData);
        
        // Set nomor surat dari sessionStorage atau default
        const savedNomorSurat = sessionStorage.getItem('nomorSurat');
        if (savedNomorSurat) {
          setNomorSurat(savedNomorSurat);
          sessionStorage.removeItem('nomorSurat');
        }
        
      } catch (error) {
        console.error('Error fetching layanan:', error);
        alert('❌ Gagal memuat data layanan');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [layananId, user, router]);

  const handleDownloadPDF = async () => {
    if (!nomorSurat || nomorSurat.trim() === '') {
      alert('⚠️ Mohon isi Nomor Surat terlebih dahulu!');
      return;
    }

    if (!layanan) {
      alert('❌ Data layanan tidak tersedia');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      console.log('🚀 Starting PDF generation...');
      
      // Prepare data surat dari layanan
      const dataSurat: SuratData = {
        jenisLayanan: layanan.jenisLayanan || '',
        nomorSurat: nomorSurat,
        namaLengkap: layanan.namaLengkap || '',
        nik: layanan.nik || '',
        tempatLahir: layanan.tempatLahir || '',
        tanggalLahir: layanan.tanggalLahir || '',
        jenisKelamin: layanan.jenisKelamin || '',
        agama: layanan.agama || '',
        pekerjaan: layanan.pekerjaan || '',
        alamat: layanan.alamat || '',
        daerah: layanan.daerah || '',
        keperluan: layanan.keperluan || layanan.jenisLayanan || '',
        tanggalSurat: typeof layanan.createdAt === 'string' 
          ? layanan.createdAt 
          : layanan.createdAt?.toDate?.() 
            ? layanan.createdAt.toDate().toISOString() 
            : new Date().toISOString(),
      };
      
      // Set current surat untuk render di hidden element
      setCurrentSurat(dataSurat);
      
      // Wait untuk React render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Generate PDF
      const pdfBlob = await generateSuratPDF(dataSurat, nomorSurat);
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Surat-${nomorSurat.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully!');
      alert('✅ PDF berhasil didownload!');
      
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Gagal download PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
      setCurrentSurat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!layanan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ Data layanan tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mb-4"
        >
          ← Kembali
        </button>
        
        <h1 className="text-2xl font-bold mb-2">Download PDF Surat</h1>
        <p className="text-gray-600">
          {layanan.jenisLayanan} - {layanan.namaLengkap}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-bold mb-4">Informasi Pemohon</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">NIK:</span>
            <p className="font-semibold">{layanan.nik}</p>
          </div>
          <div>
            <span className="text-gray-600">Nama:</span>
            <p className="font-semibold">{layanan.namaLengkap}</p>
          </div>
          <div>
            <span className="text-gray-600">Jenis Layanan:</span>
            <p className="font-semibold">{layanan.jenisLayanan}</p>
          </div>
          <div>
            <span className="text-gray-600">Daerah:</span>
            <p className="font-semibold">{layanan.daerah?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block mb-2 font-bold">
          Nomor Surat <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={nomorSurat}
          onChange={(e) => setNomorSurat(e.target.value)}
          placeholder="Contoh: 474.3/44123/DPKJ/XII/2025"
          className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-2">
          Masukkan nomor surat sesuai format yang berlaku
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF || !nomorSurat.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isGeneratingPDF ? '⏳ Generating PDF...' : '📄 Download PDF'}
        </button>
      </div>

      {/* Hidden Print Area - CRITICAL! */}
      <div
        id="print-area"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {currentSurat && <SuratTemplate data={currentSurat} />}
      </div>
    </div>
  );
}

export default function DownloadPDFPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DownloadPDFPageContent />
    </Suspense>
  );
}
