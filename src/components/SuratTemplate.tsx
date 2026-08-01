"use client";

import React, { ReactElement, JSX } from 'react';

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
  nomorSuratKadus?: string; // Nomor pengantar dari Kepala Dusun
  tanggalPengantar?: string; // Tanggal pengantar
  [key: string]: any;
}

interface SuratTemplateProps {
  data: SuratData;
}

/**
 * Template Surat untuk PDF Generation
 * Component ini dirender di hidden element untuk di-capture sebagai PDF
 */
export default function SuratTemplate({ data }: SuratTemplateProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      // Handle timezone offset by adding 1 day to compensate
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  const getJudulSurat = (jenisLayanan: string) => {
    const jenis = jenisLayanan.toLowerCase();
    if (jenis.includes('kelakuan baik')) return 'SURAT KETERANGAN KELAKUAN BAIK';
    if (jenis.includes('belum nikah') || jenis.includes('belum kawin')) return 'SURAT KETERANGAN BELUM PERNAH KAWIN/MENIKAH';
    if (jenis.includes('belum bekerja')) return 'SURAT KETERANGAN BELUM BEKERJA';
    if (jenis.includes('kawin') || jenis.includes('menikah')) return 'SURAT KETERANGAN KAWIN/MENIKAH';
    if (jenis.includes('kematian') || jenis.includes('meninggal')) return 'SURAT KETERANGAN KEMATIAN';
    if (jenis.includes('perjalanan') || jenis.includes('berpergian')) return 'SURAT KETERANGAN PERJALANAN';
    if (jenis.includes('domisili') || jenis.includes('tinggal')) return 'SURAT KETERANGAN DOMISILI';
    if (jenis.includes('usaha')) return 'SURAT KETERANGAN USAHA';
    if (jenis.includes('tidak mampu') || jenis.includes('kurang mampu')) return 'SURAT KETERANGAN TIDAK MAMPU';
    return 'SURAT KETERANGAN';
  };

  const getIsiSurat = (jenisLayanan: string) => {
    const daerah = data.daerah?.replace(/_/g, ' ') || 'WANGAYA KAJA';
    const keperluan = data.keperluan || 'keperluan yang bersangkutan';
    const nomorPengantar = data.nomorSuratKadus || '';
    const tanggalPengantar = data.tanggalPengantar ? formatDate(data.tanggalPengantar) : '';
    
    // Format pembuka surat yang sama untuk semua jenis dengan nomor BOLD
    const pembukaSurat = nomorPengantar
      ? (
          <>
            Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun {daerah}, Nomor <strong>{nomorPengantar}</strong>, Tanggal : {tanggalPengantar}, bahwa :
          </>
        )
      : `Yang bertanda tangan dibawah ini, Perbekel Desa Dauh Puri Kaja, Kecamatan Denpasar Utara, Kota Denpasar, menerangkan dengan sebenarnya sesuai dengan pengantar Kepala Dusun ${daerah}, pengantar Kepala Dusun, bahwa :`;
    
    const isiMap: { [key: string]: { paragraf1: JSX.Element | string, paragraf2: string, paragraf3: string } } = {
      "Surat Kelakuan Baik": {
        paragraf1: pembukaSurat,
        paragraf2: "Sepanjang pengetahuan kami orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berkelakuan baik, tidak pernah tersangkut dalam tindakan kriminal/kejahatan.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      },
      "Surat Keterangan Belum Nikah/Kawin": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berdasarkan data yang ada, orang tersebut belum pernah kawin/menikah sampai saat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      },
      "Surat Keterangan Belum Bekerja": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berdasarkan data yang ada, orang tersebut belum bekerja dan tidak terikat kontrak kerja dengan perusahaan/instansi manapun.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      },
      "Surat Keterangan Kawin/Menikah": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan telah melangsungkan perkawinan serta berstatus sebagai suami/istri yang sah.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      },
      "Surat Keterangan Kematian": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan telah meninggal dunia.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      },
      "Surat Keterangan Perjalanan": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan akan melakukan perjalanan untuk keperluan sebagaimana dimaksud dalam surat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk berpergian.`
      },
      "Surat Keterangan Berpergian": {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan akan melakukan perjalanan untuk keperluan sebagaimana dimaksud dalam surat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk berpergian.`
      },
    };
    
    // Fallback logic - check by lowercase keywords if exact match not found
    const jenis = jenisLayanan.toLowerCase();
    if (isiMap[jenisLayanan]) {
      return isiMap[jenisLayanan];
    } else if (jenis.includes('kelakuan baik')) {
      return isiMap["Surat Kelakuan Baik"];
    } else if (jenis.includes('belum nikah') || jenis.includes('belum kawin')) {
      return isiMap["Surat Keterangan Belum Nikah/Kawin"];
    } else if (jenis.includes('belum bekerja')) {
      return isiMap["Surat Keterangan Belum Bekerja"];
    } else if (jenis.includes('kawin') || jenis.includes('menikah')) {
      return isiMap["Surat Keterangan Kawin/Menikah"];
    } else if (jenis.includes('kematian') || jenis.includes('meninggal')) {
      return isiMap["Surat Keterangan Kematian"];
    } else if (jenis.includes('perjalanan') || jenis.includes('berpergian')) {
      return isiMap["Surat Keterangan Perjalanan"];
    } else if (jenis.includes('domisili') || jenis.includes('tinggal')) {
      return {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan bertempat tinggal di alamat sebagaimana tercantum dalam surat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      };
    } else if (jenis.includes('usaha')) {
      return {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan memiliki usaha sebagaimana dimaksud dalam surat ini.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      };
    } else if (jenis.includes('tidak mampu') || jenis.includes('kurang mampu')) {
      return {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja dan berdasarkan data yang ada, orang tersebut tergolong kurang mampu secara ekonomi.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      };
    } else {
      // Default fallback
      return {
        paragraf1: pembukaSurat,
        paragraf2: "Menerangkan bahwa orang tersebut diatas adalah benar-benar penduduk Desa Dauh Puri Kaja.",
        paragraf3: `Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan untuk ${keperluan}.`
      };
    }
  };

  const isiSurat = getIsiSurat(data.jenisLayanan);

  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm 20mm 20mm 20mm',
      backgroundColor: '#ffffff',
      fontFamily: 'Times New Roman, serif',
      fontSize: '14px',
      color: '#000',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '3px solid #000',
        display: 'table',
        width: '100%'
      }}>
        <div style={{ 
          display: 'table-cell',
          width: '150px',
          verticalAlign: 'top',
          paddingRight: '15px'
        }}>
          <img 
            src="/logo/LOGO_DPKJ.png" 
            alt="Logo DPKJ"
            style={{ 
              width: '140px', 
              height: 'auto',
              maxHeight: '140px',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              margin: '0 auto',
              imageRendering: '-webkit-optimize-contrast'
            } as React.CSSProperties}
            crossOrigin="anonymous"
          />
        </div>
        <div style={{ 
          display: 'table-cell',
          textAlign: 'center', 
          verticalAlign: 'middle'
        }}>
          <p style={{ fontSize: '10px', margin: '0 0 2px 0', lineHeight: '1.2', color: '#000' }}>
            ຂ້າພະເຈົ້າອິທິພົນຄວາມເປັນໄປໄດ້ອັນໃດໜຶ່ງ
          </p>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 2px 0', letterSpacing: '1px', color: '#000' }}>
            PEMERINTAH KOTA DENPASAR
          </h1>
          <p style={{ fontSize: '10px', margin: '0 0 2px 0', lineHeight: '1.2', color: '#000' }}>
            ພາສາອັກສອນບາລີໝັກປະຈຳ
          </p>
          <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0', letterSpacing: '0.5px', color: '#000' }}>
            KECAMATAN DENPASAR UTARA
          </h2>
          <p style={{ fontSize: '10px', margin: '0 0 2px 0', lineHeight: '1.2', color: '#000' }}>
            ນະຄອນປາດາຕາຄາ
          </p>
          <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0', letterSpacing: '0.5px', color: '#000' }}>
            DESA DAUH PURI KAJA
          </h2>
          <p style={{ fontSize: '9px', margin: '0', lineHeight: '1.3', fontStyle: 'italic', color: '#000' }}>
            Alamat: Jalan Gatot Subroto VI J No. 14 DENPASAR Telpon (0361) 419973 kode Pos 80111
          </p>
          <p style={{ fontSize: '9px', margin: '2px 0 0 0', lineHeight: '1.3', fontStyle: 'italic', color: '#000' }}>
            website: http://dauhpurikaja.denpasarkota.go.id Email: desa_dauhpurikdja@yahoo.com
          </p>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', textDecoration: 'underline', margin: '0 0 8px 0' }}>
          {getJudulSurat(data.jenisLayanan)}
        </h3>
        <p style={{ fontSize: '13px', margin: '0' }}>
          Nomor : <strong>{data.nomorSurat || '...........................'}</strong>
        </p>
      </div>

      {/* Body */}
      <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
        <p style={{ textAlign: 'justify', textIndent: '48px', marginBottom: '16px' }}>
          {isiSurat.paragraf1}
        </p>

        {/* Data Pemohon */}
        <div style={{ margin: '16px 0 16px 48px' }}>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Nama</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.namaLengkap}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>NIK</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.nik}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Tempat/Tgl Lahir</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.tempatLahir} / {formatDate(data.tanggalLahir)}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Jenis Kelamin</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.jenisKelamin}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Agama</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.agama}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Pekerjaan</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.pekerjaan}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Alamat</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.alamat}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '192px' }}>Daerah/Banjar</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{data.daerah?.replace(/_/g, ' ') || 'WANGAYA KAJA'}</strong>
          </div>
        </div>

        <p style={{ textAlign: 'justify', textIndent: '48px', marginBottom: '16px' }}>
          {isiSurat.paragraf2}
        </p>

        <p style={{ textAlign: 'justify', textIndent: '48px', marginBottom: '16px' }}>
          {isiSurat.paragraf3}
        </p>
      </div>

      {/* Signature */}
      <div style={{ marginTop: '48px', textAlign: 'right' }}>
        <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '200px' }}>
          <p style={{ fontSize: '13px', marginBottom: '4px' }}>
            Denpasar, {formatDate(data.tanggalSurat || new Date().toISOString())}
          </p>
          <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '64px' }}>
            Perbekel Desa Dauh Puri Kaja
          </p>
          <p style={{ fontSize: '13px', fontWeight: '700', margin: '0' }}>
            I Gusti Ketut Sucipta, ST.
          </p>
        </div>
      </div>
    </div>
  );
}
