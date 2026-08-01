const fs = require('fs');
const path = require('path');

const masyarakatDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat';

function fixMissingImport(content, filePath) {
  // Check if file has BottomNavigation component but no import
  if (content.includes('<BottomNavigation />') && !content.includes('import BottomNavigation from')) {
    let newContent = content;
    
    // Determine the correct import path based on file depth
    const depth = (filePath.match(/[\\\/]/g) || []).length;
    const masyarakatDepth = masyarakatDir.split(/[\\\/]/).length;
    const fileDepth = filePath.split(/[\\\/]/).length;
    const levelDiff = fileDepth - masyarakatDepth;
    
    let importPath = '';
    if (levelDiff === 1) {
      importPath = '../../components/BottomNavigation';
    } else if (levelDiff === 2) {
      importPath = '../../../components/BottomNavigation';
    } else if (levelDiff === 3) {
      importPath = '../../../../components/BottomNavigation';
    } else if (levelDiff >= 4) {
      importPath = '../'.repeat(levelDiff - 1) + 'components/BottomNavigation';
    }
    
    // Add import after HeaderCard import
    if (newContent.includes('import HeaderCard from')) {
      newContent = newContent.replace(
        /import HeaderCard from ['"].*['"]\n/,
        match => match + `import BottomNavigation from "${importPath}";\n`
      );
      return newContent;
    } else {
      // If HeaderCard is not found, add after other imports
      const lastImportMatch = newContent.match(/import.*from ['"].*['"];\n/g);
      if (lastImportMatch && lastImportMatch.length > 0) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        newContent = newContent.replace(
          lastImport,
          lastImport + `import BottomNavigation from "${importPath}";\n`
        );
        return newContent;
      }
    }
  }
  
  return content;
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
        const updated = fixMissingImport(content, filePath);
        
        if (updated !== content) {
          fs.writeFileSync(filePath, updated, 'utf-8');
          console.log(`✓ Fixed import in: ${filePath}`);
        }
      } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

console.log('Fixing missing BottomNavigation imports...\n');
processDirectory(masyarakatDir);
console.log('\n✓ Done!');
