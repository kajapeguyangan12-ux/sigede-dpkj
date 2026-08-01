const fs = require('fs');
const path = require('path');

const masyarakatDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat';

function getCorrectImportPath(filePath) {
  // Calculate depth relative to masyarakat folder
  const depth = (filePath.match(/\\/g) || []).length - masyarakatDir.match(/\\/g).length;
  
  if (depth === 1) {
    return '../../components/BottomNavigation';
  } else if (depth === 2) {
    return '../../../components/BottomNavigation';
  } else if (depth === 3) {
    return '../../../../components/BottomNavigation';
  } else if (depth === 4) {
    return '../../../../../components/BottomNavigation';
  } else {
    return '../'.repeat(depth) + 'components/BottomNavigation';
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'page.tsx') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check if file has BottomNavigation component but no import
        if (content.includes('<BottomNavigation') && !content.includes('import BottomNavigation')) {
          const importPath = getCorrectImportPath(filePath);
          const importStatement = `import BottomNavigation from "${importPath}";\n`;
          
          // Find the last import statement and add after it
          const lastImportRegex = /import.*from ['"].*['"];\n/g;
          const matches = [...content.matchAll(lastImportRegex)];
          
          if (matches.length > 0) {
            const lastImport = matches[matches.length - 1];
            const insertPos = lastImport.index + lastImport[0].length;
            const updated = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
            
            fs.writeFileSync(filePath, updated, 'utf-8');
            const relativePath = filePath.replace(masyarakatDir, '').replace(/\\/g, '/');
            console.log(`✓ Added import: ${relativePath}`);
          }
        }
      } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

console.log('Adding missing BottomNavigation imports...\n');
processDirectory(masyarakatDir);
console.log('\n✓ Done!');
