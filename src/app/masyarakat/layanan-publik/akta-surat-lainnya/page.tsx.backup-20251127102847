"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BottomNavigation from '../../../components/BottomNavigation';
import HeaderCard from '../../../components/HeaderCard';

type FormData = {
  jenisAktaSurat: string;
  kategoriDokumen: string;
  nomorAktaSurat: string;
  namaPemohon: string;
  nikPemohon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  statusPerkawinan: string;
  pekerjaan: string;
  alamatLengkap: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  keperluan: string;
  tanggalKeperluan: string;
  namaAyah: string;
  namaIbu: string;
  email: string;
  noHandphone: string;
  fotoKTP: File | null;
  fotoKK: File | null;
  fotoAktaLama: File | null;
  fotoDokumenPendukung: File | null;
};

const kategoriDokumenOptions = [
  "Akta Kelahiran",
  "Akta Perkawinan",
  "Akta Perceraian",
  "Akta Kematian",
  "Surat Keterangan",
  "Surat Pernyataan",
  "Surat Kuasa",
  "Surat Kesepakatan",
  "Akta Notaris",
  "Dokumen Lainnya"
];

const jenisKelaminOptions = ["Laki-laki", "Perempuan"];
const statusPerkawinanOptions = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];

export default function AktaSuratLainnyaPage() {
  const [formData, setFormData] = useState<FormData>({
    jenisAktaSurat: "",
    kategoriDokumen: "",
    nomorAktaSurat: "",
    namaPemohon: "",
    nikPemohon: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    statusPerkawinan: "",
    pekerjaan: "",
    alamatLengkap: "",
    rt: "",
    rw: "",
    kelurahan: "",
    kecamatan: "",
    kota: "Denpasar",
    provinsi: "Bali",
    kodePos: "",
    keperluan: "",
    tanggalKeperluan: "",
    namaAyah: "",
    namaIbu: "",
    email: "",
    noHandphone: "",
    fotoKTP: null,
    fotoKK: null,
    fotoAktaLama: null,
    fotoDokumenPendukung: null,
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
    alert("Permohonan akta/surat berhasil diajukan!");
  };

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-900">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard title="Akta/Surat Lainnya" backUrl="/masyarakat/layanan-publik/pelayanan-taring-dukcapil" showBackButton={true} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notice */}
          <div className="rounded-3xl border border-red-100 bg-white/95 px-4 py-4 shadow ring-1 ring-red-200">
            <p className="text-sm font-semibold text-red-700">Lengkapi penuh pertanyaan berikut untuk permohonan Akta/Surat......</p>
          </div>

          {/* Kategori Dokumen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Kategori Dokumen *
            </label>
            <select
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.kategoriDokumen}
              onChange={(e) => handleInputChange("kategoriDokumen", e.target.value)}
              required
            >
              <option value="">Pilih Kategori</option>
              {kategoriDokumenOptions.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Akta/Surat */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Jenis Akta/Surat *
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Contoh: Akta Jual Beli, Surat Izin, dll"
              value={formData.jenisAktaSurat}
              onChange={(e) => handleInputChange("jenisAktaSurat", e.target.value)}
              required
            />
          </div>

          {/* Nomor Akta/Surat (jika ada) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nomor Akta/Surat (jika ada)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Nomor dokumen yang sudah ada"
              value={formData.nomorAktaSurat}
              onChange={(e) => handleInputChange("nomorAktaSurat", e.target.value)}
            />
          </div>

          {/* Data Pemohon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Pemohon</h3>

            {/* NIK & Nama Pemohon */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  NIK Pemohon *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="NIK Pemohon"
                  value={formData.nikPemohon}
                  onChange={(e) => handleInputChange("nikPemohon", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nama Lengkap"
                  value={formData.namaPemohon}
                  onChange={(e) => handleInputChange("namaPemohon", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Tempat Lahir"
                  value={formData.tempatLahir}
                  onChange={(e) => handleInputChange("tempatLahir", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.tanggalLahir}
                  onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Jenis Kelamin & Status Perkawinan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Kelamin *
                </label>
                <select
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.jenisKelamin}
                  onChange={(e) => handleInputChange("jenisKelamin", e.target.value)}
                  required
                >
                  <option value="">Pilih</option>
                  {jenisKelaminOptions.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status Perkawinan *
                </label>
                <select
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.statusPerkawinan}
                  onChange={(e) => handleInputChange("statusPerkawinan", e.target.value)}
                  required
                >
                  <option value="">Pilih</option>
                  {statusPerkawinanOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pekerjaan */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pekerjaan *
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Pekerjaan"
                value={formData.pekerjaan}
                onChange={(e) => handleInputChange("pekerjaan", e.target.value)}
                required
              />
            </div>

            {/* Nama Ayah & Ibu */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Ayah Kandung
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nama Ayah Kandung"
                  value={formData.namaAyah}
                  onChange={(e) => handleInputChange("namaAyah", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Ibu Kandung
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nama Ibu Kandung"
                  value={formData.namaIbu}
                  onChange={(e) => handleInputChange("namaIbu", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Alamat</h3>

            {/* Alamat Lengkap */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Alamat Lengkap *
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Alamat Lengkap"
                value={formData.alamatLengkap}
                onChange={(e) => handleInputChange("alamatLengkap", e.target.value)}
                required
              />
            </div>

            {/* RT/RW */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  RT *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="RT"
                  value={formData.rt}
                  onChange={(e) => handleInputChange("rt", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  RW *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="RW"
                  value={formData.rw}
                  onChange={(e) => handleInputChange("rw", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Kelurahan, Kecamatan, Kota, Provinsi */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kelurahan *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Kelurahan"
                    value={formData.kelurahan}
                    onChange={(e) => handleInputChange("kelurahan", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Kecamatan"
                    value={formData.kecamatan}
                    onChange={(e) => handleInputChange("kecamatan", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kota *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.kota}
                    onChange={(e) => handleInputChange("kota", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.provinsi}
                    onChange={(e) => handleInputChange("provinsi", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Kode Pos"
                    value={formData.kodePos}
                    onChange={(e) => handleInputChange("kodePos", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Keperluan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Keperluan</h3>

            {/* Keperluan & Tanggal Keperluan */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Keperluan Pembuatan Akta/Surat *
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Jelaskan keperluan pembuatan akta/surat ini"
                value={formData.keperluan}
                onChange={(e) => handleInputChange("keperluan", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tanggal Diperlukan
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.tanggalKeperluan}
                onChange={(e) => handleInputChange("tanggalKeperluan", e.target.value)}
              />
            </div>
          </div>

          {/* Kontak */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kontak</h3>

            {/* Email & No Handphone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Email Aktif"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  No Handphone *
                </label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="No Handphone Aktif"
                  value={formData.noHandphone}
                  onChange={(e) => handleInputChange("noHandphone", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Upload Dokumen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload Dokumen</h3>

            {/* Foto KTP */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto KTP Pemohon *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKTP"
                  onChange={(e) => handleFileChange("fotoKTP", e.target.files?.[0] || null)}
                  required
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

            {/* Foto KK */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto Kartu Keluarga *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKK"
                  onChange={(e) => handleFileChange("fotoKK", e.target.files?.[0] || null)}
                  required
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

            {/* Foto Akta Lama */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto Akta/Surat Lama (jika ada)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoAktaLama"
                  onChange={(e) => handleFileChange("fotoAktaLama", e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fotoAktaLama"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoAktaLama ? formData.fotoAktaLama.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>

            {/* Foto Dokumen Pendukung */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto Dokumen Pendukung (Opsional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoDokumenPendukung"
                  onChange={(e) => handleFileChange("fotoDokumenPendukung", e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="fotoDokumenPendukung"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoDokumenPendukung ? formData.fotoDokumenPendukung.name : "Pilih file"}
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

function BackIcon({ className }: IconProps) {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
