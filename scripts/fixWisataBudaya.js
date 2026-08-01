const fs = require('fs');
const path = require('path');

const files = [
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\wisata-budaya\\budaya\\detail\\[id]\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\wisata-budaya\\budaya\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\wisata-budaya\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\wisata-budaya\\wisata\\detail\\[id]\\page.tsx',
  'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat\\wisata-budaya\\wisata\\page.tsx',
];

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if it has BottomNavigation component but no import
    if (content.includes('<BottomNavigation') && !content.includes('import BottomNavigation')) {
      // Find the right import path based on depth
      let importPath = '';
      if (filePath.includes('\\detail\\')) {
        // wisata-budaya/budaya/detail/[id] or wisata-budaya/wisata/detail/[id]
        importPath = 'import BottomNavigation from "../../../../../components/BottomNavigation";';
      } else if (filePath.includes('\\wisata\\') || filePath.includes('\\budaya\\')) {
        // wisata-budaya/budaya or wisata-budaya/wisata
        importPath = 'import BottomNavigation from "../../../../components/BottomNavigation";';
      } else {
        // wisata-budaya main
        importPath = 'import BottomNavigation from "../../components/BottomNavigation";';
      }
      
      // Add import after the last import statement
      const lastImportMatch = content.match(/import.*from ['"].*['"];\n/g);
      if (lastImportMatch && lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const updated = content.replace(lastImport, lastImport + importPath + '\n');
        
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`✓ Fixed: ${path.basename(path.dirname(filePath))}/page.tsx`);
      }
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
});

console.log('\n✓ Done!');
