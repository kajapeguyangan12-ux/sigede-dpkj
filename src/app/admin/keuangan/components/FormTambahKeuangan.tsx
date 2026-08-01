"use client";
import React, { useState } from "react";
import { KeuanganData } from "../../../../lib/keuanganService";

export interface KeuanganFormData {
  judul: string;
  tanggal: string;
  keterangan: string;
  jenis: "pemasukan" | "pengeluaran";
  jumlah: number | string;
  kategori: "gaji" | "bantuan" | "infrastruktur" | "operasional" | "lainnya";
  bukti?: string;
}

interface FormTambahKeuanganProps {
  onSubmit: (data: KeuanganFormData) => void;
  onCancel: () => void;
  initialData?: KeuanganData;
  isLoading?: boolean;
}

export default function FormTambahKeuangan({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: FormTambahKeuanganProps) {
  const [formData, setFormData] = useState<KeuanganFormData>(
    initialData
      ? {
          judul: initialData.judul,
          tanggal: initialData.tanggal,
          keterangan: initialData.keterangan,
          jenis: initialData.jenis,
          jumlah: initialData.jumlah,
          kategori: initialData.kategori,
          bukti: initialData.bukti,
        }
      : {
          judul: "",
          tanggal: new Date().toISOString().split("T")[0],
          keterangan: "",
          jenis: "pemasukan",
          jumlah: "",
          kategori: "operasional",
          bukti: "",
        }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.judul.trim()) {
      alert("Mohon isi Judul");
      return;
    }

    if (!formData.tanggal) {
      alert("Mohon pilih Tanggal");
      return;
    }

    if (!formData.keterangan.trim()) {
      alert("Mohon isi Keterangan");
      return;
    }

    if (!formData.jumlah) {
      alert("Mohon isi Jumlah");
      return;
    }

    onSubmit(formData);
  };

  const updateFormData = (field: keyof KeuanganFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const kategoriOptions = [
    { value: "gaji", label: "Gaji / APB" },
    { value: "bantuan", label: "Bantuan" },
    { value: "infrastruktur", label: "Infrastruktur" },
    { value: "operasional", label: "Operasional" },
    { value: "lainnya", label: "Lainnya" },
  ];

  return (
    <div className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden shadow-2xl my-8">
      {/* Header dengan Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">
            {initialData ? "Edit Keuangan" : "Tambah Keuangan"}
          </h2>
          <p className="text-blue-100 text-sm mt-1">Catat transaksi keuangan desa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.judul}
              onChange={(e) => updateFormData("judul", e.target.value)}
              placeholder="Contoh: Penerimaan APB"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm"
              required
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => updateFormData("tanggal", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => updateFormData("keterangan", e.target.value)}
              placeholder="Deskripsi transaksi..."
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm resize-none"
              rows={2}
              required
            />
          </div>

          {/* Jenis (Pemasukan/Pengeluaran) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Jenis <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="jenis"
                  value="pemasukan"
                  checked={formData.jenis === "pemasukan"}
                  onChange={(e) =>
                    updateFormData("jenis", e.target.value as any)
                  }
                  className="w-4 h-4 text-green-600 cursor-pointer accent-green-600"
                />
                <span className="text-sm text-gray-700 font-medium">Pemasukan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="jenis"
                  value="pengeluaran"
                  checked={formData.jenis === "pengeluaran"}
                  onChange={(e) =>
                    updateFormData("jenis", e.target.value as any)
                  }
                  className="w-4 h-4 text-red-600 cursor-pointer accent-red-600"
                />
                <span className="text-sm text-gray-700 font-medium">Pengeluaran</span>
              </label>
            </div>
          </div>

          {/* Jumlah */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Jumlah (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.jumlah}
              onChange={(e) => updateFormData("jumlah", e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm"
              required
              min="0"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.kategori}
              onChange={(e) =>
                updateFormData("kategori", e.target.value as any)
              }
              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 font-medium text-sm"
              required
            >
              {kategoriOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
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
