"use client";
import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Portal from "../../../../components/Portal";

interface PengumumanItem {
  id: string;
  title: string;
  description: string;
  eventDate?: string; // Tanggal Kegiatan
  imageUrl?: string;
  createdAt?: string;
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

function PengumumanFormModal({ open, onClose, onSubmit, editingItem }: { open: boolean; onClose: () => void; onSubmit: (data: { title: string; description: string; eventDate: string; image: File | null }) => void; editingItem?: PengumumanItem | null }) {
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
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            {editingItem ? 'Edit Pengumuman' : 'Formulir Buat Pengumuman'}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Pengumuman</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masukkan judul pengumuman..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-500"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm text-gray-900"
              required
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi pengumuman..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-white/50 backdrop-blur-sm min-h-[120px] resize-none text-gray-900 placeholder:text-gray-500"
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
                  className="relative w-full h-64 rounded-xl overflow-hidden cursor-pointer border border-gray-200 hover:border-orange-500 transition-colors bg-white/50 backdrop-blur-sm"
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
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg"
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
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors bg-white/30 backdrop-blur-sm">
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
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              {editingItem ? 'Simpan Perubahan' : 'Simpan Pengumuman'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </Portal>
  );
}

export default function PengumumanList() {
  const [items, setItems] = useState<PengumumanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PengumumanItem | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "e-news_pengumuman"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PengumumanItem));
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
    if (!confirm("Hapus Pengumuman ini?")) return;
    try {
      await deleteDoc(doc(db, "e-news_pengumuman", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Gagal menghapus Pengumuman");
    }
  }

  function handleEdit(item: PengumumanItem) {
    setEditingItem(item);
    setShowModal(true);
  }

  async function handleCreatePengumuman(data: { title: string; description: string; eventDate: string; image: File | null }) {
    try {
      console.log('🚀 Starting handleCreatePengumuman...', {
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
          
          // Generate filename with .webp extension - menggunakan prefix "pengumuman"
          const timestamp = Date.now();
          const fileName = `${timestamp}_pengumuman.webp`;
          
          console.log('📤 Uploading to Firebase Storage...', { fileName });
          const storageRef = ref(storage, `e-news/${fileName}`);
          await uploadBytes(storageRef, webpBlob, {
            contentType: 'image/webp',
          });
          console.log('✅ Upload successful!');
          
          imageUrl = await getDownloadURL(storageRef);
          console.log('✅ Download URL obtained:', imageUrl.substring(0, 50) + '...');
        } catch (imageError) {
          console.error('❌ Error processing image:', imageError);
          throw new Error(`Gagal upload gambar: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }
      
      const docData = {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate, // Tanggal Kegiatan
        imageUrl,
        createdAt: editingItem?.createdAt || new Date().toISOString(),
      };

      console.log('💾 Saving to Firestore...', { docData });

      if (editingItem) {
        // Update existing
        const docRef = doc(db, "e-news_pengumuman", editingItem.id);
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(docRef, docData);
        setItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? { ...item, ...docData } : item))
        );
        console.log('✅ Pengumuman updated successfully!');
        alert('Pengumuman berhasil diperbarui!');
      } else {
        // Create new
        await addDoc(collection(db, "e-news_pengumuman"), docData);
        console.log('✅ Pengumuman created successfully!');
        alert('Pengumuman berhasil disimpan!');
        // Reload items
        const snap = await getDocs(collection(db, "e-news_pengumuman"));
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PengumumanItem));
        setItems(docs);
      }

      setShowModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('❌ Error in handleCreatePengumuman:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Terjadi kesalahan: ${errorMessage}`);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Pengumuman Desa
            </h2>
            <p className="text-gray-500 text-sm mt-1">Kelola semua pengumuman dan informasi penting desa</p>
          </div>
          <button
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Buat Pengumuman</span>
          </button>
        </div>
      
        {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat data pengumuman...</p>
          <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center shadow-lg">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-orange-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Belum ada Pengumuman</h3>
          <p className="text-gray-500 mb-6">Mulai dengan membuat pengumuman pertama untuk desa Anda</p>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Buat Pengumuman Pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <div key={item.id} className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/90">
              <div className="flex gap-6 items-start">
                {/* Image */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-orange-300 mb-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"/>
                      </svg>
                      <span className="text-xs text-orange-400 font-medium">No Image</span>
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                    PENGUMUMAN
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-xs text-gray-500 mb-3">
                    {/* Tanggal Kegiatan */}
                    {item.eventDate && (
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-orange-500">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span className="font-semibold text-orange-600">
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
      <PengumumanFormModal 
        open={showModal} 
        onClose={() => { setShowModal(false); setEditingItem(null); }} 
        onSubmit={handleCreatePengumuman} 
        editingItem={editingItem} 
      />
    </>
  );
}
