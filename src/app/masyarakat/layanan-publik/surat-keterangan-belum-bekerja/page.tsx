"use client";

import { useState } from "react";
import HeaderCard from "../../../components/HeaderCard";
import BottomNavigation from '../../../components/BottomNavigation';

type FormData = {
  jenisSurat: string;
  kepalaDusun: string;
  tanggalSurat: string;
  nik: string;
  nama: string;
  alamat: string;
  email: string;
  noHandphone: string;
  deskripsi: string;
  fotoKK: File | null;
  fotoKTP: File | null;
};

export default function SuratKeteranganBelumBekerjaPage() {
  const [formData, setFormData] = useState<FormData>({
    jenisSurat: "",
    kepalaDusun: "",
    tanggalSurat: "",
    nik: "",
    nama: "",
    alamat: "",
    email: "",
    noHandphone: "",
    deskripsi: "",
    fotoKK: null,
    fotoKTP: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Form submitted:", formData);
    // Here you would typically send the data to your API

    setIsSubmitting(false);
    alert("Permohonan surat berhasil diajukan!");
  };

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-900">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6 lg:px-8 pb-24 sm:pb-28 pt-3 sm:pt-4">
        <HeaderCard
          title="Surat Keterangan Belum Bekerja"
          subtitle="Layanan Publik"
          backUrl="/masyarakat/layanan-publik"
          showBackButton={true}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notice */}
          <div className="rounded-3xl border border-red-100 bg-white/95 px-4 py-4 shadow ring-1 ring-red-200">
            <p className="text-sm font-semibold text-red-700">Lengkapi penuh pertanyaan berikut......</p>
          </div>

          {/* Jenis Surat */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Jenis Surat
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Jenis Surat"
              value={formData.jenisSurat}
              onChange={(e) => handleInputChange("jenisSurat", e.target.value)}
              required
            />
          </div>

          {/* Kepala Dusun */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Kepala Dusun
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Kepala Dusun"
              value={formData.kepalaDusun}
              onChange={(e) => handleInputChange("kepalaDusun", e.target.value)}
              required
            />
          </div>

          {/* Tanggal Surat */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tanggal Surat
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.tanggalSurat}
              onChange={(e) => handleInputChange("tanggalSurat", e.target.value)}
              required
            />
          </div>

          {/* NIK */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              NIK
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input NIK"
              value={formData.nik}
              onChange={(e) => handleInputChange("nik", e.target.value)}
              required
            />
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Nama"
              value={formData.nama}
              onChange={(e) => handleInputChange("nama", e.target.value)}
              required
            />
          </div>

          {/* Alamat */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Alamat
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Alamat"
              value={formData.alamat}
              onChange={(e) => handleInputChange("alamat", e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          {/* No Handphone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              No Handphone
            </label>
            <input
              type="tel"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input No Handphone"
              value={formData.noHandphone}
              onChange={(e) => handleInputChange("noHandphone", e.target.value)}
              required
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Input Deskripsi"
              value={formData.deskripsi}
              onChange={(e) => handleInputChange("deskripsi", e.target.value)}
              required
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            {/* Foto/Scan KK */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto/Scan KK
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKK"
                  onChange={(e) => handleFileChange("fotoKK", e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fotoKK"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoKK ? formData.fotoKK.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>

            {/* Foto/Scan KTP */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto/Scan KTP
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKTP"
                  onChange={(e) => handleFileChange("fotoKTP", e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fotoKTP"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoKTP ? formData.fotoKTP.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-green-500 px-6 py-4 text-sm font-semibold text-white shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "MENGIRIM..." : "SIMPAN"}
          </button>
        </form>
      </div>

      <BottomNavigation />
    </main>
  );
}

type IconProps = {
  className?: string;
};

function HomeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 12.5v8.5h13v-8.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function HistoryIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v6h6" />
      <path d="M21 12a9 9 0 1 0-3.27 6.92" />
      <path d="M12 7v5l3 1.5" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c2-4 6-6 8-6s6 2 8 6" />
    </svg>
  );
}

function DocumentIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}


