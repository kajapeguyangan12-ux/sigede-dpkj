"use client";
import React, { useState } from "react";

export interface DetailAPBData {
  id?: string;
  judul: string;
  kategori: "pendapatan" | "belanja" | "pembiayaan";
  pendapatan: {
    formulir: string;
    realisasi: string;
    kurang: string;
  };
  belanja: {
    formulir: string;
    realisasi: string;
    kurang: string;
  };
  pembiayaan: {
    formulir: string;
    realisasi: string;
    kurang: string;
  };
}

interface DetailAPBModalProps {
  onSubmit: (data: DetailAPBData) => void;
  onCancel: () => void;
  initialData?: DetailAPBData;
  isLoading?: boolean;
}

export default function DetailAPBModal({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: DetailAPBModalProps) {
  const [activeTab, setActiveTab] = useState<"pendapatan" | "belanja" | "pembiayaan">("pendapatan");
  const [formData, setFormData] = useState<DetailAPBData>(
    initialData || {
      judul: "",
      kategori: "pendapatan",
      pendapatan: {
        formulir: "",
        realisasi: "",
        kurang: "",
      },
      belanja: {
        formulir: "",
        realisasi: "",
        kurang: "",
      },
      pembiayaan: {
        formulir: "",
        realisasi: "",
        kurang: "",
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.judul.trim()) {
      alert("Mohon isi Judul");
      return;
    }

    onSubmit(formData);
  };

  const updateField = (
    section: "pendapatan" | "belanja" | "pembiayaan",
    field: "formulir" | "realisasi" | "kurang",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const DataSection = ({
    title,
    section,
  }: {
    title: string;
    section: "pendapatan" | "belanja" | "pembiayaan";
  }) => (
    <div className="mb-6 p-4 border-2 border-gray-300 rounded-lg">
      <label className="block text-sm font-semibold text-gray-900 mb-4">
        {title}
      </label>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Formulir Anggaran
          </label>
          <textarea
            value={formData[section].formulir}
            onChange={(e) => updateField(section, "formulir", e.target.value)}
            placeholder="Masukkan data anggaran..."
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm resize-none"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Data Realisasi
          </label>
          <textarea
            value={formData[section].realisasi}
            onChange={(e) => updateField(section, "realisasi", e.target.value)}
            placeholder="Masukkan data realisasi..."
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm resize-none"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Data Kurang/Lebih
          </label>
          <textarea
            value={formData[section].kurang}
            onChange={(e) => updateField(section, "kurang", e.target.value)}
            placeholder="Masukkan data kurang/lebih..."
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl w-full max-w-2xl mx-auto overflow-hidden shadow-2xl my-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Detail APB</h2>
          <p className="text-blue-100 text-sm mt-1">Kelola Anggaran Pendapatan dan Belanja</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-6">
          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Contoh: APB Desa 2024"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all bg-white text-gray-900 text-sm font-medium"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {[
                { value: "pendapatan", label: "Pendapatan" },
                { value: "belanja", label: "Belanja" },
                { value: "pembiayaan", label: "Pembiayaan" },
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, kategori: cat.value as any });
                    setActiveTab(cat.value as any);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                    formData.kategori === cat.value
                      ? "bg-red-500 text-white shadow-md"
                      : "border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detail APB Header */}
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Detail APB - {formData.kategori.charAt(0).toUpperCase() + formData.kategori.slice(1)}</h3>

            {/* Show only data section for selected category */}
            {formData.kategori === "pendapatan" && (
              <DataSection title="Formulir Anggaran" section="pendapatan" />
            )}
            {formData.kategori === "belanja" && (
              <DataSection title="Formulir Anggaran" section="belanja" />
            )}
            {formData.kategori === "pembiayaan" && (
              <DataSection title="Formulir Anggaran" section="pembiayaan" />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 rounded-lg border-2 border-red-500 bg-white text-red-500 font-semibold hover:bg-red-50 transition-all text-sm"
            >
              Hapus
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Edit"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
