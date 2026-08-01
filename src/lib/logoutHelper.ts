/**
 * Admin Logout Helper
 * Centralized logout function to ensure consistent behavior across all admin pages
 */

export async function handleAdminLogout(logoutFunction: () => Promise<void>): Promise<void> {
  try {
    console.log('🚪 Starting admin logout process');
    
    // Clear all data IMMEDIATELY and SYNCHRONOUSLY first
    localStorage.clear();
    sessionStorage.clear();
    
    // Set flags to prevent auth checks during logout and indicate fresh logout
    sessionStorage.setItem('admin_logout_in_progress', 'true');
    sessionStorage.setItem('just_logged_out', 'true');
    
    // Force IMMEDIATE redirect to prevent any error display
    // Do this BEFORE any async operations
    window.location.replace('/admin/login');
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Even on error, force immediate cleanup and redirect
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('just_logged_out', 'true');
    
    // Force redirect
    window.location.replace('/admin/login');
  }
}
