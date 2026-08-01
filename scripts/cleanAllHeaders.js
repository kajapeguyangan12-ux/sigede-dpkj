#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const layananPublikPath = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik';

const folders = [
  'paket-akta-perkawinan',
  'paket-akta-perceraian', 
  'paket-akta-kematian',
  'kartu-keluarga',
  'surat-pindah-domisili',
  'surat-akta-lainnya',
  'akta-surat-lainnya'
];

function cleanHeaderInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLength = content.length;
  
  // Remove the entire Dashboard Header section and Back Button section
  const pattern = /\{\/\* Dashboard Style Header \*\/[\s\S]*?\{\/\* Back Button \*\/[\s\S]*?<\/div>\s*\}\n\s*/;
  content = content.replace(pattern, '');
  
  if (content.length < originalLength) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

console.log('Cleaning up header sections...\n');

let cleaned = 0;
for (const folder of folders) {
  const filePath = path.join(layananPublikPath, folder, 'page.tsx');
  if (fs.existsSync(filePath)) {
    if (cleanHeaderInFile(filePath)) {
      console.log(`✓ Cleaned: ${folder}`);
      cleaned++;
    } else {
      console.log(`- Already clean: ${folder}`);
    }
  } else {
    console.log(`✗ Not found: ${folder}`);
  }
}

console.log(`\n✓ Total cleaned: ${cleaned}`);
