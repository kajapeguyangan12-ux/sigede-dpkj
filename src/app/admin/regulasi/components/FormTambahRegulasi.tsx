"use client";
import React, { useState } from "react";

interface FormTambahRegulasiProps {
  onSubmit: (data: RegulasiFormData, pdfFile?: File | null) => void;
  onCancel: () => void;
  initialData?: RegulasiFormData;
  isLoading?: boolean;
}

export interface RegulasiFormData {
  judul: string;
  nomor: string;
  tahun: string;
  tentang: string;
  deskripsi: string;
  isiLengkap: string;
  tanggalDitetapkan: string;
  status: "aktif" | "tidak_aktif";
  kategori: "perdes" | "peraturan_bersama" | "keputusan_kepala_desa" | "lainnya";
}

export default function FormTambahRegulasi({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: FormTambahRegulasiProps) {
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<RegulasiFormData>(
    initialData || {
      judul: "",
      nomor: "",
      tahun: "",
      tentang: "",
      deskripsi: "",
      isiLengkap: "",
      tanggalDitetapkan: "",
      status: "aktif",
      kategori: "perdes",
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi semua field
    if (!formData.kategori || !formData.nomor || !formData.tahun) {
      alert("Mohon lengkapi Jenis Regulasi, Nomor, dan Tahun");
      return;
    }

    if (!formData.tanggalDitetapkan) {
      alert("Mohon isi Tanggal Penetapan");
      return;
    }

    if (!formData.tentang.trim()) {
      alert("Mohon isi Pengundangan");
      return;
    }

    if (!formData.deskripsi.trim()) {
      alert("Mohon isi Deskripsi Singkat");
      return;
    }

    onSubmit(formData, selectedPdfFile);
  };

  const updateFormData = (field: keyof RegulasiFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedPdfFile(file);
      } else {
        alert("Silakan pilih file PDF yang valid");
        setSelectedPdfFile(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl w-full max-w-2xl mx-auto overflow-hidden shadow-2xl my-8">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-8 text-white relative overflow-hidden sticky top-0 z-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">
            {initialData ? "Edit Regulasi Desa" : "Tambah Regulasi Desa"}
          </h2>
          <p className="text-blue-100 text-sm">Kelola peraturan dan regulasi desa dengan mudah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-6 animate-fadeIn">
          {/* Jenis Regulasi */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Jenis Regulasi <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.kategori}
              onChange={(e) =>
                updateFormData("kategori", e.target.value as any)
              }
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 font-medium hover:border-gray-300"
              required
            >
              <option value="perdes">Peraturan Desa</option>
              <option value="peraturan_bersama">Peraturan Perbekel</option>
            </select>
          </div>

          {/* Nomor & Tahun (2 kolom) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Nomor Regulasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nomor}
                onChange={(e) => updateFormData("nomor", e.target.value)}
                placeholder="Contoh: 01 atau I"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Tahun Regulasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tahun}
                onChange={(e) => updateFormData("tahun", e.target.value)}
                placeholder="Contoh: 2024"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900"
                required
                maxLength={4}
              />
            </div>
          </div>

          {/* Penetapan (Tanggal) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Tanggal Penetapan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggalDitetapkan}
              onChange={(e) =>
                updateFormData("tanggalDitetapkan", e.target.value)
              }
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900"
              required
            />
          </div>

          {/* Status Regulasi */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Status Regulasi <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  value="aktif"
                  checked={formData.status === "aktif"}
                  onChange={(e) =>
                    updateFormData("status", e.target.value as any)
                  }
                  className="w-5 h-5 text-blue-600 cursor-pointer accent-blue-600"
                />
                <span className="text-gray-700 font-medium group-hover:text-gray-900">Berlaku</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  value="tidak_aktif"
                  checked={formData.status === "tidak_aktif"}
                  onChange={(e) =>
                    updateFormData("status", e.target.value as any)
                  }
                  className="w-5 h-5 text-blue-600 cursor-pointer accent-blue-600"
                />
                <span className="text-gray-700 font-medium group-hover:text-gray-900">Tidak Berlaku</span>
              </label>
            </div>
          </div>

          {/* Pengundangan */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Pengundangan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.tentang}
              onChange={(e) => updateFormData("tentang", e.target.value)}
              placeholder="Contoh: Pengelolaan Sampah dan Kebersihan Lingkungan Desa"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Judul Lengkap */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Judul Lengkap (Opsional)
            </label>
            <input
              type="text"
              value={formData.judul}
              onChange={(e) => updateFormData("judul", e.target.value)}
              placeholder="Akan di-generate otomatis jika kosong"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              Format: [Jenis] Nomor [Nomor] Tahun [Tahun] tentang [Pengundangan]
            </p>
          </div>

          {/* Deskripsi Singkat */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Deskripsi Singkat <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => updateFormData("deskripsi", e.target.value)}
              placeholder="Ringkasan singkat tentang regulasi ini..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 resize-none"
              rows={3}
              required
            />
          </div>



          {/* Upload PDF */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Upload File PDF (Opsional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-between bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" />
                    <path d="M10 9a1 1 0 100-2 1 1 0 000 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPdfFile ? selectedPdfFile.name : "Klik atau drag file PDF di sini"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: PDF | Ukuran maksimal: 10MB
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
