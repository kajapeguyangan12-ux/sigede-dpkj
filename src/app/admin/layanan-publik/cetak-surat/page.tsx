"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../../lib/logoutHelper';
import { getLayananById, LayananPublik } from "../../../../lib/layananPublikService";
import { getDataDesa } from "../../../../lib/dataDesaService";
import Image from 'next/image';

// Dynamically import html2canvas and jsPDF
let html2canvas: any = null;
let jsPDF: any = null;
if (typeof window !== 'undefined') {
  import('html2canvas').then((module) => {
    html2canvas = module.default;
  });
  import('jspdf').then((module) => {
    jsPDF = module.default;
  });
}

function CetakSuratContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const layananId = searchParams.get('id');
  const [layanan, setLayanan] = useState<LayananPublik | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [nomorSurat, setNomorSurat] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [autoClose, setAutoClose] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load nomor surat dan flag auto-download dari sessionStorage pada mount
    const savedNomorSurat = sessionStorage.getItem('nomorSurat');
    const shouldAutoDownloadAndClose = sessionStorage.getItem('autoDownloadAndClose');
    
    if (savedNomorSurat) {
      setNomorSurat(savedNomorSurat);
      sessionStorage.removeItem('nomorSurat');
    }
    
    if (shouldAutoDownloadAndClose === 'true') {
      setAutoDownload(true);
      setAutoClose(true);
      sessionStorage.removeItem('autoDownloadAndClose');
    }
  }, []);

  useEffect(() => {
    if (!layananId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Tambahkan timeout untuk fetch data (10 detik)
        const fetchWithTimeout = async () => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), 10000)
          );
          
          const dataPromise = Promise.all([
            getLayananById(layananId),
            getDataDesa()
          ]);
          
          return await Promise.race([dataPromise, timeoutPromise]) as [LayananPublik, any[]];
        };
        
        const [layananData, allDataDesa] = await fetchWithTimeout();
        
        setLayanan(layananData);

        // Cari user data dari data-desa berdasarkan NIK (optional, bisa skip jika tidak ada)
        if (layananData?.nik) {
          const user = allDataDesa.find(d => d.nik === layananData.nik);
          if (user) {
            setUserData(user);
          }
        }
        
        // Auto-scroll to preview setelah data dimuat
        setTimeout(() => {
          const previewElement = document.getElementById('preview-surat');
          if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.message?.includes('timeout')) {
          alert('⏱️ Koneksi lambat. Gagal memuat data surat. Silakan refresh dan coba lagi.');
        } else {
          alert('❌ Gagal memuat data surat. Silakan coba lagi.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [layananId]);

  const handlePrint = () => {
    if (!nomorSurat || nomorSurat.trim() === '') {
      alert('⚠️ Mohon isi Nomor Surat terlebih dahulu sebelum mencetak!');
      document.getElementById('nomor-surat-input')?.focus();
      return;
    }
    
    // Sanitize nomor surat untuk filename (replace / dan karakter tidak valid)
    const sanitizedNomor = nomorSurat.replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `Surat-${sanitizedNomor}-${layanan?.namaLengkap.replace(/\s+/g, '-')}`;
    const originalTitle = document.title;
    document.title = fileName;
    
    window.print();
    
    // Restore original title after print
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (!nomorSurat || nomorSurat.trim() === '') {
      alert('⚠️ Mohon isi Nomor Surat terlebih dahulu sebelum menyimpan PDF!');
      document.getElementById('nomor-surat-input')?.focus();
      return;
    }
    
    setIsGeneratingPDF(true);
    
    try {
      // Validasi html2canvas dan jsPDF sudah loaded
      if (!html2canvas || !jsPDF) {
        // Load dynamically jika belum
        if (!html2canvas) {
          const canvasModule = await import('html2canvas');
          html2canvas = canvasModule.default;
        }
        if (!jsPDF) {
          const pdfModule = await import('jspdf');
          jsPDF = pdfModule.default;
        }
      }
      
      // Pastikan element ada dan ready
      const generatePDFWithTimeout = async () => {
        let attempts = 0;
        while (attempts < 10) {
          if (printRef.current) {
            return printRef.current;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        throw new Error('Element not found');
      };
      
      const element = await Promise.race([
        generatePDFWithTimeout(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Setup timeout')), 3000) // Reduced dari 5000ms
        )
      ]) as HTMLElement;
      
      console.log('🎨 Starting FAST PDF generation...');
      const startTime = Date.now();
      
      // ============================================
      // STEP 1: CLONE & CLEAN ELEMENT
      // ============================================
      console.log('🔧 Cloning and cleaning element...');
      const cleanElement = element.cloneNode(true) as HTMLElement;
      
      // Clean parent
      cleanElement.style.opacity = '1';
      cleanElement.style.filter = 'none';
      cleanElement.style.webkitFilter = 'none';
      cleanElement.style.backdropFilter = 'none';
      cleanElement.style.backgroundColor = '#FFFFFF';
      cleanElement.style.color = '#000000';
      
      // Clean all children
      const allElements = cleanElement.querySelectorAll('*');
      let cleanedCount = 0;
      
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const tagName = htmlEl.tagName.toLowerCase();
        
        // Skip images
        if (tagName === 'img') return;
        
        // Remove efek pucat
        htmlEl.style.opacity = '1';
        htmlEl.style.filter = 'none';
        htmlEl.style.webkitFilter = 'none';
        htmlEl.style.backdropFilter = 'none';
        htmlEl.style.boxShadow = 'none';
        htmlEl.style.textShadow = 'none';
        
        // Force text hitam
        if (['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'li'].includes(tagName)) {
          htmlEl.style.color = '#000000';
          htmlEl.style.setProperty('-webkit-text-fill-color', '#000000');
          cleanedCount++;
        }
      });
      
      console.log(`✅ Cleaned ${cleanedCount} text elements`);
      
      // Append clone temporarily
      cleanElement.style.position = 'absolute';
      cleanElement.style.left = '-9999px';
      cleanElement.style.top = '0';
      cleanElement.style.width = '794px';
      cleanElement.style.height = 'auto';
      document.body.appendChild(cleanElement);
      
      // Wait untuk fonts & images load (reduced timeout)
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced dari 500ms
      
      // Sanitize nomor surat untuk filename
      const sanitizedNomor = nomorSurat.replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `Surat-${sanitizedNomor}-${layanan?.namaLengkap.replace(/\s+/g, '-')}.pdf`;
      
      // ============================================
      // STEP 2: RENDER DENGAN html2canvas
      // ============================================
      console.log('📸 Capturing with html2canvas (scale 2 - FAST)...');
      
      const canvas = await html2canvas(cleanElement, {
        scale: 2,                    // Reduced untuk speed (tetap tajam)
        useCORS: true,               
        allowTaint: true,            
        backgroundColor: '#FFFFFF',  
        logging: false,              
        imageTimeout: 10000,         
        removeContainer: true,       
        width: 794,                  // A4 at 96 DPI
        height: 1123,                
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc: Document) => {
          // Quick style fix
          const all = clonedDoc.body.querySelectorAll('*');
          all.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.tagName.toLowerCase() !== 'img') {
              htmlEl.style.opacity = '1';
              htmlEl.style.filter = 'none';
              htmlEl.style.color = '#000000';
            }
          });
        }
      });
      
      // Remove temporary clone
      document.body.removeChild(cleanElement);
      
      console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}px`);
      
      // ============================================
      // STEP 3: QUICK ENHANCE (Simplified for speed)
      // ============================================
      console.log('🎨 Quick contrast fix...');
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let enhanced = 0;
        
        // Simplified: hanya enhance pixel yang hampir hitam
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          
          if (alpha < 10) continue;
          
          // Near-black pixels (text) → pure black
          const isNearBlack = r < 120 && g < 120 && b < 120;
          const isGrayish = Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
          
          if (isNearBlack && isGrayish) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
            enhanced++;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        console.log(`✅ Quick enhanced ${enhanced.toLocaleString()} pixels`);
      }
      
      // ============================================
      // STEP 4: CONVERT TO PDF (OPTIMIZED)
      // ============================================
      console.log('📄 Converting to JPEG (faster, smaller)...');
      const imgData = canvas.toDataURL('image/jpeg', 0.98); // JPEG quality 98%
      
      console.log('📄 Creating PDF...');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true  // Enable compression untuk file lebih kecil
      });
      
      console.log('📄 Adding image to PDF...');
      pdf.addImage(
        imgData,
        'JPEG',
        0,
        0,
        210,  // A4 width
        297,  // A4 height
        undefined,
        'NONE'  // NO compression
      );
      
      console.log('💾 Saving PDF:', fileName);
      pdf.save(fileName);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ PDF completed in ${elapsed}ms - ${fileName}`);
      console.log('📊 Optimized: Scale 2, JPEG 98%, A4 (210x297mm), compressed');
      
      // Auto-close window jika flag autoClose = true (tanpa alert)
      if (autoClose) {
        setPdfGenerated(true);
        setTimeout(() => {
          window.close();
        }, 400); // Reduced dari 500ms
      } else {
        // Tampilkan notifikasi sukses hanya jika bukan auto-close
        setTimeout(() => {
          alert('✅ PDF berhasil disimpan dengan nama: ' + fileName);
        }, 400);
      }
      
    } catch (error: any) {
      console.error('❌ PDF Error:', error);
      
      // Better error messages
      if (error.message?.includes('timeout')) {
        alert('⏱️ Koneksi lambat terdeteksi. Coba lagi atau gunakan tombol "Print Surat".');
      } else if (error.message?.includes('Element not found')) {
        alert('❌ Gagal mengambil konten surat. Refresh halaman dan coba lagi.');
      } else {
        alert('❌ Gagal membuat PDF. Gunakan tombol "Print Surat" sebagai alternatif.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Auto-load nomor surat dari sessionStorage dan auto-download
  useEffect(() => {
    if (!layanan || loading || !autoDownload || !nomorSurat) return;
    
    // Auto-trigger download setelah data loaded dan nomor surat tersedia
    const timer = setTimeout(() => {
      handleDownloadPDF();
      setAutoDownload(false); // Prevent multiple auto-downloads
    }, 1000); // Increase delay untuk memastikan DOM ready dengan printRef
    
    return () => clearTimeout(timer);
  }, [layanan, loading, autoDownload, nomorSurat]);

  // Jika auto-close mode dan PDF sudah generated, tampilkan blank page
  if (autoClose && pdfGenerated) {
    return (
      <div className="min-h-screen bg-white"></div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date;
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        // Handle different string formats
        // Check if format is DD-MM-YYYY or DD/MM/YYYY
        if (timestamp.includes('-') || timestamp.includes('/')) {
          const parts = timestamp.split(/[-/]/);
          if (parts.length === 3) {
            // Assume DD-MM-YYYY or DD/MM/YYYY
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // Month is 0-indexed
            const year = parseInt(parts[2]);
            date = new Date(year, month, day);
          } else {
            date = new Date(timestamp);
          }
        } else {
          date = new Date(timestamp);
        }
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return '';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getTanggalSurat = () => {
    // Use createdAt from layanan data
    if (layanan?.createdAt) {
      return formatDate(layanan.createdAt);
    }
    const today = new Date();
    return formatDate(today);
  };

  const getJudulSurat = (jenisLayanan: string) => {
    const judulMap: { [key: string]: string } = {
      "Surat Kelakuan Baik": "SURAT KETERANGAN KELAKUAN BAIK",
      "Surat Keterangan Belum Nikah/Kawin": "SURAT KETERANGAN BELUM PERNAH KAWIN/MENIKAH",
      "Surat Keterangan Belum Bekerja": "SURAT KETERANGAN BELUM BEKERJA",
      "Surat Keterangan Kawin/Menikah": "SURAT KETERANGAN KAWIN/MENIKAH",
      "Surat Keterangan Kematian": "SURAT KETERANGAN KEMATIAN",
      "Surat Keterangan Perjalanan": "SURAT KETERANGAN PERJALANAN"
    };
    return judulMap[jenisLayanan] || "SURAT KETERANGAN";
  };

  const getIsiSurat = (jenisLayanan: string, keperluan?: string, tanggalPermohonan?: string, daerah?: string, nomorSuratKadus?: string) => {
    const keperluanText = keperluan || '..........................................................................';
    const tanggalText = tanggalPermohonan || '.......';
    // Format daerah: replace underscore dengan spasi, contoh: Wangaya_Kaja -> Wangaya Kaja
    const daerahText = daerah ? daerah.replace(/_/g, ' ') : '............';
    const nomorKadusText = nomorSuratKadus || '.............................';
    
    const isiMap: { [key: string]: { paragraf1: string, paragraf2: string, paragraf3: string } } = {
      "Surat Kelakuan Baik": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berkelakuan baik, tidak pernah tersangkut dalam tindakan kriminal/kejahatan.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Belum Nikah/Kawin": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas belum pernah kawin/menikah sampai saat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Belum Bekerja": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas belum bekerja dan tidak terikat kontrak kerja dengan instansi/perusahaan manapun sampai saat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Kawin/Menikah": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas telah melangsungkan perkawinan dan berstatus sebagai suami/istri yang sah.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Kematian": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Telah meninggal dunia pada tanggal .............. di .............. karena ..............",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Perjalanan": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ${nomorKadusText}, Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan akan melakukan perjalanan ke .............. untuk keperluan ..............",
        paragraf3: "Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya."
      }
    };
    return isiMap[jenisLayanan] || isiMap["Surat Kelakuan Baik"];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-bold text-gray-800 mb-2">
            {isGeneratingPDF ? '📄 Membuat PDF...' : 'Memuat Surat...'}
          </p>
          <p className="text-sm text-gray-600">
            {isGeneratingPDF ? 'Kualitas tinggi, mohon tunggu' : 'Mohon tunggu sebentar'}
          </p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!layanan || layanan.jenisLayanan === "Pelayanan Taring Dukcapil") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">
            {!layanan ? "Data tidak ditemukan" : "Jenis layanan ini tidak memiliki template surat"}
          </h2>
          <button onClick={() => router.push('/admin/layanan-publik')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Kembali ke Layanan Publik
          </button>
        </div>
      </div>
    );
  }

  const tanggalPermohonan = layanan.createdAt ? formatDate(layanan.createdAt) : '';
  const daerahPemohon = userData?.daerah || layanan.daerah || '';
  const isiSurat = getIsiSurat(layanan.jenisLayanan, layanan.keperluan, tanggalPermohonan, daerahPemohon, layanan.nomorSuratKadus);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0;
            box-shadow: none !important;
            color: #000000 !important;
          }
          .print-container * {
            color: #000000 !important;
          }
          .print-container p,
          .print-container h1,
          .print-container h2,
          .print-container h3,
          .print-container span,
          .print-container div {
            color: #000000 !important;
          }
        }
        
        @media screen {
          html {
            scroll-behavior: smooth;
          }
          
          .print-container {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.15);
            color: #000000;
            animation: fadeInUp 0.5s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 768px) {
            .print-container {
              padding: 10mm;
              font-size: 12px;
            }
            
            .print-container .text-lg {
              font-size: 14px;
            }
            
            .print-container .text-base {
              font-size: 13px;
            }
            
            .print-container .text-sm {
              font-size: 11px;
            }
          }
        }
      `}</style>

      <div className={`min-h-screen ${autoClose && !pdfGenerated ? 'opacity-0 pointer-events-none' : 'bg-gradient-to-br from-gray-50 to-gray-100'} py-2 sm:py-4 md:py-8`}>
        {/* Print Button - Prominent Header - Responsive */}
        <div className="no-print max-w-4xl mx-auto mb-3 sm:mb-4 md:mb-6 bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 sticky top-0 z-50 border-b-4 border-blue-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                📄 Cetak Surat
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Surat siap dicetak atau disimpan sebagai PDF</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base md:text-lg flex items-center justify-center gap-2"
              >
                🖨️ Print Surat
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className={`w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 ${isGeneratingPDF ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse">Generating PDF...</span>
                  </>
                ) : (
                  <>💾 Save PDF</>
                )}
              </button>
              <button
                onClick={() => window.close()}
                className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 bg-gray-600 text-white rounded-lg sm:rounded-xl hover:bg-gray-700 font-bold shadow-lg transition-all text-sm sm:text-base"
              >
                ✕ Tutup
              </button>
            </div>
          </div>
          
          {/* Input Nomor Surat - Prominent */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
            <label className="block text-gray-800 font-bold text-sm sm:text-base mb-2 flex items-center gap-2">
              <span className="text-xl">🔢</span>
              <span>Nomor Surat (WAJIB ISI!):</span>
            </label>
            <input
              id="nomor-surat-input"
              type="text"
              placeholder="Contoh: 474.3/12345/DPKJ/2025"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-orange-400 rounded-lg focus:border-orange-600 focus:ring-2 focus:ring-orange-200 focus:outline-none text-gray-900 placeholder-gray-400 font-medium text-sm sm:text-base"
              autoFocus
            />
            <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
              <span>⚠️</span>
              <span>Pastikan nomor surat sudah diisi sebelum mencetak/menyimpan PDF</span>
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>💡 Tips:</strong> 
              <span className="ml-1 sm:ml-2">Isi nomor surat terlebih dahulu, lalu klik <strong>"Print Surat"</strong> untuk mencetak atau <strong>"Save PDF"</strong> untuk menyimpan.</span>
            </p>
          </div>
        </div>

        {/* Preview Label */}
        <div id="preview-surat" className="no-print max-w-4xl mx-auto mb-2 px-3 sm:px-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-t-lg font-bold text-sm sm:text-base flex items-center gap-2 shadow-md">
            <span>👁️</span>
            <span>Preview Surat</span>
          </div>
        </div>

        {/* Letter Content */}
        <div ref={printRef} className="print-container" style={{ 
          backgroundColor: '#FFFFFF',
          width: '210mm',
          height: '297mm',
          padding: '20mm 20mm 20mm 20mm',
          margin: '0 auto',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Header dengan Logo dan Text */}
          <div className="mb-6 pb-4 border-b-2 border-black" style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
            <div style={{ flexShrink: 0, width: '100px', height: '100px', position: 'relative' }}>
              <Image 
                src="/logo/LOGO_DPKJ.png" 
                alt="Logo" 
                fill 
                className="object-contain" 
                priority
                quality={100}
                loading="eager"
                unoptimized={true}
              />
            </div>
            <div style={{ flex: 1, textAlign: 'center', paddingTop: '5px' }}>
              <p style={{ 
                fontSize: '11px', 
                fontWeight: '400', 
                color: '#000000', 
                margin: '0',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.3'
              }}>
                ຂ້າພະເຈົ້າອິທິພົນຄວາມເປັນໄປໄດ້ອັນໃດໜຶ່ງ
              </p>
              <h1 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#000000', 
                margin: '2px 0',
                fontFamily: 'Times New Roman, serif',
                letterSpacing: '0.5px'
              }}>
                PEMERINTAH KOTA DENPASAR
              </h1>
              <p style={{ 
                fontSize: '11px', 
                fontWeight: '400', 
                color: '#000000', 
                margin: '0',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.3'
              }}>
                ພາສາອັກສອນບາລີໝັກປະຈຳ
              </p>
              <h2 style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: '#000000', 
                margin: '2px 0',
                fontFamily: 'Times New Roman, serif',
                letterSpacing: '0.3px'
              }}>
                KECAMATAN DENPASAR UTARA
              </h2>
              <p style={{ 
                fontSize: '11px', 
                fontWeight: '400', 
                color: '#000000', 
                margin: '0',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.3'
              }}>
                ນະຄອນປາດາຕາຄາ
              </p>
              <h2 style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: '#000000', 
                margin: '2px 0 4px 0',
                fontFamily: 'Times New Roman, serif',
                letterSpacing: '0.3px'
              }}>
                DESA DAUH PURI KAJA
              </h2>
              <p style={{ 
                fontSize: '9px', 
                color: '#000000', 
                margin: '4px 0 0 0',
                fontFamily: 'Times New Roman, serif',
                lineHeight: '1.4'
              }}>
                <span style={{ fontStyle: 'italic' }}>Alamat: Jalan Gatot Subroto VI J No. 14 DENPASAR Telpon (0361) 419973 kode Pos 80111</span>
              </p>
              <p style={{ 
                fontSize: '9px', 
                fontStyle: 'italic', 
                color: '#000000', 
                margin: '2px 0 0 0',
                fontFamily: 'Times New Roman, serif'
              }}>
                website: <span style={{ textDecoration: 'underline' }}>http://dauhpurikaja.denpasarkota.go.id</span> Email: <span style={{ textDecoration: 'underline' }}>desa_dauhpurikdja@yahoo.com</span>
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="font-bold text-base underline text-black" style={{color: '#000000'}}>{getJudulSurat(layanan.jenisLayanan)}</h3>
            <p className="text-sm mt-1 text-black" style={{color: '#000000'}}>
              Nomor : <span className={nomorSurat ? 'font-bold text-black' : 'text-gray-400'} style={{color: '#000000'}}>{nomorSurat || '..............................................'}</span>
            </p>
          </div>

          {/* Body */}
          <div className="text-sm leading-relaxed space-y-4 text-black" style={{color: '#000000'}}>
            <p className="text-justify indent-12 text-black" style={{color: '#000000'}}>
              {isiSurat.paragraf1}
            </p>

            {/* Data Pemohon */}
            <div className="ml-12 space-y-1 text-black" style={{color: '#000000'}}>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Nama</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.namaLengkap || layanan.namaLengkap}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Tempat/tanggal lahir</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>
                  {(() => {
                    const tempatLahir = userData?.tempatLahir || layanan.tempatLahir || '.......';
                    const tanggalLahir = userData?.tanggalLahir || layanan.tanggalLahir;
                    const formattedTanggal = tanggalLahir ? formatDate(tanggalLahir) : '.......';
                    return `${tempatLahir} / ${formattedTanggal}`;
                  })()}
                </span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Kewarganegaraan</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.kewarganegaraan || layanan.kewarganegaraan || 'Indonesia'}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Agama</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.agama || layanan.agama || '.......'}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Pekerjaan</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.pekerjaan || layanan.pekerjaan || '.......'}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>NIK</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.nik || layanan.nik}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>No. KK</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.noKK || layanan.noKK}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Alamat</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{userData?.alamat || layanan.alamat}</span>
              </div>
              <div className="flex text-black" style={{color: '#000000'}}>
                <span className="w-48 text-black" style={{color: '#000000'}}>Daerah/Banjar</span>
                <span className="mr-2 text-black" style={{color: '#000000'}}>:</span>
                <span className="font-semibold text-black" style={{color: '#000000'}}>{(userData?.daerah || layanan.daerah || '.......').replace(/_/g, ' ')}</span>
              </div>
            </div>

            <p className="text-justify indent-12 text-black" style={{color: '#000000'}}>
              {isiSurat.paragraf2}
            </p>

            <p className="text-justify indent-12 text-black" style={{color: '#000000'}}>
              {isiSurat.paragraf3}
            </p>
          </div>

          {/* Signature */}
          <div className="mt-12 flex justify-end">
            <div className="text-center text-black" style={{ minWidth: '200px', color: '#000000' }}>
              <p className="text-sm mb-1 text-black" style={{color: '#000000'}}>Denpasar, {getTanggalSurat()}</p>
              <p className="text-sm font-semibold mb-16 text-black" style={{color: '#000000'}}>Perbekel Desa Dauh Puri Kaja</p>
              <p className="text-sm font-bold underline text-black" style={{color: '#000000'}}>I Gusti Ketut Sucipta, ST.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Generation Overlay - dengan progress */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">📄 Membuat PDF...</h3>
            <p className="text-sm text-gray-600 mb-4">Optimasi kualitas tinggi, mohon tunggu</p>
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <p className="text-xs text-gray-500">Jangan tutup halaman ini</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function CetakSuratPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-700 font-semibold">Memuat surat...</p>
        </div>
      </div>
    }>
      <CetakSuratContent />
    </Suspense>
  );
}
