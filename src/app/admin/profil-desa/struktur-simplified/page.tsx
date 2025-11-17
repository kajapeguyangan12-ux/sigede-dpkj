"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../../lib/logoutHelper';
import AdminLayout from "../../components/AdminLayout";
import AdminHeaderCard from "../../../components/AdminHeaderCard";
import {
  subscribeToStrukturPemerintahanSimplified,
  saveStrukturPemerintahanSimplified,
  uploadImageToStorage,
  StrukturPemerintahanSimplified,
  StrukturOfficer,
} from "../../../../lib/profilDesaService";

export default function StrukturSimplifiedAdminPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [selectedType, setSelectedType] = useState<'desa' | 'bpd'>('desa');
  const [strukturData, setStrukturData] = useState<StrukturPemerintahanSimplified | null>(null);
  const [loading, setLoading] = useState(false); // Only for data operations

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<StrukturOfficer>({
    jabatan: "",
    nama: "",
  });

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to struktur data
  useEffect(() => {
    const unsubscribe = subscribeToStrukturPemerintahanSimplified(selectedType, (data) => {
      setStrukturData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedType]);

  const handleAddOfficer = () => {
    setFormData({ jabatan: "", nama: "" });
    setEditingIndex(null);
    setFotoFile(null);
    setFotoPreview("");
    setShowModal(true);
  };

  const handleEditOfficer = (index: number) => {
    const officer = strukturData?.officers[index];
    if (officer) {
      setFormData(officer);
      setEditingIndex(index);
      setFotoFile(null);
      setFotoPreview("");
      setShowModal(true);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFoto = async () => {
    if (!fotoFile) return;

    setUploading(true);
    try {
      const fotoUrl = await uploadImageToStorage(fotoFile, 'struktur-pemerintahan');
      
      const officers = strukturData?.officers || [];
      const newData = {
        type: selectedType,
        foto: fotoUrl,
        officers: officers,
      };

      await saveStrukturPemerintahanSimplified(selectedType, newData);
      setShowImageModal(false);
      setFotoFile(null);
      setFotoPreview("");
    } catch (error) {
      console.error('Error uploading foto:', error);
      alert('Gagal upload foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOfficer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jabatan.trim() || !formData.nama.trim()) {
      alert('Isi semua field');
      return;
    }

    setUploading(true);
    try {
      let officers = strukturData?.officers || [];

      if (editingIndex !== null) {
        // Update existing
        officers[editingIndex] = formData;
      } else {
        // Add new
        officers = [...officers, formData];
      }

      const newData = {
        type: selectedType,
        foto: strukturData?.foto || '',
        officers: officers,
      };

      await saveStrukturPemerintahanSimplified(selectedType, newData);
      setShowModal(false);
      setFormData({ jabatan: "", nama: "" });
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving officer:', error);
      alert('Gagal menyimpan data');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteOfficer = async () => {
    if (deletingIndex === null) return;

    setUploading(true);
    try {
      let officers = strukturData?.officers || [];
      officers = officers.filter((_, i) => i !== deletingIndex);

      const newData = {
        type: selectedType,
        foto: strukturData?.foto || '',
        officers: officers,
      };

      await saveStrukturPemerintahanSimplified(selectedType, newData);
      setShowDeleteConfirm(false);
      setDeletingIndex(null);
    } catch (error) {
      console.error('Error deleting officer:', error);
      alert('Gagal menghapus data');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

  const officers = strukturData?.officers || [];
  const typeLabel = selectedType === 'desa' ? 'Struktur Desa' : 'Struktur BPD';

  return (
    <main className="min-h-screen bg-gray-50">
      <AdminHeaderCard title="Kelola Struktur Pemerintahan" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <AdminLayout>
          {/* Logout Button */}
          <div className="mb-6">
            <button
              onClick={handleLogout}
              className="text-sm rounded px-4 py-2 bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          {/* Type Selector */}
          <div className="mb-6 flex gap-3">
            {(['desa', 'bpd'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-1 rounded-lg px-4 py-2 font-semibold text-sm transition-colors ${
                  selectedType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {type === 'desa' ? 'Struktur Desa' : 'Struktur BPD'}
              </button>
            ))}
          </div>

          {/* Foto Section */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Foto {typeLabel}</h3>
              <button
                onClick={() => setShowImageModal(true)}
                className="text-sm rounded px-3 py-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                Ubah Foto
              </button>
            </div>

            {strukturData?.foto ? (
              <img 
                src={strukturData.foto} 
                alt={typeLabel}
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-40 rounded-lg bg-gray-200 flex items-center justify-center text-4xl">
                🏛️
              </div>
            )}
          </div>

          {/* Officers List */}
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Daftar Anggota</h3>
              <button
                onClick={handleAddOfficer}
                className="text-sm rounded px-3 py-1 bg-green-600 text-white hover:bg-green-700"
              >
                + Tambah
              </button>
            </div>

            {officers.length > 0 ? (
              <div className="space-y-2">
                {officers.map((officer, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div>
                      <div className="font-semibold text-gray-800">{officer.jabatan}</div>
                      <div className="text-sm text-gray-600">{officer.nama}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditOfficer(index)}
                        className="text-sm rounded px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeletingIndex(index);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-sm rounded px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Belum ada anggota. Tambahkan anggota pertama.
              </div>
            )}
          </div>
        </AdminLayout>
      </div>

      {/* Modal Add/Edit Officer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {editingIndex !== null ? 'Edit Anggota' : 'Tambah Anggota'}
            </h2>

            <form onSubmit={handleSaveOfficer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Kepala Desa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingIndex(null);
                  }}
                  className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Foto */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Upload Foto {typeLabel}
            </h2>

            <div className="mb-4">
              {fotoPreview ? (
                <img 
                  src={fotoPreview} 
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              ) : strukturData?.foto ? (
                <img 
                  src={strukturData.foto} 
                  alt={typeLabel}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-40 rounded-lg bg-gray-200 flex items-center justify-center mb-3">
                  No image
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400"
              >
                Pilih Foto
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setFotoFile(null);
                  setFotoPreview("");
                }}
                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFoto}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={uploading || !fotoFile}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Hapus Anggota?
            </h2>
            <p className="mb-6 text-gray-600">
              {deletingIndex !== null && strukturData?.officers[deletingIndex]?.nama}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingIndex(null);
                }}
                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteOfficer}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
