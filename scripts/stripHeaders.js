#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePaths = [
  'src/app/masyarakat/layanan-publik/paket-akta-perkawinan/page.tsx',
  'src/app/masyarakat/layanan-publik/paket-akta-kematian/page.tsx',
  'src/app/masyarakat/layanan-publik/paket-akta-perceraian/page.tsx',
  'src/app/masyarakat/layanan-publik/kartu-keluarga/page.tsx',
  'src/app/masyarakat/layanan-publik/surat-akta-lainnya/page.tsx',
  'src/app/masyarakat/layanan-publik/akta-surat-lainnya/page.tsx',
];

function stripCustomHeader(content) {
  // Match the Dashboard Style Header block through Back Button block
  // More specific pattern that handles varying whitespace
  const regex = /\n\s*\{\s*\/\*\s*Dashboard Style Header\s*\*\/[\s\S]*?\{\s*\/\*\s*Back Button\s*\*\/[\s\S]*?<\/div>\s*\}\s*\n/;
  
  const newContent = content.replace(regex, '\n');
  return newContent;
}

console.log('Stripping custom headers from files...\n');

let processedCount = 0;
filePaths.forEach(filePath => {
  const fullPath = path.join('d:\\Nextjs\\backup\\SiPeka\\peguyangan', filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalSize = content.length;
    
    content = stripCustomHeader(content);
    
    if (content.length < originalSize) {
      fs.writeFileSync(fullPath, content, 'utf8');
      const folderName = path.basename(path.dirname(filePath));
      console.log(`✓ Fixed: ${folderName}`);
      processedCount++;
    } else {
      const folderName = path.basename(path.dirname(filePath));
      console.log(`- No changes: ${folderName}`);
    }
  } else {
    console.log(`✗ Not found: ${filePath}`);
  }
});

console.log(`\n✓ Total processed: ${processedCount}`);
