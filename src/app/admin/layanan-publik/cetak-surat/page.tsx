"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../../lib/logoutHelper';
import { getLayananById, LayananPublik } from "../../../../lib/layananPublikService";
import { getDataDesa } from "../../../../lib/dataDesaService";
import Image from 'next/image';

// Dynamically import html2pdf
let html2pdf: any = null;
if (typeof window !== 'undefined') {
  import('html2pdf.js').then((module) => {
    html2pdf = module.default;
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
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layananId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Parallel fetch untuk performa lebih cepat
        const [layananData, allDataDesa] = await Promise.all([
          getLayananById(layananId),
          getDataDesa()
        ]);
        
        setLayanan(layananData);

        // Cari user data dari data-desa berdasarkan NIK
        if (layananData?.nik) {
          const user = allDataDesa.find(d => d.nik === layananData.nik);
          setUserData(user);
        }
        
        // Auto-scroll to preview setelah data dimuat
        setTimeout(() => {
          const previewElement = document.getElementById('preview-surat');
          if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert('❌ Gagal memuat data surat. Silakan coba lagi.');
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
      // Pastikan html2pdf sudah dimuat
      if (!html2pdf) {
        const module = await import('html2pdf.js');
        html2pdf = module.default;
      }
      
      const element = printRef.current;
      
      if (!element) {
        alert('❌ Gagal mengambil konten surat');
        setIsGeneratingPDF(false);
        return;
      }
      
      // Sanitize nomor surat untuk filename (replace / dan karakter tidak valid)
      const sanitizedNomor = nomorSurat.replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `Surat-${sanitizedNomor}-${layanan?.namaLengkap.replace(/\s+/g, '-')}.pdf`;
      
      // Konfigurasi html2pdf
      const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      // Generate PDF dan auto download
      await html2pdf().set(opt).from(element).save();
      
      // Tampilkan notifikasi sukses
      setTimeout(() => {
        alert('✅ PDF berhasil disimpan dengan nama: ' + fileName);
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Gagal membuat PDF. Silakan gunakan Print Surat dan pilih "Save as PDF" di browser.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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
          <p className="text-lg font-bold text-gray-800 mb-2">Memuat Surat...</p>
          <p className="text-sm text-gray-600">Mohon tunggu sebentar</p>
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-2 sm:py-4 md:py-8">
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
                    Membuat PDF...
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
        <div ref={printRef} className="print-container">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-black">
            <div className="w-24 h-24 relative flex-shrink-0">
              <Image 
                src="/logo/LOGO_DPKJ.png" 
                alt="Logo" 
                fill 
                className="object-contain" 
                priority
                quality={100}
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="font-bold text-lg">PEMERINTAH KOTA DENPASAR</h1>
              <h2 className="font-bold text-base">KECAMATAN DENPASAR UTARA</h2>
              <h2 className="font-bold text-base">DESA DAUH PURI KAJA</h2>
              <p className="text-xs mt-2">
                <span className="italic">Alamat : Jl. Gatot Subroto VI J Denpasar</span>
                <span className="ml-8">Telp. (0361) 419973 Kode Pos 80111</span>
              </p>
              <p className="text-xs italic">http://dauhpurikaja.denpasarkota.go.id         desadauhpurikdja@gmail.com</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="font-bold text-base underline">{getJudulSurat(layanan.jenisLayanan)}</h3>
            <p className="text-sm mt-1">
              Nomor : <span className={nomorSurat ? 'font-bold' : 'text-gray-400'}>{nomorSurat || '..............................................'}</span>
            </p>
          </div>

          {/* Body */}
          <div className="text-sm leading-relaxed space-y-4">
            <p className="text-justify indent-12">
              {isiSurat.paragraf1}
            </p>

            {/* Data Pemohon */}
            <div className="ml-12 space-y-1">
              <div className="flex">
                <span className="w-48">Nama</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.namaLengkap || layanan.namaLengkap}</span>
              </div>
              <div className="flex">
                <span className="w-48">Tempat/tanggal lahir</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">
                  {(() => {
                    const tempatLahir = userData?.tempatLahir || layanan.tempatLahir || '.......';
                    const tanggalLahir = userData?.tanggalLahir || layanan.tanggalLahir;
                    const formattedTanggal = tanggalLahir ? formatDate(tanggalLahir) : '.......';
                    return `${tempatLahir} / ${formattedTanggal}`;
                  })()}
                </span>
              </div>
              <div className="flex">
                <span className="w-48">Kewarganegaraan</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.kewarganegaraan || layanan.kewarganegaraan || 'Indonesia'}</span>
              </div>
              <div className="flex">
                <span className="w-48">Agama</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.agama || layanan.agama || '.......'}</span>
              </div>
              <div className="flex">
                <span className="w-48">Pekerjaan</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.pekerjaan || layanan.pekerjaan || '.......'}</span>
              </div>
              <div className="flex">
                <span className="w-48">NIK</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.nik || layanan.nik}</span>
              </div>
              <div className="flex">
                <span className="w-48">No. KK</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.noKK || layanan.noKK}</span>
              </div>
              <div className="flex">
                <span className="w-48">Alamat</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{userData?.alamat || layanan.alamat}</span>
              </div>
              <div className="flex">
                <span className="w-48">Daerah/Banjar</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{(userData?.daerah || layanan.daerah || '.......').replace(/_/g, ' ')}</span>
              </div>
            </div>

            <p className="text-justify indent-12">
              {isiSurat.paragraf2}
            </p>

            <p className="text-justify indent-12">
              {isiSurat.paragraf3}
            </p>
          </div>

          {/* Signature */}
          <div className="mt-12 flex justify-end">
            <div className="text-center" style={{ minWidth: '200px' }}>
              <p className="text-sm mb-1">Denpasar, {getTanggalSurat()}</p>
              <p className="text-sm font-semibold mb-16">Perbekel Desa Dauh Puri Kaja</p>
              <p className="text-sm font-bold underline">I Gusti Ketut Sucipta, ST.</p>
            </div>
          </div>
        </div>
      </div>
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
