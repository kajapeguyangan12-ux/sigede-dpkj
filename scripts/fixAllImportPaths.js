const fs = require('fs');
const path = require('path');

const srcPath = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat';

function getImportDepth(filePath) {
  // Calculate how many directories deep from /src/app
  const rel = path.relative('d:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app', filePath);
  const depth = rel.split(path.sep).length - 1; // -1 for the filename
  // Components are at src/app/components, so we need depth number of ../
  const dotsNeeded = depth;
  return '../'.repeat(dotsNeeded) + 'components';
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Calculate the correct import path
    const correctPath = getImportDepth(filePath);
    
    // Replace any incorrect BottomNavigation imports
    content = content.replace(
      /from ['"](\.\.\/?)+components\/BottomNavigation['"]/g,
      `from '${correctPath}/BottomNavigation'`
    );
    
    // Also ensure the import exists if not there
    if (content.includes('BottomNavigation') && !content.includes('import BottomNavigation')) {
      const firstImport = content.match(/import\s+\w+\s+from/);
      if (firstImport) {
        content = content.replace(
          firstImport[0],
          `import BottomNavigation from '${correctPath}/BottomNavigation';\n${firstImport[0]}`
        );
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
  } catch (err) {
    console.error(`✗ Error fixing ${filePath}:`, err.message);
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file === 'page.tsx') {
      fixFile(fullPath);
    }
  }
}

console.log('Fixing all import paths in masyarakat...\n');
walkDir(srcPath);
console.log('\nDone!');
