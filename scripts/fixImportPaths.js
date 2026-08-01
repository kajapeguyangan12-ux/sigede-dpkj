const fs = require('fs');
const path = require('path');

const masyarakatDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat';
const appDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app';
const componentsDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\components';

function getCorrectImportPath(filePath) {
  // Get relative path from the file to components directory
  const fileDir = path.dirname(filePath);
  
  // Count how many levels up we need to go to reach app directory
  const relativePath = path.relative(fileDir, componentsDir);
  
  // Convert to forward slashes and return as import path
  return './' + relativePath.replace(/\\/g, '/') + '/BottomNavigation';
}

function fixImportPath(content, filePath) {
  // Check if this file has a BottomNavigation import
  const importMatch = content.match(/import BottomNavigation from ['"].*?['"];/);
  
  if (importMatch) {
    const correctPath = getCorrectImportPath(filePath);
    const currentImport = importMatch[0];
    
    // If path contains more than 5 dots or is otherwise wrong, fix it
    if (currentImport.includes('../../../../../../../') || 
        currentImport.includes('../../../../components/BottomNavigation') ||
        !currentImport.includes('../../../components/BottomNavigation') &&
        filePath.includes('layanan-publik')) {
      
      const newImport = `import BottomNavigation from "../../../components/BottomNavigation";`;
      const updated = content.replace(currentImport, newImport);
      return updated;
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
        
        // Fix incorrect import paths
        if (content.includes('import BottomNavigation from')) {
          // For layanan-publik/* level files
          if (filePath.includes('layanan-publik') && !filePath.includes('\\layanan-publik\\')) {
            // This is a sublevel under layanan-publik
            const updated = content.replace(
              /import BottomNavigation from ['"].*?['"];/,
              'import BottomNavigation from "../../../components/BottomNavigation";'
            );
            if (updated !== content) {
              fs.writeFileSync(filePath, updated, 'utf-8');
              console.log(`✓ Fixed: ${filePath}`);
            }
          }
        }
      } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

console.log('Fixing import paths...\n');
processDirectory(masyarakatDir);
console.log('\n✓ Done!');
