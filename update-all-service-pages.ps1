# Script PowerShell untuk membuat semua halaman layanan dengan format yang sama

$template = @'
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

__ICON_COMPONENT__

export default function __COMPONENT_NAME__() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ServiceContent | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await getServiceContent('__SERVICE_ID__');
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
        <HeaderCard title="__PAGE_TITLE__" backUrl="/masyarakat/layanan-publik/pelayanan-taring-dukcapil" showBackButton={true} />

        {/* Service Icon and Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-3xl bg-gradient-to-br from-red-100 via-pink-100 to-red-200 shadow-xl ring-2 ring-red-300">
            <__ICON_NAME__ className="h-12 w-12 sm:h-14 sm:w-14 text-red-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">__PAGE_TITLE__</h2>
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
'@

# Definisi icon components
$icons = @{
    'DivorceIcon' = @'
function DivorceIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" opacity="0.3"/>
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
      <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
      <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
'@
    'DeathIcon' = @'
function DeathIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" opacity="0.5"/>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );
}
'@
    'FamilyCardIcon' = @'
function FamilyCardIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-8 2.75c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25S10.75 8.69 10.75 8 11.31 6.75 12 6.75zM17 17H7v-.75c0-1 2-1.5 3-1.5.37 0 1.04.11 1.5.23.46.12.76.26 1 .39.24-.13.54-.27 1-.39.46-.12 1.13-.23 1.5-.23 1 0 3 .5 3 1.5V17z"/>
      <circle cx="8" cy="10" r="1.5"/>
      <circle cx="16" cy="10" r="1.5"/>
    </svg>
  );
}
'@
    'MovingIcon' = @'
function MovingIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.69 2 6 4.69 6 8s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6 6l2-1-3-2-2 1zm-6 4h2v-4l2.57-1.72L15 18l3 2v-1.28c-1.63-.77-3.27-1.72-5-1.72s-3.37.95-5 1.72V22l3-2 1.57 1.72z"/>
    </svg>
  );
}
'@
    'DocumentIcon' = @'
function DocumentIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
  );
}
'@
    'KtpIcon' = @'
function KtpIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
    </svg>
  );
}
'@
    'ChildIdIcon' = @'
function ChildIdIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      <rect x="6" y="16" width="12" height="2" rx="1"/>
    </svg>
  );
}
'@
}

# Definisi layanan
$services = @(
    @{
        folder = 'paket-akta-perceraian'
        serviceId = 'paket-akta-perceraian'
        title = 'Paket Akta Perceraian'
        componentName = 'PaketAktaPerceraianPage'
        iconName = 'DivorceIcon'
        icon = $icons['DivorceIcon']
    },
    @{
        folder = 'paket-akta-kematian'
        serviceId = 'paket-akta-kematian'
        title = 'Paket Akta Kematian'
        componentName = 'PaketAktaKematianPage'
        iconName = 'DeathIcon'
        icon = $icons['DeathIcon']
    },
    @{
        folder = 'kartu-keluarga'
        serviceId = 'kartu-keluarga'
        title = 'Kartu Keluarga'
        componentName = 'KartuKeluargaPage'
        iconName = 'FamilyCardIcon'
        icon = $icons['FamilyCardIcon']
    },
    @{
        folder = 'surat-pindah-domisili'
        serviceId = 'surat-pindah-domisili'
        title = 'Surat Pindah Domisili'
        componentName = 'SuratPindahDomisiliPage'
        iconName = 'MovingIcon'
        icon = $icons['MovingIcon']
    },
    @{
        folder = 'akta-surat-lainnya'
        serviceId = 'akta-surat-lainnya'
        title = 'Akta/Surat Lainnya'
        componentName = 'AktaSuratLainnyaPage'
        iconName = 'DocumentIcon'
        icon = $icons['DocumentIcon']
    },
    @{
        folder = 'ktp-elektronik-denpasar'
        serviceId = 'ktp-elektronik-denpasar'
        title = 'KTP Elektronik Denpasar'
        componentName = 'KtpElektronikDenpasarPage'
        iconName = 'KtpIcon'
        icon = $icons['KtpIcon']
    },
    @{
        folder = 'ktp-elektronik-luar-denpasar'
        serviceId = 'ktp-elektronik-luar-denpasar'
        title = 'KTP Elektronik Luar Denpasar'
        componentName = 'KtpElektronikLuarDenpasarPage'
        iconName = 'KtpIcon'
        icon = $icons['KtpIcon']
    },
    @{
        folder = 'kartu-identitas-anak'
        serviceId = 'kartu-identitas-anak'
        title = 'Kartu Identitas Anak'
        componentName = 'KartuIdentitasAnakPage'
        iconName = 'ChildIdIcon'
        icon = $icons['ChildIdIcon']
    }
)

$basePath = "d:\Nextjs\backup\SiGede\DPKJ\src\app\masyarakat\layanan-publik"

foreach ($service in $services) {
    $folderPath = Join-Path $basePath $service.folder
    
    # Buat folder jika belum ada
    if (!(Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "Created folder: $($service.folder)" -ForegroundColor Green
    }
    
    $filePath = Join-Path $folderPath "page.tsx"
    
    # Backup file lama jika ada
    if (Test-Path $filePath) {
        $backupPath = "$filePath.backup-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $filePath $backupPath
        Write-Host "Backed up existing file: $($service.folder)/page.tsx" -ForegroundColor Yellow
    }
    
    # Generate content
    $content = $template `
        -replace '__ICON_COMPONENT__', $service.icon `
        -replace '__COMPONENT_NAME__', $service.componentName `
        -replace '__SERVICE_ID__', $service.serviceId `
        -replace '__PAGE_TITLE__', $service.title `
        -replace '__ICON_NAME__', $service.iconName
    
    # Tulis file baru
    $content | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "Created/Updated: $($service.folder)/page.tsx" -ForegroundColor Cyan
}

Write-Host "`nAll service pages have been updated!" -ForegroundColor Green
Write-Host "Total pages processed: $($services.Count)" -ForegroundColor Cyan
