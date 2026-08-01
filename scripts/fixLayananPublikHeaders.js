const fs = require('fs');
const path = require('path');

const layananPublikPath = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik';

// Map nama folder ke judul halaman
const folderToTitle = {
  'paket-akta-lahir': 'Paket Akta Lahir',
  'paket-akta-perkawinan': 'Paket Akta Perkawinan',
  'paket-akta-perceraian': 'Paket Akta Perceraian',
  'paket-akta-kematian': 'Paket Akta Kematian',
  'kartu-keluarga': 'Kartu Keluarga',
  'surat-pindah-domisili': 'Surat Pindah Domisili',
  'akta-surat-lainnya': 'Akta/Surat Lainnya',
  'ktp-elektronik-denpasar': 'KTP Elektronik Denpasar',
  'kartu-identitas-anak': 'Kartu Identitas Anak',
  'surat-akta-lainnya': 'Surat Akta Lainnya',
  'surat-kelakuan-baik': 'Surat Kelakuan Baik',
  'surat-keterangan-belum-bekerja': 'Surat Keterangan Belum Bekerja',
  'surat-keterangan-belum-nikah': 'Surat Keterangan Belum Nikah',
  'surat-keterangan-kawin-menikah': 'Surat Keterangan Kawin/Menikah',
  'surat-keterangan-kematian': 'Surat Keterangan Kematian',
};

function hasCustomHeader(content) {
  return content.includes('const DesaLogo') && content.includes('const BgdLogo');
}

function removeCustomHeaderSection(content) {
  // Remove const definitions for logos
  let result = content.replace(/const DesaLogo = ".*?";\n/g, '');
  result = result.replace(/const BgdLogo = ".*?";\n/g, '');
  
  // Remove the Dashboard Style Header div section
  const headerPattern = /\{\/\* Dashboard Style Header \*\/[\s\S]*?<\/div>\s*\}\n\s*\{\/\* Back Button \*\/[\s\S]*?<\/div>\s*\}\n/;
  result = result.replace(headerPattern, '');
  
  return result;
}

function addHeaderCardImport(content) {
  if (content.includes('import HeaderCard')) {
    return content;
  }
  
  // Find the line with import BottomNavigation and add HeaderCard import after it
  if (content.includes('import BottomNavigation')) {
    return content.replace(
      /import BottomNavigation from.*?;/,
      `$&\nimport HeaderCard from '../../../components/HeaderCard';`
    );
  }
  
  // If no BottomNavigation, add after first import
  return content.replace(
    /import.*? from "react";\n/,
    `$&import HeaderCard from '../../../components/HeaderCard';\n`
  );
}

function addHeaderCard(content, title) {
  // Find the main return statement and the div after it
  const mainReturnPattern = /return \(\s*<main[^>]*>\s*<div[^>]*>\s*/;
  
  if (!mainReturnPattern.test(content)) {
    return content;
  }
  
  // Insert HeaderCard after the opening divs
  return content.replace(
    mainReturnPattern,
    (match) => {
      return match + `<HeaderCard title="${title}" backUrl="/masyarakat/layanan-publik" />\n\n        `;
    }
  );
}

function fixFile(filePath, folderName) {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    if (!hasCustomHeader(fileContent)) {
      console.log(`✓ Sudah diperbaiki: ${folderName}`);
      return true;
    }
    
    // Get title from folder name
    const title = folderToTitle[folderName];
    if (!title) {
      console.log(`⚠ Folder tidak dikenal: ${folderName}`);
      return false;
    }
    
    // Add HeaderCard import
    fileContent = addHeaderCardImport(fileContent);
    
    // Remove custom header
    fileContent = removeCustomHeaderSection(fileContent);
    
    // Add HeaderCard component
    fileContent = addHeaderCard(fileContent, title);
    
    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`✓ Fixed: ${folderName}`);
    return true;
  } catch (err) {
    console.error(`✗ Error fixing ${folderName}:`, err.message);
    return false;
  }
}

console.log('Fixing all headers in layanan-publik...\n');

const dirs = fs.readdirSync(layananPublikPath);
let fixed = 0;
let skipped = 0;

for (const dir of dirs) {
  const dirPath = path.join(layananPublikPath, dir);
  const stat = fs.statSync(dirPath);
  
  if (stat.isDirectory() && dir !== 'pelayanan-taring-dukcapil') {
    const pageFile = path.join(dirPath, 'page.tsx');
    if (fs.existsSync(pageFile)) {
      if (fixFile(pageFile, dir)) {
        fixed++;
      } else {
        skipped++;
      }
    }
  }
}

console.log(`\n✓ Fixed: ${fixed}`);
console.log(`⚠ Skipped: ${skipped}`);
console.log('Done!');
