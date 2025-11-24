"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { uploadPopupIklan } from "@/lib/popupIklanService";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// Helper function untuk konversi image ke WebP dengan kualitas 85%
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const originalSize = file.size;
              const webpSize = blob.size;
              const compressionRatio = ((1 - webpSize / originalSize) * 100).toFixed(2);
              console.log(`📦 WebP Conversion: ${(originalSize / 1024).toFixed(2)}KB → ${(webpSize / 1024).toFixed(2)}KB (${compressionRatio}% smaller)`);
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

interface PengaturanHome {
  judulSelamatDatang: string;
  ucapanSelamatDatang: string;
  fotoKepalaDesa: string;
  namaKepalaDesa: string;
  fotoSlideshow: string[];
  popupAktif: boolean;
  popupTipe: "gambar" | "youtube";
  popupJudul: string;
  popupIsi: string;
  popupFoto: string;
  popupYoutubeUrl: string;
  popupYoutubeStartTime: number;
}

export default function PengaturanPage() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(false); // Only for data operations, not navigation
  const [saving, setSaving] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanHome>({
    judulSelamatDatang: "Ucapan Selamat Datang",
    ucapanSelamatDatang: "",
    fotoKepalaDesa: "",
    namaKepalaDesa: "",
    fotoSlideshow: [],
    popupAktif: false,
    popupTipe: "gambar",
    popupJudul: "",
    popupIsi: "",
    popupFoto: "",
    popupYoutubeUrl: "",
    popupYoutubeStartTime: 0,
  });
  const [slideshowPreviews, setSlideshowPreviews] = useState<string[]>([]);
  const [slideshowFiles, setSlideshowFiles] = useState<File[]>([]);
  
  const [previewKepalaDesa, setPreviewKepalaDesa] = useState<string>("");
  const [previewPopup, setPreviewPopup] = useState<string>("");
  const fileKepalaDesa = useRef<HTMLInputElement>(null);
  const filePopup = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('⏱️ Fetch timeout - forcing loading to false');
        setLoading(false);
        alert('Timeout loading data. Please refresh the page.');
      }
    }, 10000); // 10 second timeout

    fetchPengaturan().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchPengaturan = async () => {
    const defaultPengaturan = {
      judulSelamatDatang: "Ucapan Selamat Datang",
      ucapanSelamatDatang: "",
      fotoKepalaDesa: "",
      namaKepalaDesa: "",
      fotoSlideshow: [],
      popupAktif: false,
      popupTipe: "gambar" as const,
      popupJudul: "",
      popupIsi: "",
      popupFoto: "",
      popupYoutubeUrl: "",
      popupYoutubeStartTime: 0,
    };

    try {
      console.log('📥 Fetching pengaturan...');
      setLoading(true);
      
      // Check if Firebase is properly initialized
      if (!db) {
        console.error('❌ Firebase DB not initialized');
        throw new Error('Database connection not available');
      }

      const docRef = doc(db, "pengaturan", "home");
      console.log('📄 Getting document: pengaturan/home');
      
      const docSnap = await getDoc(docRef);
      console.log('📄 Document fetch completed, exists:', docSnap.exists());
      
      if (docSnap.exists()) {
        console.log('✅ Pengaturan data found');
        const data = docSnap.data() as PengaturanHome;
        setPengaturan({
          judulSelamatDatang: data.judulSelamatDatang || "Ucapan Selamat Datang",
          ucapanSelamatDatang: data.ucapanSelamatDatang || "",
          fotoKepalaDesa: data.fotoKepalaDesa || "",
          namaKepalaDesa: data.namaKepalaDesa || "",
          fotoSlideshow: data.fotoSlideshow || [],
          popupAktif: data.popupAktif || false,
          popupTipe: data.popupTipe || "gambar",
          popupJudul: data.popupJudul || "",
          popupIsi: data.popupIsi || "",
          popupFoto: data.popupFoto || "",
          popupYoutubeUrl: data.popupYoutubeUrl || "",
          popupYoutubeStartTime: data.popupYoutubeStartTime || 0,
        });
        setPreviewKepalaDesa(data.fotoKepalaDesa || "");
        setPreviewPopup(data.popupFoto || "");
        setSlideshowPreviews(data.fotoSlideshow || []);
      } else {
        console.log('⚠️ No pengaturan data, using defaults');
        setPengaturan(defaultPengaturan);
      }
    } catch (error: any) {
      console.error("❌ Error fetching pengaturan:", error);
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Use default values on error
      setPengaturan(defaultPengaturan);
      
      // Show user-friendly error
      const errorMessage = error.code === 'permission-denied' 
        ? 'Anda tidak memiliki izin untuk mengakses data ini'
        : error.code === 'unavailable'
        ? 'Koneksi ke database gagal. Periksa koneksi internet Anda'
        : `Error: ${error.message || 'Unknown error'}`;
        
      alert(`Gagal memuat pengaturan: ${errorMessage}\n\nMenggunakan nilai default.`);
    } finally {
      console.log('✅ Fetch complete, setting loading to false');
      setLoading(false);
    }
  };

  const handleFileKepalaDesa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewKepalaDesa(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilePopup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPopup(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSlideshowFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSlideshowFiles(prev => [...prev, ...files]);
      
      // Create previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSlideshowPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSlideshowImage = (index: number) => {
    setSlideshowPreviews(prev => prev.filter((_, i) => i !== index));
    setSlideshowFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractYouTubeId = (url: string): string => {
    if (!url) return "";
    // Support for regular YouTube videos and YouTube Shorts
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      console.log(`🖼️ Converting ${path} to WebP...`);
      const webpBlob = await convertToWebP(file);
      
      // Ganti ekstensi file dengan .webp
      const webpPath = path.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
      const storageRef = ref(storage, `pengaturan/${webpPath}`);
      
      console.log(`⬆️ Uploading ${webpPath} to Firebase Storage...`);
      await uploadBytes(storageRef, webpBlob, {
        contentType: 'image/webp',
      });
      
      const url = await getDownloadURL(storageRef);
      console.log(`✅ Upload successful: ${webpPath}`);
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      let fotoKepalaDesaUrl = pengaturan.fotoKepalaDesa;
      let popupFotoUrl = pengaturan.popupFoto;
      let slideshowUrls = [...pengaturan.fotoSlideshow];

      // Upload foto kepala desa jika ada file baru
      if (fileKepalaDesa.current?.files?.[0]) {
        console.log('📸 Uploading foto kepala desa...');
        fotoKepalaDesaUrl = await uploadImage(
          fileKepalaDesa.current.files[0],
          "kepala-desa.webp"
        );
      }

      // Upload foto popup jika ada file baru dengan WebP conversion
      if (filePopup.current?.files?.[0]) {
        console.log('📸 Uploading popup iklan with WebP conversion...');
        popupFotoUrl = await uploadPopupIklan(filePopup.current.files[0]);
      }

      // Upload slideshow photos jika ada file baru
      if (slideshowFiles.length > 0) {
        console.log(`📸 Uploading ${slideshowFiles.length} slideshow photos...`);
        const uploadPromises = slideshowFiles.map((file, index) => {
          const timestamp = Date.now();
          return uploadImage(file, `slideshow-${timestamp}-${index}.webp`);
        });
        const newUrls = await Promise.all(uploadPromises);
        slideshowUrls = newUrls;
      }

      // Simpan ke Firestore
      const docRef = doc(db, "pengaturan", "home");
      await setDoc(docRef, {
        judulSelamatDatang: pengaturan.judulSelamatDatang,
        ucapanSelamatDatang: pengaturan.ucapanSelamatDatang,
        fotoKepalaDesa: fotoKepalaDesaUrl,
        namaKepalaDesa: pengaturan.namaKepalaDesa,
        fotoSlideshow: slideshowUrls,
        popupAktif: pengaturan.popupAktif,
        popupTipe: pengaturan.popupTipe,
        popupJudul: pengaturan.popupJudul,
        popupIsi: pengaturan.popupIsi,
        popupFoto: popupFotoUrl,
        popupYoutubeUrl: pengaturan.popupYoutubeUrl,
        popupYoutubeStartTime: pengaturan.popupYoutubeStartTime,
        updatedAt: new Date().toISOString(),
      });

      alert("Pengaturan berhasil disimpan!");
      fetchPengaturan();
    } catch (error) {
      console.error("Error saving pengaturan:", error);
      alert("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Enhanced Header */}
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 mb-8 sm:mb-10 relative z-40 overflow-hidden max-w-7xl mx-auto mt-6">
          {/* Floating Background Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-gray-400/10 to-slate-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-slate-400/10 to-zinc-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-gradient-to-br from-zinc-400/5 to-gray-400/5 rounded-full blur-lg animate-pulse delay-500"></div>

          {/* Enhanced AdminHeaderCard with better styling */}
          <div className="w-full bg-gradient-to-r from-white via-gray-50/30 to-slate-50/40 rounded-2xl shadow-lg border border-gray-200/60 px-8 py-8 flex items-center justify-between mb-6 relative backdrop-blur-sm">
            {/* Enhanced Title Section */}
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-500/25 transform hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-4xl bg-gradient-to-r from-slate-800 via-gray-800 to-zinc-800 bg-clip-text text-transparent mb-2">
                  Pengaturan
                </h1>
                <p className="text-slate-600 font-medium text-lg">
                  Kelola tampilan beranda masyarakat
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    Konfigurasi Sistem
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                    Home Page Settings
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Controls Section */}
            <div className="flex items-center gap-6 relative z-10">
              {/* Back Button */}
              <Link href="/admin/home">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg group">
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </Link>
              
              {/* Enhanced Account Section */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-gray-50 hover:to-gray-100 transition-all duration-300 cursor-pointer shadow-md">
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-gray-600"
                  >
                    <path d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5h2A5.5 5.5 0 0110 10z"/>
                  </svg>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg group"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="text-red-600 group-hover:text-red-700"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Judul Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Judul Section Sambutan
              </h2>
              <input
                type="text"
                value={pengaturan.judulSelamatDatang || ""}
                onChange={(e) =>
                  setPengaturan({ ...pengaturan, judulSelamatDatang: e.target.value })
                }
                placeholder="Contoh: Ucapan Selamat Datang"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Foto Kepala Desa & Nama */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Foto & Nama Kepala Desa
              </h2>
              
              {previewKepalaDesa && (
                <div className="mb-4">
                  <img
                    src={previewKepalaDesa}
                    alt="Preview Kepala Desa"
                    className="w-full max-w-md h-48 object-cover rounded-xl shadow-lg mx-auto"
                  />
                </div>
              )}
              
              <input
                ref={fileKepalaDesa}
                type="file"
                accept="image/*"
                onChange={handleFileKepalaDesa}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileKepalaDesa.current?.click()}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all mb-4"
              >
                Pilih Foto Kepala Desa
              </button>

              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Nama Kepala Desa
                </label>
                <input
                  type="text"
                  value={pengaturan.namaKepalaDesa || ""}
                  onChange={(e) =>
                    setPengaturan({ ...pengaturan, namaKepalaDesa: e.target.value })
                  }
                  placeholder="Contoh: I Made Suartana, S.H."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Foto Slideshow */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Foto Slideshow Card Sambutan
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Upload beberapa foto yang akan ditampilkan di card putih sambutan (auto slide setiap 4 detik)
            </p>

            {/* Preview existing photos */}
            {slideshowPreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                {slideshowPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Slideshow ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlideshowImage(index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSlideshowFiles}
              className="hidden"
              id="slideshow-input"
            />
            <button
              type="button"
              onClick={() => document.getElementById('slideshow-input')?.click()}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all"
            >
              + Tambah Foto Slideshow
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Bisa pilih beberapa foto sekaligus
            </p>
          </div>

          {/* Popup Iklan */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Popup Iklan
              </h2>
              
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pengaturan.popupAktif}
                  onChange={(e) =>
                    setPengaturan({ ...pengaturan, popupAktif: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {pengaturan.popupAktif ? "Aktif" : "Nonaktif"}
                </span>
              </label>
            </div>

            {/* Tipe Popup */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Tipe Popup
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPengaturan({ ...pengaturan, popupTipe: "gambar" })}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    pengaturan.popupTipe === "gambar"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  📷 Gambar + Text
                </button>
                <button
                  type="button"
                  onClick={() => setPengaturan({ ...pengaturan, popupTipe: "youtube" })}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    pengaturan.popupTipe === "youtube"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ▶️ Video YouTube
                </button>
              </div>
            </div>

            {pengaturan.popupTipe === "gambar" ? (
              // Konten untuk tipe Gambar
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Judul Popup
                  </label>
                  <input
                    type="text"
                    value={pengaturan.popupJudul || ""}
                    onChange={(e) =>
                      setPengaturan({ ...pengaturan, popupJudul: e.target.value })
                    }
                    placeholder="Contoh: Pengumuman Penting"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Isi Popup
                  </label>
                  <textarea
                    value={pengaturan.popupIsi || ""}
                    onChange={(e) =>
                      setPengaturan({ ...pengaturan, popupIsi: e.target.value })
                    }
                    placeholder="Masukkan isi pengumuman atau iklan..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Foto Popup (Opsional)
                  </label>
                  
                  {previewPopup && (
                    <div className="mb-4">
                      <img
                        src={previewPopup}
                        alt="Preview Popup"
                        className="w-full max-w-md h-48 object-cover rounded-xl shadow-lg mx-auto"
                      />
                    </div>
                  )}
                  
                  <input
                    ref={filePopup}
                    type="file"
                    accept="image/*"
                    onChange={handleFilePopup}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => filePopup.current?.click()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all"
                  >
                    Pilih Foto Popup
                  </button>
                </div>
              </div>
            ) : (
              // Konten untuk tipe YouTube
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Cara mendapatkan URL YouTube:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Buka video YouTube atau <strong>YouTube Shorts</strong> yang ingin ditampilkan</li>
                        <li>Klik tombol "Share" / "Bagikan"</li>
                        <li>Copy link yang muncul</li>
                        <li>Paste di kotak input di bawah</li>
                      </ol>
                      <p className="mt-2 font-semibold">Format URL yang didukung:</p>
                      <ul className="list-disc ml-4 space-y-1 text-xs">
                        <li>https://youtu.be/xxxxx</li>
                        <li>https://www.youtube.com/watch?v=xxxxx</li>
                        <li>https://www.youtube.com/shorts/xxxxx <span className="text-red-600">(NEW!)</span></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    URL Video YouTube / YouTube Shorts
                  </label>
                  <input
                    type="text"
                    value={pengaturan.popupYoutubeUrl || ""}
                    onChange={(e) =>
                      setPengaturan({ ...pengaturan, popupYoutubeUrl: e.target.value })
                    }
                    placeholder="https://youtu.be/xxxxx atau https://www.youtube.com/shorts/xxxxx"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Desktop:</strong> Video akan autoplay dengan suara.<br/>
                    <strong>Mobile:</strong> Autoplay dengan suara. Jika diblokir browser, user perlu tap play sekali. Mendukung video YouTube reguler dan YouTube Shorts.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Mulai dari Detik ke-
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pengaturan.popupYoutubeStartTime || 0}
                    onChange={(e) =>
                      setPengaturan({ ...pengaturan, popupYoutubeStartTime: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Masukkan detik untuk memulai video. Contoh: <strong>30</strong> = mulai dari detik ke-30. <strong>0</strong> = mulai dari awal.
                  </p>
                </div>

                {pengaturan.popupYoutubeUrl && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Preview Video
                    </label>
                    <div className="relative rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${extractYouTubeId(pengaturan.popupYoutubeUrl)}?start=${pengaturan.popupYoutubeStartTime || 0}`}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/admin/home" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-xl transition-all"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Pengaturan"
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
