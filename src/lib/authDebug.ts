/**
 * Auth Debug Utilities
 * Untuk membantu debug masalah auth dan session
 */

export const debugAuthState = () => {
  console.group('🔍 Auth Debug State');
  
  // Check localStorage
  console.log('📦 LocalStorage Auth Data:');
  console.log('- sigede_auth_user:', localStorage.getItem('sigede_auth_user'));
  console.log('- sigede_session_id:', localStorage.getItem('sigede_session_id'));
  console.log('- userId:', localStorage.getItem('userId'));
  
  // Check sessionStorage
  console.log('📦 SessionStorage:');
  console.log('- auth_redirecting:', sessionStorage.getItem('auth_redirecting'));
  console.log('- admin_logout_in_progress:', sessionStorage.getItem('admin_logout_in_progress'));
  
  // Environment variables
  console.log('🔧 Environment:');
  console.log('- NEXT_PUBLIC_DISABLE_SESSION_CHECK:', process.env.NEXT_PUBLIC_DISABLE_SESSION_CHECK);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  console.groupEnd();
};

export const clearDebugState = () => {
  console.log('🧹 Clearing all debug state');
  
  // Clear all auth data
  const authKeys = [
    'sigede_auth_user',
    'sigede_session_id', 
    'userId',
    'userRole'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  sessionStorage.clear();
  
  console.log('✅ Debug state cleared');
};

/**
 * Test role switching for menu access testing
 */
export const testRoleSwitch = (role: string) => {
  console.log(`🔄 Switching to test role: ${role}`);
  
  const currentUser = localStorage.getItem('sigede_auth_user');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    userData.role = role;
    localStorage.setItem('sigede_auth_user', JSON.stringify(userData));
    console.log('✅ Role switched - refresh page to see changes');
  } else {
    console.log('❌ No user found to switch role');
  }
};

/**
 * Test menu access for different roles
 */
export const testMenuAccess = () => {
  console.group('🔍 Menu Access Test for All Roles');
  
  const roles = [
    'administrator',
    'admin_desa', 
    'kepala_desa',
    'kepala_dusun',
    'warga_dpkj',
    'warga_luar_dpkj'
  ];
  
  const MENU_ACCESS_CONFIG = {
    restrictedForMasyarakat: ["Keuangan", "Data Desa", "Layanan Publik"],
    allowedForExternal: ["E-UMKM", "Wisata & Budaya", "E-News", "Profil Desa"],
    restrictedForKepalaDusun: ["Keuangan"]
  };
  
  const allMenus = [
    "E-News", "Profil Desa", "Regulasi", "Keuangan", "Data Desa", 
    "Layanan Publik", "IKM", "Wisata & Budaya", "Pengaduan", "E-UMKM"
  ];
  
  roles.forEach(role => {
    console.log(`\n👤 Role: ${role}`);
    
    let availableMenus = allMenus;
    
    if (role === "warga_luar_dpkj") {
      availableMenus = allMenus.filter(menu => 
        MENU_ACCESS_CONFIG.allowedForExternal.includes(menu)
      );
    } else if (role === "warga_dpkj") {
      availableMenus = allMenus.filter(menu => 
        !MENU_ACCESS_CONFIG.restrictedForMasyarakat.includes(menu)
      );
    } else if (role === "kepala_dusun") {
      availableMenus = allMenus.filter(menu => 
        !MENU_ACCESS_CONFIG.restrictedForKepalaDusun.includes(menu)
      );
    }
    
    console.log(`✅ Available (${availableMenus.length}):`, availableMenus.join(', '));
    
    const restrictedMenus = allMenus.filter(menu => !availableMenus.includes(menu));
    if (restrictedMenus.length > 0) {
      console.log(`❌ Restricted (${restrictedMenus.length}):`, restrictedMenus.join(', '));
    }
  });
  
  console.groupEnd();
};

// Export for global access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAuthState = debugAuthState;
  (window as any).clearDebugState = clearDebugState;
  (window as any).testRoleSwitch = testRoleSwitch;
  (window as any).testMenuAccess = testMenuAccess;
  
  console.log('🔧 Auth debug utilities available:');
  console.log('- window.debugAuthState() - Show current auth state');
  console.log('- window.clearDebugState() - Clear all auth data');
  console.log('- window.testRoleSwitch("role") - Switch user role for testing');
  console.log('- window.testMenuAccess() - Show menu access for all roles');
}