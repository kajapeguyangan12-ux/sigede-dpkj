/**
 * Fix all admin pages to use handleAdminLogout
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/admin/kelola-pengguna/page.tsx',
  'src/app/admin/profil-desa/wilayah/page.tsx',
  'src/app/admin/profil-desa/struktur-simplified/page.tsx',
  'src/app/admin/profil-desa/struktur/page.tsx',
  'src/app/admin/profil-desa/sejarah/page.tsx',
  'src/app/admin/keuangan/page.tsx',
];

function fixFile(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  console.log(`\n📝 Processing: ${relativePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Step 1: Remove old Firebase auth imports
  const oldImports = [
    /import { signOut } from ["']firebase\/auth["'];?\s*/g,
    /import { auth } from ["'].*firebase["'];?\s*/g,
  ];

  oldImports.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });

  // Step 2: Add new imports after useRouter or similar
  if (!content.includes('handleAdminLogout')) {
    // Find import section and add our imports
    const routerImport = /import { useRouter } from ['"]next\/navigation['"];/;
    if (routerImport.test(content)) {
      content = content.replace(
        routerImport,
        (match) => `${match}\nimport { useAuth } from '../../../contexts/AuthContext';\nimport { handleAdminLogout } from '../../../lib/logoutHelper';`
      );
      modified = true;
    } else {
      // Try finding after first import
      const firstImport = /^import .* from .*;$/m;
      if (firstImport.test(content)) {
        content = content.replace(
          firstImport,
          (match) => `${match}\nimport { useAuth } from '../../../contexts/AuthContext';\nimport { handleAdminLogout } from '../../../lib/logoutHelper';`
        );
        modified = true;
      }
    }
  }

  // Step 3: Add const { logout } = useAuth(); after router declaration
  if (!content.includes('const { logout }') && !content.includes('const { user, logout }')) {
    const routerDecl = /const router = useRouter\(\);/;
    if (routerDecl.test(content)) {
      content = content.replace(
        routerDecl,
        (match) => `${match}\n  const { logout } = useAuth();`
      );
      modified = true;
    }
  }

  // Step 4: Replace handleLogout function
  const oldLogoutPatterns = [
    /const handleLogout = async \(\) => \{[^}]*await signOut\(auth\);[^}]*router\.push\(['"]\/admin\/login['"]\);[^}]*\};/gs,
    /const handleLogout = async \(\) => \{[^}]*try \{[^}]*await signOut\(auth\);[^}]*router\.push\(['"]\/admin\/login['"]\);[^}]*\} catch[^}]*\}[^}]*\};/gs,
  ];

  const newLogout = `const handleLogout = async () => {\n    await handleAdminLogout(() => logout('admin'));\n  };`;

  oldLogoutPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, newLogout);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated successfully`);
  } else {
    console.log(`⏭️  No changes needed`);
  }

  return modified;
}

console.log('🔧 Fixing admin logout in remaining files...\n');

let count = 0;
filesToFix.forEach(file => {
  if (fixFile(file)) {
    count++;
  }
});

console.log(`\n✅ Fixed ${count} out of ${filesToFix.length} files`);
