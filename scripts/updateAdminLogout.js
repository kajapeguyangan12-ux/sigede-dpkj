/**
 * Script to update all admin pages to use centralized logout helper
 * Run with: node scripts/updateAdminLogout.js
 */

const fs = require('fs');
const path = require('path');

const adminPagesDir = path.join(__dirname, '../src/app/admin');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if file already has the import
  if (!content.includes("handleAdminLogout")) {
    // Add import after AuthContext import
    const authContextImport = /import { useAuth } from ['"].*AuthContext['"];/;
    if (authContextImport.test(content)) {
      content = content.replace(
        authContextImport,
        (match) => `${match}\nimport { handleAdminLogout } from '../../../lib/logoutHelper';`
      );
      modified = true;
    }
  }

  // Replace old handleLogout patterns with new one
  const oldPattern1 = /const handleLogout = async \(\) => \{\s*try \{\s*await logout\('admin'\);\s*\} catch \(error\) \{\s*console\.error\('Logout error:', error\);\s*\}\s*\};/gs;
  const oldPattern2 = /const handleLogout = async \(\) => \{\s*await logout\('admin'\);\s*\};/gs;
  const oldPattern3 = /\tconst handleLogout = async \(\) => \{\s*try \{\s*\t\tawait logout\('admin'\);\s*\t\} catch \(error\) \{\s*\t\tconsole\.error\('Logout error:', error\);\s*\t\}\s*\};/gs;

  const newLogout = `const handleLogout = async () => {\n    await handleAdminLogout(() => logout('admin'));\n  };`;

  if (oldPattern1.test(content)) {
    content = content.replace(oldPattern1, newLogout);
    modified = true;
  }
  if (oldPattern2.test(content)) {
    content = content.replace(oldPattern2, newLogout);
    modified = true;
  }
  if (oldPattern3.test(content)) {
    content = content.replace(oldPattern3, newLogout);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      updatedCount += scanDirectory(fullPath);
    } else if (file === 'page.tsx' && fullPath.includes('admin')) {
      if (updateFile(fullPath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

console.log('🔄 Starting admin logout update...\n');
const count = scanDirectory(adminPagesDir);
console.log(`\n✅ Updated ${count} files`);
