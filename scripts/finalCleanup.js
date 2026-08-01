#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-perkawinan\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-kematian\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\paket-akta-perceraian\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\kartu-keluarga\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-pindah-domisili\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\surat-akta-lainnya\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik\\akta-surat-lainnya\\page.tsx',
];

function removeCustomHeader(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalLen = content.length;
    
    // Pattern to match the entire custom header and back button section
    // This finds from the opening comment to the closing div of back button
    const pattern = /\s*\{\/\* Dashboard Style Header \*\/\s*[\s\S]*?\{\/\* Back Button \*\/\s*[\s\S]*?<\/div>\s*\}\s*\n/;
    
    content = content.replace(pattern, '\n');
    
    if (content.length !== originalLen) {
      fs.writeFileSync(filePath, content, 'utf8');
      const fileName = path.basename(path.dirname(filePath));
      console.log(`✓ Fixed: ${fileName}`);
      return true;
    }
  } catch (err) {
    console.error(`✗ Error: ${err.message}`);
  }
  return false;
}

console.log('Removing custom headers...\n');

let fixed = 0;
for (const filePath of files) {
  if (fs.existsSync(filePath)) {
    if (removeCustomHeader(filePath)) {
      fixed++;
    }
  }
}

console.log(`\n✓ Total fixed: ${fixed}/${files.length}`);
