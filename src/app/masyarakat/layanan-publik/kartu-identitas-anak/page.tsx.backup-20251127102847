"use client";

import { useState } from "react";
import BottomNavigation from '../../../components/BottomNavigation';
import Link from "next/link";
import HeaderCard from "../../../components/HeaderCard";

type FormData = {
  jenisPermohonan: string;
  nikAnak: string;
  namaLengkapAnak: string;
  tempatLahirAnak: string;
  tanggalLahirAnak: string;
  jenisKelaminAnak: string;
  anakKe: string;
  tinggiBadan: string;
  beratBadan: string;
  alamatLengkap: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  namaAyah: string;
  nikAyah: string;
  tempatLahirAyah: string;
  tanggalLahirAyah: string;
  pekerjaanAyah: string;
  namaIbu: string;
  nikIbu: string;
  tempatLahirIbu: string;
  tanggalLahirIbu: string;
  pekerjaanIbu: string;
  noKk: string;
  email: string;
  noHandphone: string;
  fotoAktaLahir: File | null;
  fotoKtpAyah: File | null;
  fotoKtpIbu: File | null;
  fotoKk: File | null;
  fotoAnak: File | null;
};

const jenisKelaminOptions = ["Laki-laki", "Perempuan"];

export default function KartuIdentitasAnakPage() {
  const [formData, setFormData] = useState<FormData>({
    jenisPermohonan: "Baru",
    nikAnak: "",
    namaLengkapAnak: "",
    tempatLahirAnak: "",
    tanggalLahirAnak: "",
    jenisKelaminAnak: "",
    anakKe: "",
    tinggiBadan: "",
    beratBadan: "",
    alamatLengkap: "",
    rt: "",
    rw: "",
    kelurahan: "",
    kecamatan: "",
    kota: "Denpasar",
    provinsi: "Bali",
    kodePos: "",
    namaAyah: "",
    nikAyah: "",
    tempatLahirAyah: "",
    tanggalLahirAyah: "",
    pekerjaanAyah: "",
    namaIbu: "",
    nikIbu: "",
    tempatLahirIbu: "",
    tanggalLahirIbu: "",
    pekerjaanIbu: "",
    noKk: "",
    email: "",
    noHandphone: "",
    fotoAktaLahir: null,
    fotoKtpAyah: null,
    fotoKtpIbu: null,
    fotoKk: null,
    fotoAnak: null,
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
    alert("Permohonan Kartu Identitas Anak berhasil diajukan!");
  };

  return (
    <main className="min-h-[100svh] bg-red-50 text-gray-900">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        <HeaderCard
          title="Kartu Identitas Anak"
          subtitle="Layanan Publik"
          backUrl="/masyarakat/layanan-publik/pelayanan-taring-dukcapil"
          showBackButton={true}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notice */}
          <div className="rounded-3xl border border-red-100 bg-white/95 px-4 py-4 shadow ring-1 ring-red-200">
            <p className="text-sm font-semibold text-red-700">Lengkapi penuh pertanyaan berikut untuk permohonan Kartu Identitas Anak......</p>
          </div>

          {/* Jenis Permohonan */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Jenis Permohonan
            </label>
            <select
              className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={formData.jenisPermohonan}
              onChange={(e) => handleInputChange("jenisPermohonan", e.target.value)}
              required
            >
              <option value="Baru">Baru</option>
              <option value="Perpanjangan">Perpanjangan</option>
              <option value="Penggantian">Penggantian</option>
            </select>
          </div>

          {/* Data Anak */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Anak</h3>

            {/* NIK & Nama Anak */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  NIK Anak *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="NIK Anak"
                  value={formData.nikAnak}
                  onChange={(e) => handleInputChange("nikAnak", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Anak Ke-
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Anak ke-"
                  value={formData.anakKe}
                  onChange={(e) => handleInputChange("anakKe", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Nama Lengkap Anak */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nama Lengkap Anak *
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nama Lengkap Anak"
                value={formData.namaLengkapAnak}
                onChange={(e) => handleInputChange("namaLengkapAnak", e.target.value)}
                required
              />
            </div>

            {/* Tempat & Tanggal Lahir Anak */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Tempat Lahir"
                  value={formData.tempatLahirAnak}
                  onChange={(e) => handleInputChange("tempatLahirAnak", e.target.value)}
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
                  value={formData.tanggalLahirAnak}
                  onChange={(e) => handleInputChange("tanggalLahirAnak", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Jenis Kelamin & Tinggi Badan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Jenis Kelamin *
                </label>
                <select
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.jenisKelaminAnak}
                  onChange={(e) => handleInputChange("jenisKelaminAnak", e.target.value)}
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
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Tinggi Badan"
                  value={formData.tinggiBadan}
                  onChange={(e) => handleInputChange("tinggiBadan", e.target.value)}
                />
              </div>
            </div>

            {/* Berat Badan */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Berat Badan (kg)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Berat Badan"
                value={formData.beratBadan}
                onChange={(e) => handleInputChange("beratBadan", e.target.value)}
              />
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

          {/* Data Ayah */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Ayah</h3>

            {/* NIK & Nama Ayah */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  NIK Ayah *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="NIK Ayah"
                  value={formData.nikAyah}
                  onChange={(e) => handleInputChange("nikAyah", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Ayah *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nama Lengkap Ayah"
                  value={formData.namaAyah}
                  onChange={(e) => handleInputChange("namaAyah", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tempat & Tanggal Lahir Ayah */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempat Lahir Ayah *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Tempat Lahir Ayah"
                  value={formData.tempatLahirAyah}
                  onChange={(e) => handleInputChange("tempatLahirAyah", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Lahir Ayah *
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.tanggalLahirAyah}
                  onChange={(e) => handleInputChange("tanggalLahirAyah", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pekerjaan Ayah */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pekerjaan Ayah *
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Pekerjaan Ayah"
                value={formData.pekerjaanAyah}
                onChange={(e) => handleInputChange("pekerjaanAyah", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data Ibu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Ibu</h3>

            {/* NIK & Nama Ibu */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  NIK Ibu *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="NIK Ibu"
                  value={formData.nikIbu}
                  onChange={(e) => handleInputChange("nikIbu", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama Ibu *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nama Lengkap Ibu"
                  value={formData.namaIbu}
                  onChange={(e) => handleInputChange("namaIbu", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tempat & Tanggal Lahir Ibu */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tempat Lahir Ibu *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Tempat Lahir Ibu"
                  value={formData.tempatLahirIbu}
                  onChange={(e) => handleInputChange("tempatLahirIbu", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tanggal Lahir Ibu *
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.tanggalLahirIbu}
                  onChange={(e) => handleInputChange("tanggalLahirIbu", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pekerjaan Ibu */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pekerjaan Ibu *
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Pekerjaan Ibu"
                value={formData.pekerjaanIbu}
                onChange={(e) => handleInputChange("pekerjaanIbu", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data Keluarga */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Data Keluarga</h3>

            {/* No KK */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nomor Kartu Keluarga (KK) *
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nomor KK"
                value={formData.noKk}
                onChange={(e) => handleInputChange("noKk", e.target.value)}
                required
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
                  Email Orang Tua *
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Email Orang Tua"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  No Handphone Orang Tua *
                </label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="No Handphone Orang Tua"
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

            {/* Foto Akta Lahir */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto Akta Lahir Anak *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoAktaLahir"
                  onChange={(e) => handleFileChange("fotoAktaLahir", e.target.files?.[0] || null)}
                  required
                />
                <label
                  htmlFor="fotoAktaLahir"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoAktaLahir ? formData.fotoAktaLahir.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>

            {/* Foto KTP Ayah */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto KTP Ayah *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKtpAyah"
                  onChange={(e) => handleFileChange("fotoKtpAyah", e.target.files?.[0] || null)}
                  required
                />
                <label
                  htmlFor="fotoKtpAyah"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoKtpAyah ? formData.fotoKtpAyah.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>

            {/* Foto KTP Ibu */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Foto KTP Ibu *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  id="fotoKtpIbu"
                  onChange={(e) => handleFileChange("fotoKtpIbu", e.target.files?.[0] || null)}
                  required
                />
                <label
                  htmlFor="fotoKtpIbu"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoKtpIbu ? formData.fotoKtpIbu.name : "Pilih file"}
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
                  id="fotoKk"
                  onChange={(e) => handleFileChange("fotoKk", e.target.files?.[0] || null)}
                  required
                />
                <label
                  htmlFor="fotoKk"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoKk ? formData.fotoKk.name : "Pilih file"}
                  </span>
                </label>
              </div>
            </div>

            {/* Pas Foto Anak */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pas Foto Anak 3x4 (Background Merah) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="fotoAnak"
                  onChange={(e) => handleFileChange("fotoAnak", e.target.files?.[0] || null)}
                  required
                />
                <label
                  htmlFor="fotoAnak"
                  className="flex items-center gap-2 rounded-xl border border-red-100 bg-white/95 px-4 py-3 text-sm shadow-sm ring-1 ring-red-200 cursor-pointer hover:bg-red-50 transition"
                >
                  <DocumentIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">
                    {formData.fotoAnak ? formData.fotoAnak.name : "Pilih file"}
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


