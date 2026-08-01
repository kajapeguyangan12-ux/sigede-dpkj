const fs = require('fs');
const path = require('path');

const files = [
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\akta-surat-lainnya\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\kartu-identitas-anak\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\kartu-keluarga\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\ktp-elektronik-denpasar\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-kematian\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-lahir\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-perceraian\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-perkawinan\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\pelayanan-taring-dukcapil\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-akta-lainnya\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-kelakuan-baik\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-keterangan-belum-bekerja\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-keterangan-belum-nikah\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-keterangan-kawin-menikah\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-keterangan-kematian\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-keterangan-perjalanan\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-pindah-domisili\\page.tsx',
];

const correctImport = 'import BottomNavigation from "../../../components/BottomNavigation";';

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace any BottomNavigation import with the correct one
    const updated = content.replace(
      /import BottomNavigation from ['"].*?['"];/,
      correctImport
    );
    
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`✓ Fixed: ${path.basename(filePath)}`);
    } else {
      console.log(`- No change needed: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`✗ Error: ${path.basename(filePath)} - ${error.message}`);
  }
});

console.log('\n✓ Done!');
