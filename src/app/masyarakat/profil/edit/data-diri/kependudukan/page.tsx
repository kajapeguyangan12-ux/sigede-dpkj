"use client";

import BottomNavigation from '../../../../../components/BottomNavigation';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import HeaderCard from "../../../../../components/HeaderCard";
import { useAuth } from '../../../../../../contexts/AuthContext';
import { getMasyarakatByEmail, MasyarakatData } from '../../../../../../lib/masyarakatService';
import { uploadKependudukanPhoto, getKependudukanPhotoURL } from '../../../../../../lib/kependudukanPhotoService';
import { createPreviewURL, revokePreviewURL } from '../../../../../../lib/imageUtils';
import Image from 'next/image';

export default function DataDiriKependudukanPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<MasyarakatData | null>(null);
  const [formData, setFormData] = useState({
    nomorKKLama: "",
    nomorKKBaru: "",
    konfirmasiKK: "",
    nik: "",
    namaLengkap: "",
    namaBaru: "",
    tempatLahir: "",
    tempatBaru: "",
    tanggalLahir: "",
    tanggalBaru: "",
    jenisKelamin: "",
    jenisBaru: "",
    statusNikah: "",
    statusBaru: "",
    pekerjaan: "",
    pekerjaanBaru: "",
    desil: "",
    desilBaru: "",
    penghasilan: "",
    penghasilanBaru: "",
  });

  // Photo upload states
  const [fotoKK, setFotoKK] = useState<File | null>(null);
  const [fotoIjazah, setFotoIjazah] = useState<File | null>(null);
  const [previewKK, setPreviewKK] = useState<string | null>(null);
  const [previewIjazah, setPreviewIjazah] = useState<string | null>(null);
  const [existingKKUrl, setExistingKKUrl] = useState<string | null>(null);
  const [existingIjazahUrl, setExistingIjazahUrl] = useState<string | null>(null);
  const [uploadingKK, setUploadingKK] = useState(false);
  const [uploadingIjazah, setUploadingIjazah] = useState(false);
  
  const fileInputKKRef = useRef<HTMLInputElement>(null);
  const fileInputIjazahRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) {
        setDataLoading(false);
        return;
      }

      console.log('🔍 EDIT KEPENDUDUKAN: Fetching data for:', user.email);

      try {
        const profileData = await getMasyarakatByEmail(user.email);
        
        if (profileData) {
          console.log('✅ EDIT KEPENDUDUKAN: Profile data found:', profileData);
          setUserProfile(profileData);
          
          // Set form data dengan data dari database
          setFormData(prev => ({
            ...prev,
            nomorKKLama: profileData.noKK || "-",
            nik: profileData.nik || "-",
            namaLengkap: profileData.nama || "-",
            tempatLahir: profileData.tempatLahir || "-",
            tanggalLahir: profileData.tanggalLahir || "-",
            jenisKelamin: profileData.jenisKelamin || "-",
            statusNikah: profileData.statusPerkawinan || "-",
            pekerjaan: profileData.pekerjaan || "-",
            desil: profileData.desil || "-",
          }));
          
          console.log('📋 EDIT KEPENDUDUKAN: Form data set with database values');
          
          // Load existing photos if any
          if (user.uid) {
            const kkUrl = await getKependudukanPhotoURL(user.uid, 'foto_kk');
            const ijazahUrl = await getKependudukanPhotoURL(user.uid, 'foto_ijazah');
            
            if (kkUrl) {
              console.log('📷 EDIT KEPENDUDUKAN: Existing KK photo found');
              setExistingKKUrl(kkUrl);
            }
            if (ijazahUrl) {
              console.log('📷 EDIT KEPENDUDUKAN: Existing Ijazah photo found');
              setExistingIjazahUrl(ijazahUrl);
            }
          }
        } else {
          console.log('❌ EDIT KEPENDUDUKAN: No profile data found');
          // Set from AuthContext as fallback
          setFormData(prev => ({
            ...prev,
            nik: user.idNumber || "-",
            namaLengkap: user.displayName || user.userName || "-",
          }));
        }
      } catch (error) {
        console.error('💥 EDIT KEPENDUDUKAN ERROR:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewKK) revokePreviewURL(previewKK);
      if (previewIjazah) revokePreviewURL(previewIjazah);
    };
  }, [previewKK, previewIjazah]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Handle file selection for KK
  const handleKKFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 KK file selected:', file.name);
      
      // Cleanup previous preview
      if (previewKK) revokePreviewURL(previewKK);
      
      setFotoKK(file);
      setPreviewKK(createPreviewURL(file));
      setError('');
    }
  };

  // Handle file selection for Ijazah
  const handleIjazahFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 Ijazah file selected:', file.name);
      
      // Cleanup previous preview
      if (previewIjazah) revokePreviewURL(previewIjazah);
      
      setFotoIjazah(file);
      setPreviewIjazah(createPreviewURL(file));
      setError('');
    }
  };

  // Remove KK photo
  const handleRemoveKK = () => {
    if (previewKK) revokePreviewURL(previewKK);
    setFotoKK(null);
    setPreviewKK(null);
    if (fileInputKKRef.current) fileInputKKRef.current.value = '';
  };

  // Remove Ijazah photo
  const handleRemoveIjazah = () => {
    if (previewIjazah) revokePreviewURL(previewIjazah);
    setFotoIjazah(null);
    setPreviewIjazah(null);
    if (fileInputIjazahRef.current) fileInputIjazahRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('User ID tidak ditemukan');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('💾 KEPENDUDUKAN: Starting save process...');
      
      // Upload Foto KK (wajib jika ada perubahan)
      if (fotoKK) {
        console.log('📤 KEPENDUDUKAN: Uploading Foto KK...');
        setUploadingKK(true);
        const kkResult = await uploadKependudukanPhoto(fotoKK, user.uid, 'foto_kk');
        
        if (!kkResult.success) {
          setError(`Gagal upload Foto KK: ${kkResult.error}`);
          setUploadingKK(false);
          setIsLoading(false);
          return;
        }
        
        console.log('✅ KEPENDUDUKAN: Foto KK uploaded successfully');
        setExistingKKUrl(kkResult.downloadURL || null);
        setUploadingKK(false);
      }
      
      // Upload Foto Ijazah (optional)
      if (fotoIjazah) {
        console.log('📤 KEPENDUDUKAN: Uploading Foto Ijazah...');
        setUploadingIjazah(true);
        const ijazahResult = await uploadKependudukanPhoto(fotoIjazah, user.uid, 'foto_ijazah');
        
        if (!ijazahResult.success) {
          console.warn('⚠️ KEPENDUDUKAN: Foto Ijazah upload failed, but continuing...', ijazahResult.error);
          // Don't stop the process, ijazah is optional
        } else {
          console.log('✅ KEPENDUDUKAN: Foto Ijazah uploaded successfully');
          setExistingIjazahUrl(ijazahResult.downloadURL || null);
        }
        setUploadingIjazah(false);
      }
      
      // TODO: Save other form data to Firestore
      console.log('📝 KEPENDUDUKAN: Form data to save:', formData);
      
      setSuccess('Data berhasil disimpan!');
      
      // Clear file inputs
      setFotoKK(null);
      setFotoIjazah(null);
      if (previewKK) revokePreviewURL(previewKK);
      if (previewIjazah) revokePreviewURL(previewIjazah);
      setPreviewKK(null);
      setPreviewIjazah(null);
      
      console.log('🎉 KEPENDUDUKAN: Save process completed!');
      
    } catch (error: any) {
      console.error('💥 KEPENDUDUKAN SAVE ERROR:', error);
      setError(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-merah-putih animate-bg-pan text-gray-800">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard title="Data Diri Kependudukan" backUrl="/masyarakat/profil/edit/data-diri" showBackButton={true} />

        {/* Info Section */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-800">Ubah Data Diri Kependudukan</h3>
          <p className="text-xs text-blue-700 mt-1">
            Perhatikan yang dapat dilakukan perubahan, perubahan data ini hanya dapat dilakukan 7 hari sekali.
          </p>
        </div>

        {/* Loading State */}
        {dataLoading ? (
          <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nomor Kartu Keluarga Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nomor Kartu Keluarga
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Nomor Kartu Keluarga Lama</div>
            <input
              type="text"
              value={formData.nomorKKLama}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Nomor Kartu Keluarga Baru</div>
            <input
              type="text"
              value={formData.nomorKKBaru}
              onChange={(e) => handleInputChange("nomorKKBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-2"
              placeholder="Masukkan Nomor KK Baru"
            />

            <div className="text-xs text-gray-600 mb-2">Konfirmasi Nomor Kartu Keluarga Baru</div>
            <input
              type="text"
              value={formData.konfirmasiKK}
              onChange={(e) => handleInputChange("konfirmasiKK", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Nomor KK Baru Konfirmasi"
            />
          </div>

          {/* NIK Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              NIK
            </label>
            <input
              type="text"
              value={formData.nik}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              readOnly
            />
          </div>

          {/* Nama Lengkap Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nama Lengkap
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Nama Lengkap</div>
            <input
              type="text"
              value={formData.namaLengkap}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Nama Lengkap Baru</div>
            <input
              type="text"
              value={formData.namaBaru}
              onChange={(e) => handleInputChange("namaBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Nama Lengkap Baru"
            />
          </div>

          {/* Tempat Lahir Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tempat Lahir
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Tempat Lahir</div>
            <input
              type="text"
              value={formData.tempatLahir}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Tempat Lahir Baru</div>
            <input
              type="text"
              value={formData.tempatBaru}
              onChange={(e) => handleInputChange("tempatBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Tempat Lahir Baru"
            />
          </div>

          {/* Tanggal Lahir Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tanggal Lahir
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Tanggal Lahir</div>
            <input
              type="text"
              value={formData.tanggalLahir}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Tanggal Lahir Baru</div>
            <input
              type="date"
              value={formData.tanggalBaru}
              onChange={(e) => handleInputChange("tanggalBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Jenis Kelamin Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Jenis Kelamin
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Jenis Kelamin</div>
            <input
              type="text"
              value={formData.jenisKelamin}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Jenis Kelamin Baru</div>
            <select
              value={formData.jenisBaru}
              onChange={(e) => handleInputChange("jenisBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Status Nikah Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Status Nikah
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Status Nikah</div>
            <input
              type="text"
              value={formData.statusNikah}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Status Nikah Baru</div>
            <select
              value={formData.statusBaru}
              onChange={(e) => handleInputChange("statusBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Pilih Status Nikah</option>
              <option value="Belum Menikah">Belum Menikah</option>
              <option value="Menikah">Menikah</option>
              <option value="Cerai Hidup">Cerai Hidup</option>
              <option value="Cerai Mati">Cerai Mati</option>
            </select>
          </div>

          {/* Pekerjaan Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Pekerjaan
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Pekerjaan</div>
            <input
              type="text"
              value={formData.pekerjaan}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Pekerjaan Baru</div>
            <input
              type="text"
              value={formData.pekerjaanBaru}
              onChange={(e) => handleInputChange("pekerjaanBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Masukkan Pekerjaan Baru"
            />
          </div>

          {/* Desil Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Desil
            </label>
            <div className="text-xs text-gray-600 mb-2">Data Desil</div>
            <input
              type="text"
              value={formData.desil}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm mb-3"
              readOnly
            />

            <div className="text-xs text-gray-600 mb-2">Desil Baru</div>
            <select
              value={formData.desilBaru}
              onChange={(e) => handleInputChange("desilBaru", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Pilih Desil</option>
              <option value="1">Desil 1 (Sangat Miskin)</option>
              <option value="2">Desil 2</option>
              <option value="3">Desil 3</option>
              <option value="4">Desil 4</option>
              <option value="5">Desil 5</option>
              <option value="6">Desil 6</option>
              <option value="7">Desil 7</option>
              <option value="8">Desil 8</option>
              <option value="9">Desil 9</option>
              <option value="10">Desil 10 (Sangat Kaya)</option>
            </select>
          </div>

          {/* Penghasilan Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Penghasilan
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-600">Rp.</span>
              <input
                type="text"
                value={formData.penghasilan}
                onChange={(e) => handleInputChange("penghasilan", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Masukkan penghasilan"
              />
              <span className="text-xs text-gray-600">Per Tahun</span>
            </div>

            <div className="text-xs text-gray-600 mb-2">Penghasilan Baru</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Rp.</span>
              <input
                type="text"
                value={formData.penghasilanBaru}
                onChange={(e) => handleInputChange("penghasilanBaru", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Masukkan penghasilan baru"
              />
              <span className="text-xs text-gray-600">Per Tahun</span>
            </div>
          </div>

          {/* Unggah Foto KK Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Unggah Foto KK <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Format: JPG, PNG, atau WebP. Maksimal 5MB. Foto akan dikonversi ke WebP.
            </p>
            
            {/* Hidden file input */}
            <input
              ref={fileInputKKRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleKKFileChange}
              className="hidden"
            />
            
            {/* Preview or Upload Button */}
            {previewKK || existingKKUrl ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={previewKK || existingKKUrl || ''}
                    alt="Preview Foto KK"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputKKRef.current?.click()}
                    className="flex-1 rounded-lg border border-sky-500 bg-white px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    Ganti Foto
                  </button>
                  {previewKK && (
                    <button
                      type="button"
                      onClick={handleRemoveKK}
                      className="flex-1 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                {previewKK && fotoKK && (
                  <p className="text-xs text-gray-600 text-center">
                    📁 {fotoKK.name} ({(fotoKK.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputKKRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50/30 transition-colors"
              >
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-gray-100 mb-3">
                  📷
                </div>
                <p className="text-sky-600 hover:text-sky-700 text-sm font-semibold">
                  Klik untuk Upload Foto KK
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, atau WebP (Maks. 5MB)
                </p>
              </div>
            )}
            
            {uploadingKK && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-sky-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                <span>Mengupload Foto KK...</span>
              </div>
            )}
          </div>

          {/* Unggah Foto Ijazah Section */}
          <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Unggah Foto Ijazah <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Format: JPG, PNG, atau WebP. Maksimal 5MB. Foto akan dikonversi ke WebP.
            </p>
            
            {/* Hidden file input */}
            <input
              ref={fileInputIjazahRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleIjazahFileChange}
              className="hidden"
            />
            
            {/* Preview or Upload Button */}
            {previewIjazah || existingIjazahUrl ? (
              <div className="space-y-3">
                <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={previewIjazah || existingIjazahUrl || ''}
                    alt="Preview Foto Ijazah"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputIjazahRef.current?.click()}
                    className="flex-1 rounded-lg border border-sky-500 bg-white px-4 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50"
                  >
                    Ganti Foto
                  </button>
                  {previewIjazah && (
                    <button
                      type="button"
                      onClick={handleRemoveIjazah}
                      className="flex-1 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                {previewIjazah && fotoIjazah && (
                  <p className="text-xs text-gray-600 text-center">
                    📁 {fotoIjazah.name} ({(fotoIjazah.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputIjazahRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50/30 transition-colors"
              >
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-gray-100 mb-3">
                  📷
                </div>
                <p className="text-sky-600 hover:text-sky-700 text-sm font-semibold">
                  Klik untuk Upload Foto Ijazah
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, atau WebP (Maks. 5MB)
                </p>
              </div>
            )}
            
            {uploadingIjazah && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-sky-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
                <span>Mengupload Foto Ijazah...</span>
              </div>
            )}
          </div>

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

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 px-2">
            <Link
              href="/masyarakat/profil/edit/data-diri"
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading || uploadingKK || uploadingIjazah}
              className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-[inset_0_-2px_0_#0b78c1,0_2px_0_#0b78c133] hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : uploadingKK || uploadingIjazah ? "Mengupload..." : "Simpan"}
            </button>
          </div>
        </form>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
