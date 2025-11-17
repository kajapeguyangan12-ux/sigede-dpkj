"use client";

import BottomNavigation from '../../../../../components/BottomNavigation';
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import HeaderCard from "../../../../../components/HeaderCard";
import { useAuth } from '../../../../../../contexts/AuthContext';
import { getMasyarakatByEmail } from '../../../../../../lib/masyarakatService';
import { uploadKependudukanPhoto, getKependudukanPhotoURL } from '../../../../../../lib/kependudukanPhotoService';
import { createPreviewURL, revokePreviewURL } from '../../../../../../lib/imageUtils';
import Image from 'next/image';

export default function UbahFotoProfilPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile photo
  useEffect(() => {
    const loadExistingPhoto = async () => {
      if (!user?.uid) {
        setDataLoading(false);
        return;
      }

      console.log('🔍 FOTO PROFIL: Loading existing photo for:', user.uid);

      try {
        // Try to get existing profile photo
        const photoUrl = await getKependudukanPhotoURL(user.uid, 'foto_profil' as any);
        
        if (photoUrl) {
          console.log('✅ FOTO PROFIL: Existing photo found');
          setExistingPhotoUrl(photoUrl);
        } else {
          console.log('ℹ️ FOTO PROFIL: No existing photo');
        }
      } catch (error) {
        console.error('💥 FOTO PROFIL ERROR:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadExistingPhoto();
  }, [user]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) revokePreviewURL(previewUrl);
      stopCamera();
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 FOTO PROFIL: File selected:', file.name);
      
      // Cleanup previous preview
      if (previewUrl) revokePreviewURL(previewUrl);
      
      setSelectedFile(file);
      setPreviewUrl(createPreviewURL(file));
      setShowCameraOptions(false);
      setError('');
      stopCamera();
    }
  };

  const startCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setShowCameraOptions(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan kamera diizinkan.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraOptions(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            console.log('📸 FOTO PROFIL: Photo captured from camera');
            
            // Cleanup previous preview
            if (previewUrl) revokePreviewURL(previewUrl);
            
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(createPreviewURL(file));
            setError('');
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleRemovePhoto = () => {
    if (previewUrl) revokePreviewURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('User ID tidak ditemukan');
      return;
    }
    
    if (!selectedFile) {
      setError('Pilih foto terlebih dahulu');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      console.log('💾 FOTO PROFIL: Starting upload...');
      
      // Upload foto profil ke Storage dengan path yang sama seperti kependudukan
      const result = await uploadKependudukanPhoto(selectedFile, user.uid, 'foto_profil' as any);
      
      if (!result.success) {
        setError(`Gagal upload foto: ${result.error}`);
        setUploading(false);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ FOTO PROFIL: Upload successful!');
      setExistingPhotoUrl(result.downloadURL || null);
      setSuccess('Foto profil berhasil diperbarui!');
      
      // Clear file input
      if (previewUrl) revokePreviewURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      console.log('🎉 FOTO PROFIL: Process completed!');
      
    } catch (error: any) {
      console.error('💥 FOTO PROFIL ERROR:', error);
      setError(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-merah-putih animate-bg-pan text-gray-800">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard title="Pengaturan Akun" backUrl="/masyarakat/profil/edit/akun" showBackButton={true} />

        {/* Info Section */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-800">Ubah Foto Profil</h3>
          <p className="text-xs text-blue-700 mt-1">
            Foto Profil tidak diperbolehkan menggunakan foto palsu, mengandung pesan negatif, serta pelecehan. Format JPG, PNG, atau WebP (Max 5MB).
          </p>
        </div>

        {/* Loading State */}
        {dataLoading ? (
          <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="grid place-items-center">
            <div className="relative">
              <div className="grid h-32 w-32 place-items-center rounded-full bg-gray-100 shadow-lg ring-2 ring-gray-200 overflow-hidden">
                {previewUrl || existingPhotoUrl ? (
                  <Image
                    src={previewUrl || existingPhotoUrl || ''}
                    alt="Profile Photo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-4xl text-white">👤</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />

              {/* Camera button overlay */}
              <label
                htmlFor="photo-upload"
                className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-white shadow-lg ring-2 ring-white hover:bg-sky-600 cursor-pointer"
              >
                📷
              </label>
            </div>
            
            {/* File Info */}
            {selectedFile && (
              <p className="text-xs text-gray-600 mt-3">
                📁 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Camera Options Modal */}
          {showCameraOptions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Ambil Foto</h3>
                  <button
                    onClick={stopCamera}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <video
                  ref={videoRef}
                  className="w-full h-48 bg-gray-200 rounded-lg mb-4"
                  playsInline
                  muted
                />

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => startCamera('environment')}
                    className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Kamera Belakang
                  </button>
                  <button
                    onClick={() => startCamera('user')}
                    className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Kamera Depan
                  </button>
                </div>

                <button
                  onClick={capturePhoto}
                  className="w-full mt-3 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_-2px_0_#0b78c1,0_2px_0_#0b78c133] hover:bg-sky-600"
                >
                  Ambil Foto
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Lihat Foto
            </button>

            <div className="text-center mb-2">
              <p className="text-sm text-gray-700 font-medium">Pilih sumber foto profil:</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                htmlFor="photo-upload"
                className="rounded-full bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-[inset_0_-2px_0_#0b78c1,0_2px_0_#0b78c133] hover:bg-sky-600 cursor-pointer block"
              >
                Galeri
              </label>

              <button
                type="button"
                onClick={() => startCamera('user')}
                className="rounded-full border border-sky-500 bg-white px-4 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50"
              >
                Kamera
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex gap-3 px-2">
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="flex-1 rounded-full border border-red-500 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Hapus Foto
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-sky-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
              <span>Mengupload foto profil...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">✅ {success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading || uploading || !selectedFile}
              className="w-full rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_-2px_0_#059669,0_2px_0_#05966933] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || uploading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
