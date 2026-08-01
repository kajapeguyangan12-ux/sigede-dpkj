const fs = require('fs');
const path = require('path');

const masyarakatDir = 'd:\\Nextjs\\backup\\SiPeka\\peguyangan\\src\\app\\masyarakat';

// Pattern untuk nav custom yang akan diganti
const navPattern = /<nav className="fixed inset-x-0 bottom-0[\s\S]*?<\/nav>\s*<\/main>/m;

// Replacement: menambahkan import BottomNavigation dan mengganti nav
function replaceNav(content, filePath) {
  // Check if file already has BottomNavigation import
  if (content.includes('import BottomNavigation from')) {
    console.log(`✓ ${filePath} - Already has BottomNavigation import`);
    return content;
  }

  // Tambahkan import BottomNavigation
  let newContent = content;
  
  // Find where to add import (after other imports)
  const importMatch = content.match(/import.*from ['"].*['"]\n/);
  if (importMatch) {
    // Find the right place to add import based on the depth
    if (content.includes('../../components/HeaderCard')) {
      newContent = newContent.replace(
        /import HeaderCard from ['"].*HeaderCard['"];/,
        `import HeaderCard from "../../components/HeaderCard";\nimport BottomNavigation from "../../components/BottomNavigation";`
      );
    } else if (content.includes('../../../components/HeaderCard')) {
      newContent = newContent.replace(
        /import HeaderCard from ['"].*HeaderCard['"];/,
        `import HeaderCard from "../../../components/HeaderCard";\nimport BottomNavigation from "../../../components/BottomNavigation";`
      );
    }
  }

  // Replace custom nav dengan BottomNavigation component
  if (newContent.match(navPattern)) {
    newContent = newContent.replace(
      navPattern,
      `<BottomNavigation />
    </main>`
    );
    return newContent;
  }

  return content;
}

// Recursive function to find and process all page.tsx files
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
        
        if (content.includes('<nav className="fixed inset-x-0 bottom-0')) {
          const updated = replaceNav(content, filePath);
          
          if (updated !== content) {
            fs.writeFileSync(filePath, updated, 'utf-8');
            console.log(`✓ Updated: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

console.log('Starting to replace custom navigation with BottomNavigation...\n');
processDirectory(masyarakatDir);
console.log('\n✓ Done!');
