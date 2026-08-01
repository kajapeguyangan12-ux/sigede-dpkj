const fs = require('fs');
const path = require('path');

const layananPublikPath = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\layanan-publik';

function removeCustomHeader(content) {
  // Remove Dashboard Style Header section completely
  const dashboardHeaderRegex = /\s*\{\/\* Dashboard Style Header \*\/[\s\S]*?\{\/\* Back Button \*\/[\s\S]*?<\/div>\s*\}\s*\n/;
  let result = content.replace(dashboardHeaderRegex, '');
  
  // Clean up extra whitespace
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return result;
}

function cleanupUnusedLogos(content) {
  // Remove unused DesaLogo and BgdLogo if they're not used elsewhere
  if (!content.includes('src={DesaLogo}') && !content.includes('src={BgdLogo}')) {
    content = content.replace(/const DesaLogo = ".*?";\n/g, '');
    content = content.replace(/const BgdLogo = ".*?";\n/g, '');
  }
  return content;
}

function cleanupUnusedImports(content) {
  // Remove unused imports like Image if HeaderCard is replacing the custom header
  // Check if Image is still used
  if (!content.includes('src={')) {
    content = content.replace(/import Image from "next\/image";\n/g, '');
  }
  return content;
}

function fixFile(filePath, folderName) {
  try {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    const originalContent = fileContent;
    
    // Check if still has old header
    if (!fileContent.includes('Dashboard Style Header')) {
      console.log(`✓ Sudah bersih: ${folderName}`);
      return true;
    }
    
    // Remove custom header
    fileContent = removeCustomHeader(fileContent);
    
    // Clean up unused stuff
    fileContent = cleanupUnusedLogos(fileContent);
    fileContent = cleanupUnusedImports(fileContent);
    
    if (fileContent !== originalContent) {
      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`✓ Fixed: ${folderName}`);
    }
    
    return true;
  } catch (err) {
    console.error(`✗ Error fixing ${folderName}:`, err.message);
    return false;
  }
}

console.log('Removing old custom headers in layanan-publik...\n');

const dirs = fs.readdirSync(layananPublikPath);
let fixed = 0;

for (const dir of dirs) {
  const dirPath = path.join(layananPublikPath, dir);
  const stat = fs.statSync(dirPath);
  
  if (stat.isDirectory() && dir !== 'pelayanan-taring-dukcapil') {
    const pageFile = path.join(dirPath, 'page.tsx');
    if (fs.existsSync(pageFile)) {
      fixFile(pageFile, dir);
      fixed++;
    }
  }
}

console.log(`\n✓ Processed: ${fixed} files`);
console.log('Done!');
