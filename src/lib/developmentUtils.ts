// Clear all authentication data thoroughly
const clearAllAuthData = () => {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage - all auth related keys
  const authKeys = [
    'sigede_auth_user',
    'userId',
    'userRole',
    'adminAuth',
    'adminRole',
    'adminEmail',
    'adminUID',
    'firebase:authUser', 
    'firebase:host',
    'firebase:heartbeat',
    'firebase:previous_websocket_failure'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also scan for any dynamic Firebase keys
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('firebase:') || key.startsWith('sigede_'))) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear sessionStorage completely
  sessionStorage.clear();
  
  // Clear any Firebase auth state in IndexedDB
  if (window.indexedDB) {
    try {
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
      console.log('🗑️ Cleared Firebase IndexedDB');
    } catch (e) {
      console.log('Could not clear IndexedDB:', e);
    }
  }
  
  console.log('🧹 Cleared all auth data');
};

// Development utility to handle HMR-safe logout
export const developmentLogout = () => {
  console.log('🧹 Development Logout: Clearing all auth data');
  
  // Clear all authentication data thoroughly
  clearAllAuthData();
  
  // Clear any pending timeouts/intervals that might interfere
  const highestTimeoutId = setTimeout(";", 9999);
  for (let i = highestTimeoutId; i >= 0; i--) {
    clearTimeout(i);
  }
  
  // Force immediate navigation with most reliable method
  if (process.env.NODE_ENV === 'development') {
    // In development, use location.href for most reliable redirect
    setTimeout(() => {
      window.location.href = '/admin/login';
    }, 10);
  } else {
    // In production, use replace for better performance
    window.location.replace('/admin/login');
  }
};

export { clearAllAuthData };