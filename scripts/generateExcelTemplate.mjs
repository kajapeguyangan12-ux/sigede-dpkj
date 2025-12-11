/**
 * Script untuk generate template Excel untuk upload data warga
 * Run: node scripts/generateExcelTemplate.mjs
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contoh data yang valid - GUNAKAN PENULISAN JUDUL INI
const contohData = [
  {
    'No KK': '1234567890123456',
    'NIK': '1234567890123456',
    'Nama Lengkap': 'I WAYAN CONTOH',
    'Jenis Kelamin': 'Laki-laki',
    'Tempat Lahir': 'Denpasar',
    'Tanggal Lahir': '01-01-1980',
    'Alamat': 'JL.CONTOH NO.1',
    'Daerah': 'WANGAYA_KAJA',
    'Status Nikah': 'Kawin',
    'Agama': 'Hindu',
    'Suku Bangsa': 'Bali',
    'Kewarganegaraan': 'WNI',
    'Pendidikan Terakhir': 'SMA',
    'Pekerjaan': 'Wiraswasta',
    'Penghasilan': '3000000-5000000',
    'Golongan Darah': 'A',
    'SHDK': 'Kepala Keluarga',
    'Desil': '1'
  },
  {
    'No KK': '1234567890123456',
    'NIK': '1234567890123457',
    'Nama Lengkap': 'NI MADE DUMMY',
    'Jenis Kelamin': 'Perempuan',
    'Tempat Lahir': 'Denpasar',
    'Tanggal Lahir': '15-06-1985',
    'Alamat': 'JL.CONTOH NO.1',
    'Daerah': 'WANGAYA_KAJA',
    'Status Nikah': 'Kawin',
    'Agama': 'Hindu',
    'Suku Bangsa': 'Bali',
    'Kewarganegaraan': 'WNI',
    'Pendidikan Terakhir': 'S1',
    'Pekerjaan': 'Guru',
    'Penghasilan': '3000000-5000000',
    'Golongan Darah': 'B',
    'SHDK': 'Istri',
    'Desil': '2'
  },
  {
    'No KK': '1234567890123456',
    'NIK': '1234567890123458',
    'Nama Lengkap': 'I KETUT SAMPLE',
    'Jenis Kelamin': 'Laki-laki',
    'Tempat Lahir': 'Denpasar',
    'Tanggal Lahir': '20-03-2010',
    'Alamat': 'JL.CONTOH NO.1',
    'Daerah': 'WANGAYA_KAJA',
    'Status Nikah': 'Belum Kawin',
    'Agama': 'Hindu',
    'Suku Bangsa': 'Bali',
    'Kewarganegaraan': 'WNI',
    'Pendidikan Terakhir': 'SMP',
    'Pekerjaan': 'Pelajar',
    'Penghasilan': '0-1000000',
    'Golongan Darah': 'O',
    'SHDK': 'Anak',
    'Desil': '2'
  }
];

// Data instruksi untuk sheet terpisah
const instruksiData = [
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '=== PENTING: JANGAN UBAH NAMA KOLOM DI BARIS HEADER ===' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PENULISAN JUDUL KOLOM YANG BENAR:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'Gunakan PERSIS seperti ini (dengan spasi dan huruf besar/kecil):' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- No KK (bukan noKK, NoKK, atau No. KK)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- NIK (bukan nik atau Nik)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Nama Lengkap (bukan namaLengkap atau NAMA LENGKAP)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Jenis Kelamin, Tempat Lahir, Tanggal Lahir, dst' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'KOLOM WAJIB DIISI (TIDAK BOLEH KOSONG):' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '1. No KK - Nomor Kartu Keluarga (16 digit angka)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '2. NIK - Nomor Induk Kependudukan (16 digit angka)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '3. Nama Lengkap - Nama lengkap sesuai KTP (minimal 3 karakter)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'KOLOM OPSIONAL (BISA DIKOSONGKAN):' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Alamat, dst' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'FORMAT TANGGAL LAHIR:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Gunakan format: DD-MM-YYYY (contoh: 25-05-1964)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Atau gunakan format: DD/MM/YYYY (contoh: 25/05/1964)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Excel serial number juga didukung' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PILIHAN JENIS KELAMIN:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Laki-laki' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Perempuan' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PILIHAN DAERAH/BANJAR:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- WANGAYA_KAJA' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- WANGAYA_TENGAH' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- WANGAYA_TIMUR' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- DAUH_PURI' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- LUAR_DPKJ' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PILIHAN STATUS NIKAH:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Kawin' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Belum Kawin' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Cerai Hidup' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Cerai Mati' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PILIHAN AGAMA:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Hindu, Islam, Kristen, Katolik, Buddha, Konghucu' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'PILIHAN SHDK (Status Hubungan Dalam Keluarga):' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Kepala Keluarga' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Istri' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Suami' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '- Anak' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'CATATAN PENTING - AGAR DATA TIDAK NULL:' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ NIK dan No KK harus berupa angka 16 digit (tanpa spasi/tanda kutip)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ JANGAN UBAH nama kolom di baris header (baris pertama)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Gunakan sheet "Template Kosong" untuk mengisi data' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Gunakan sheet "Data Warga" sebagai contoh referensi' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Format NIK: 16 digit tanpa spasi (contoh: 5171042505640001)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Simpan file dalam format .xlsx atau .xls' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Jenis Kelamin: "Laki-laki" atau "Perempuan" (perhatikan huruf)' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '✓ Daerah: WANGAYA_KAJA, WANGAYA_TENGAH, WANGAYA_TIMUR, DAUH_PURI, LUAR_DPKJ' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': '' },
  { 'PETUNJUK PENGISIAN TEMPLATE DATA WARGA': 'LIHAT FILE: DAFTAR_KOLOM_EXCEL.md untuk detail lengkap' },
];

// Buat workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Instruksi
const wsInstruksi = XLSX.utils.json_to_sheet(instruksiData);
wsInstruksi['!cols'] = [{ wch: 80 }]; // Set column width
XLSX.utils.book_append_sheet(wb, wsInstruksi, 'BACA DULU - Instruksi');

// Sheet 2: Template dengan contoh data
const wsData = XLSX.utils.json_to_sheet(contohData);

// Set column widths
wsData['!cols'] = [
  { wch: 18 }, // No KK
  { wch: 18 }, // NIK
  { wch: 25 }, // Nama Lengkap
  { wch: 15 }, // Jenis Kelamin
  { wch: 15 }, // Tempat Lahir
  { wch: 15 }, // Tanggal Lahir
  { wch: 30 }, // Alamat
  { wch: 15 }, // Daerah
  { wch: 15 }, // Status Nikah
  { wch: 10 }, // Agama
  { wch: 12 }, // Suku Bangsa
  { wch: 15 }, // Kewarganegaraan
  { wch: 18 }, // Pendidikan Terakhir
  { wch: 20 }, // Pekerjaan
  { wch: 18 }, // Penghasilan
  { wch: 15 }, // Golongan Darah
  { wch: 18 }, // SHDK
  { wch: 10 }, // Desil
];

XLSX.utils.book_append_sheet(wb, wsData, 'Data Warga');

// Sheet 3: Template kosong untuk diisi
const wsKosong = XLSX.utils.json_to_sheet([
  {
    'No KK': '',
    'NIK': '',
    'Nama Lengkap': '',
    'Jenis Kelamin': '',
    'Tempat Lahir': '',
    'Tanggal Lahir': '',
    'Alamat': '',
    'Daerah': '',
    'Status Nikah': '',
    'Agama': '',
    'Suku Bangsa': '',
    'Kewarganegaraan': '',
    'Pendidikan Terakhir': '',
    'Pekerjaan': '',
    'Penghasilan': '',
    'Golongan Darah': '',
    'SHDK': '',
    'Desil': ''
  }
]);

wsKosong['!cols'] = wsData['!cols']; // Same column widths
XLSX.utils.book_append_sheet(wb, wsKosong, 'Template Kosong');

// Save to file
const outputPath = path.join(__dirname, '..', 'public', 'templates', 'template-data-warga.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Template Excel berhasil dibuat:', outputPath);
console.log('📝 Template berisi 3 sheet:');
console.log('   1. BACA DULU - Instruksi');
console.log('   2. Data Warga (dengan contoh data)');
console.log('   3. Template Kosong (siap diisi)');
