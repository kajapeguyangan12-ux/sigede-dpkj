"use client";
import React, { useState, useEffect, useRef } from "react";
import { db, storage, auth } from "../../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import Portal from "../../../../components/Portal";

interface BeritaItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  eventDate?: string; // Tanggal Kegiatan
  createdAt?: string;
  createdBy?: string;
  authorRole?: string;
  status?: string;
}

// Helper function to ensure Firebase Auth is active
async function ensureFirebaseAuth(): Promise<boolean> {
  try {
    if (!auth.currentUser) {
      console.log('⚠️ No Firebase Auth user found');
      console.log('💡 Admin should be authenticated via login process');
      return false;
    }
    
    console.log('✅ Firebase Auth already active:', {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      isAnonymous: auth.currentUser.isAnonymous
    });
    return true;
  } catch (error) {
    console.error('❌ Firebase Auth check failed:', error);
    return false;
  }
}

// Helper function to convert image to WebP
async function convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
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
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function BeritaFormModal({ open, onClose, onSubmit, editingItem }: { open: boolean; onClose: () => void; onSubmit: (data: { title: string; description: string; eventDate: string; image: File | null }) => void; editingItem?: BeritaItem | null }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description);
      setEventDate(editingItem.eventDate || "");
      setPreview(editingItem.imageUrl || null);
      setImage(null);
    } else {
      setTitle("");
      setDescription("");
      setEventDate("");
      setImage(null);
      setPreview(null);
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (!image) {
      if (!editingItem?.imageUrl) {
        setPreview(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-10 max-h-[90vh] overflow-y-auto animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            {editingItem ? 'Edit Berita' : 'Formulir Buat Berita'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit({ title, description, eventDate, image });
            setTitle("");
            setDescription("");
            setEventDate("");
            setImage(null);
            setPreview(null);
          }}
          className="space-y-6"
        >
          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Berita</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masukkan judul berita..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          {/* Tanggal Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Kegiatan</label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm text-gray-900"
              required
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi berita..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm min-h-[120px] resize-none text-gray-900 placeholder:text-gray-500"
              required
            />
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Foto
              <span className="text-xs text-gray-500 font-normal ml-2">(akan dikonversi ke WebP)</span>
            </label>
            
            {/* Preview Image */}
            {preview && (
              <div className="mb-4 relative group">
                <div 
                  onClick={() => setShowImageModal(true)}
                  className="relative w-full h-64 rounded-xl overflow-hidden cursor-pointer border border-gray-200 hover:border-red-500 transition-colors bg-white/50 backdrop-blur-sm"
                >
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="48" height="48" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">Klik gambar untuk melihat ukuran penuh</p>
                
                {/* Button Ganti Foto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Ganti Foto</span>
                </button>
              </div>
            )}
            
            {/* Upload Button */}
            <div className={`${preview ? 'hidden' : ''}`}>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors bg-white/30 backdrop-blur-sm">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setImage(file);
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-gray-400 mb-2">
                    <path d="M12 16v-4m0 0V8m0 4h4m-4 0H8m12 8H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2z"/>
                  </svg>
                  <span className="text-gray-600 font-medium">Klik untuk upload gambar</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG hingga 10MB</span>
                </label>
              </div>
            </div>
          </div>

          {/* Image Preview Modal */}
          {showImageModal && preview && (
            <Portal>
              <div 
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn"
                onClick={() => setShowImageModal(false)}
              >
                <div className="relative max-w-4xl max-h-[90vh] w-full animate-scaleIn">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <img 
                  src={preview} 
                  alt="Preview Full" 
                  className="w-full h-full object-contain rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              </div>
            </Portal>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              {editingItem ? 'Simpan Perubahan' : 'Simpan Berita'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </Portal>
  );
}

export default function BeritaList() {
  const [items, setItems] = useState<BeritaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BeritaItem | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "e-news_berita"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BeritaItem));
        if (mounted) setItems(docs);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus Berita ini?")) return;
    try {
      await deleteDoc(doc(db, "e-news_berita", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Gagal menghapus Berita");
    }
  }

  function handleEdit(item: BeritaItem) {
    setEditingItem(item);
    setShowModal(true);
  }

  async function handleCreateBerita(data: { title: string; description: string; eventDate: string; image: File | null }) {
    try {
      console.log('🚀 Starting handleCreateBerita...');
      
      // Check Firebase Auth status
      const authSuccess = await ensureFirebaseAuth();
      if (!authSuccess) {
        console.log('⚠️ Firebase Auth not active - continuing with localStorage auth only');
      }
      
      // Check Firebase Auth status
      const currentUser = auth.currentUser;
      console.log('🔐 Firebase Auth Status:', {
        isAuthenticated: !!currentUser,
        isAnonymous: currentUser?.isAnonymous,
        userId: currentUser?.uid,
      });

      // Also check localStorage for additional context
      const savedUser = localStorage.getItem('sigede_auth_user');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      console.log('💾 LocalStorage Auth:', {
        hasData: !!userData,
        role: userData?.role,
        email: userData?.email,
      });

      // Use localStorage auth as primary authentication method
      if (!userData) {
        throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      }

      // Firebase Auth is optional - localStorage is primary
      if (!currentUser) {
        console.log('ℹ️ Firebase Auth not active, using localStorage auth data');
        console.log('✅ Admin authenticated via localStorage:', userData.email || userData.displayName);
      } else {
        console.log('✅ Firebase Auth active:', currentUser.email);
      }

      console.log('🚀 Starting handleCreateBerita...', {
        hasImage: !!data.image,
        imageType: data.image?.type,
        imageSize: data.image?.size,
      });

      let imageUrl = editingItem?.imageUrl || "";
      
      if (data.image) {
        try {
          console.log('📸 Converting image to WebP...');
          // Convert image to WebP
          const webpBlob = await convertToWebP(data.image, 0.85);
          console.log('✅ WebP conversion successful', {
            originalSize: data.image.size,
            webpSize: webpBlob.size,
            compression: ((1 - webpBlob.size / data.image.size) * 100).toFixed(2) + '%'
          });
          
          // Generate filename with .webp extension
          const timestamp = Date.now();
          const fileName = `${timestamp}_berita.webp`;
          
          console.log('📤 Uploading to Firebase Storage...', { fileName });
          const storageRef = ref(storage, `e-news/${fileName}`);
          
          // Try upload with retry mechanism
          let uploadSuccess = false;
          let uploadAttempts = 0;
          const maxUploadAttempts = 3;
          
          while (!uploadSuccess && uploadAttempts < maxUploadAttempts) {
            try {
              uploadAttempts++;
              console.log(`🔄 Upload attempt ${uploadAttempts}/${maxUploadAttempts}`);
              
              // Check auth status before retry
              if (uploadAttempts > 1) {
                const currentAuthStatus = await ensureFirebaseAuth();
                console.log(`🔍 Auth status on retry ${uploadAttempts}:`, currentAuthStatus);
              }
              
              await uploadBytes(storageRef, webpBlob, {
                contentType: 'image/webp',
              });
              
              uploadSuccess = true;
              console.log('✅ Upload successful!');
            } catch (uploadError: any) {
              console.error(`❌ Upload attempt ${uploadAttempts} failed:`, uploadError);
              
              if (uploadAttempts >= maxUploadAttempts) {
                throw uploadError;
              } else {
                console.log('🔄 Retrying upload...');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
          
          imageUrl = await getDownloadURL(storageRef);
          console.log('✅ Download URL obtained:', imageUrl.substring(0, 50) + '...');
        } catch (imageError) {
          console.error('❌ Error processing image:', imageError);
          throw new Error(`Gagal upload gambar: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }
      
      // Get creator info from currentUser or userData
      const creatorInfo = currentUser?.email || userData?.email || userData?.displayName || 'admin';
      
      const docData = {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate, // Tanggal Kegiatan
        imageUrl,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
        createdBy: creatorInfo,
        authorRole: userData?.role || 'admin',
        status: 'published'
      };

      console.log('💾 Saving to Firestore...', { docData });

      if (editingItem) {
        // Update existing
        const docRef = doc(db, "e-news_berita", editingItem.id);
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(docRef, docData);
        setItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? { ...item, ...docData } : item))
        );
        console.log('✅ Berita updated successfully!');
        alert('Berita berhasil diperbarui!');
      } else {
        // Create new
        await import("firebase/firestore").then(({ addDoc, collection }) =>
          addDoc(collection(db, "e-news_berita"), docData)
        );
        console.log('✅ Berita created successfully!');
        alert('Berita berhasil disimpan!');
        // Reload items
        const snap = await getDocs(collection(db, "e-news_berita"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BeritaItem));
        setItems(docs);
      }

      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('❌ Error in handleCreateBerita:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Terjadi kesalahan: ${errorMessage}`);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Berita Desa
            </h2>
            <p className="text-gray-500 text-sm mt-1">Kelola semua berita dan informasi penting desa</p>
          </div>
          <button
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Buat Berita</span>
          </button>
        </div>
      
        {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200 border-t-red-600 mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat data berita...</p>
          <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center shadow-lg">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Belum ada Berita</h3>
          <p className="text-gray-500 mb-6">Mulai dengan membuat berita pertama untuk desa Anda</p>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Buat Berita Pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <div key={item.id} className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/90">
              <div className="flex gap-6 items-start">
                {/* Image */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-red-300 mb-1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span className="text-xs text-red-400 font-medium">No Image</span>
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                    BERITA
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-xs text-gray-500 mb-3">
                    {/* Tanggal Kegiatan */}
                    {item.eventDate && (
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-red-500">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span className="font-semibold text-red-600">
                          Kegiatan: {new Date(item.eventDate).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {/* Tanggal Dibuat */}
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="font-medium">
                        Dibuat: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }) : "Tanggal tidak tersedia"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18"/>
                      <path d="M8 6v14h8V6"/>
                      <path d="M10 10v6"/>
                      <path d="M14 10v6"/>
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal di luar container */}
      <BeritaFormModal 
        open={showModal} 
        onClose={() => { setShowModal(false); setEditingItem(null); }} 
        onSubmit={handleCreateBerita} 
        editingItem={editingItem} 
      />
    </>
  );
}
