"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import AdminLayout from "../components/AdminLayout";

interface PengaturanHome {
  judulSelamatDatang: string;
  ucapanSelamatDatang: string;
  fotoUcapanSelamatDatang: string; // New field
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanHome>({
    judulSelamatDatang: "Ucapan Selamat Datang",
    ucapanSelamatDatang: "",
    fotoUcapanSelamatDatang: "",
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
  const [previewUcapan, setPreviewUcapan] = useState<string>(""); // New preview state
  const [previewPopup, setPreviewPopup] = useState<string>("");
  const fileKepalaDesa = useRef<HTMLInputElement>(null);
  const fileUcapan = useRef<HTMLInputElement>(null); // New ref
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
      fotoUcapanSelamatDatang: "",
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
          fotoUcapanSelamatDatang: data.fotoUcapanSelamatDatang || "",
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
        setPreviewUcapan(data.fotoUcapanSelamatDatang || "");
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

  const handleFileUcapan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUcapan(reader.result as string);
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
      const storageRef = ref(storage, `pengaturan/${path}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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
      let fotoUcapanUrl = pengaturan.fotoUcapanSelamatDatang;
      let popupFotoUrl = pengaturan.popupFoto;
      let slideshowUrls = [...pengaturan.fotoSlideshow];

      // Upload foto kepala desa jika ada file baru
      if (fileKepalaDesa.current?.files?.[0]) {
        fotoKepalaDesaUrl = await uploadImage(
          fileKepalaDesa.current.files[0],
          "kepala-desa.jpg"
        );
      }

      // Upload foto ucapan selamat datang jika ada file baru
      if (fileUcapan.current?.files?.[0]) {
        fotoUcapanUrl = await uploadImage(
          fileUcapan.current.files[0],
          "ucapan-selamat-datang.jpg"
        );
      }

      // Upload foto popup jika ada file baru
      if (filePopup.current?.files?.[0]) {
        popupFotoUrl = await uploadImage(
          filePopup.current.files[0],
          "popup-iklan.jpg"
        );
      }

      // Upload slideshow photos jika ada file baru
      if (slideshowFiles.length > 0) {
        const uploadPromises = slideshowFiles.map((file, index) => {
          const timestamp = Date.now();
          return uploadImage(file, `slideshow-${timestamp}-${index}.jpg`);
        });
        const newUrls = await Promise.all(uploadPromises);
        slideshowUrls = newUrls;
      }

      // Simpan ke Firestore
      const docRef = doc(db, "pengaturan", "home");
      await setDoc(docRef, {
        judulSelamatDatang: pengaturan.judulSelamatDatang,
        ucapanSelamatDatang: pengaturan.ucapanSelamatDatang,
        fotoUcapanSelamatDatang: fotoUcapanUrl,
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/home">
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Pengaturan Home Page</h1>
                <p className="text-white/90 text-sm mt-1">Kelola tampilan beranda masyarakat</p>
              </div>
            </div>
          </div>
        </div>

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

          {/* Foto Ucapan Selamat Datang */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Gambar Ucapan Selamat Datang
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload gambar yang akan ditampilkan di header halaman masyarakat (menggantikan teks ucapan)
            </p>
            
            {previewUcapan && (
              <div className="mb-4">
                <img
                  src={previewUcapan}
                  alt="Preview Ucapan Selamat Datang"
                  className="w-full max-w-2xl h-64 object-cover rounded-xl shadow-lg mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUcapan("");
                    setPengaturan({ ...pengaturan, fotoUcapanSelamatDatang: "" });
                    if (fileUcapan.current) {
                      fileUcapan.current.value = "";
                    }
                  }}
                  className="mt-2 w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all"
                >
                  Hapus Gambar
                </button>
              </div>
            )}
            
            <input
              ref={fileUcapan}
              type="file"
              accept="image/*"
              onChange={handleFileUcapan}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileUcapan.current?.click()}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all"
            >
              {previewUcapan ? "Ganti Gambar Ucapan" : "Pilih Gambar Ucapan"}
            </button>
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
    </AdminLayout>
  );
}
