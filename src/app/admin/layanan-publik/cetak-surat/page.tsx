"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLayananById, LayananPublik } from "../../../../lib/layananPublikService";
import { getDataDesa } from "../../../../lib/dataDesaService";
import Image from 'next/image';

function CetakSuratContent() {
  const searchParams = useSearchParams();
  const layananId = searchParams.get('id');
  const [layanan, setLayanan] = useState<LayananPublik | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [nomorSurat, setNomorSurat] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layananId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching layanan with ID:", layananId);
        const layananData = await getLayananById(layananId);
        console.log("Layanan data:", layananData);
        setLayanan(layananData);

        // Fetch user data from data-desa based on NIK
        if (layananData?.nik) {
          const allData = await getDataDesa();
          const user = allData.find(d => d.nik === layananData.nik);
          console.log("User data:", user);
          setUserData(user);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [layananId]);

  // Auto download when data is loaded
  useEffect(() => {
    if (!loading && layanan && !autoDownloaded) {
      console.log("Auto-triggering print dialog");
      
      // Set document title for PDF filename
      const fileName = `${layanan.jenisLayanan}-${userData?.namaLengkap || layanan.namaLengkap}`;
      const originalTitle = document.title;
      document.title = fileName;
      
      // Wait a bit for the page to fully render
      setTimeout(() => {
        window.print();
        setAutoDownloaded(true);
        
        // Restore original title after print
        setTimeout(() => {
          document.title = originalTitle;
          window.close();
        }, 1000);
      }, 500);
    }
  }, [loading, layanan, autoDownloaded, userData]);

  const handlePrint = () => {
    window.print();
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

  const getIsiSurat = (jenisLayanan: string, keperluan?: string, tanggalPermohonan?: string, daerah?: string) => {
    const keperluanText = keperluan || '..........................................................................';
    const tanggalText = tanggalPermohonan || '.......';
    // Format daerah: replace underscore dengan spasi, contoh: Wangaya_Kaja -> Wangaya Kaja
    const daerahText = daerah ? daerah.replace(/_/g, ' ') : '............';
    
    const isiMap: { [key: string]: { paragraf1: string, paragraf2: string, paragraf3: string } } = {
      "Surat Kelakuan Baik": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berkelakuan baik, tidak pernah tersangkut dalam tindakan kriminal/kejahatan.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Belum Nikah/Kawin": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas belum pernah kawin/menikah sampai saat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Belum Bekerja": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas belum bekerja dan tidak terikat kontrak kerja dengan instansi/perusahaan manapun sampai saat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Kawin/Menikah": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Sepanjang pengetahuan kami memang benar orang tersebut diatas telah melangsungkan perkawinan dan berstatus sebagai suami/istri yang sah.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Kematian": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Telah meninggal dunia pada tanggal .............. di .............. karena ..............",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluanText}.`
      },
      "Surat Keterangan Perjalanan": {
        paragraf1: `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerahText}, Nomor ............................., Tanggal : ${tanggalText}, bahwa :`,
        paragraf2: "Orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan akan melakukan perjalanan ke .............. untuk keperluan ..............",
        paragraf3: "Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya."
      }
    };
    return isiMap[jenisLayanan] || isiMap["Surat Kelakuan Baik"];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!layanan || layanan.jenisLayanan === "Pelayanan Taring Dukcapil") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">
            {!layanan ? "Data tidak ditemukan" : "Jenis layanan ini tidak memiliki template surat"}
          </h2>
          <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const tanggalPermohonan = layanan.createdAt ? formatDate(layanan.createdAt) : '';
  const daerahPemohon = userData?.daerah || layanan.daerah || '';
  const isiSurat = getIsiSurat(layanan.jenisLayanan, layanan.keperluan, tanggalPermohonan, daerahPemohon);

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
          .print-container {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            color: #000000;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-8">
        {/* Print Button */}
        <div className="no-print max-w-4xl mx-auto mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Masukkan Nomor Surat (contoh: 474.3/...../Denpasar)"
            value={nomorSurat}
            onChange={(e) => setNomorSurat(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
          >
            🖨️ Cetak Surat
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold"
          >
            Tutup
          </button>
        </div>

        {/* Letter Content */}
        <div ref={printRef} className="print-container">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6 pb-4 border-b-2 border-black">
            <div className="w-24 h-24 relative flex-shrink-0">
              <Image src="/logo/LOGO_DPKJ.png" alt="Logo" fill className="object-contain" />
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
              Nomor : {nomorSurat || '..............................................'}
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
                <span className="font-semibold">{userData?.daerah || layanan.daerah || '.......'}</span>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Memuat data surat...</p>
        </div>
      </div>
    }>
      <CetakSuratContent />
    </Suspense>
  );
}
