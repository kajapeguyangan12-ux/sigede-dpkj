/**
 * Admin Logout Helper
 * Centralized logout function to ensure consistent behavior across all admin pages
 */

export async function handleAdminLogout(logoutFunction: () => Promise<void>): Promise<void> {
  try {
    console.log('🚪 Starting admin logout process');
    
    // Set flag to prevent auth checks during logout
    sessionStorage.setItem('admin_logout_in_progress', 'true');
    
    // Call the logout function from AuthContext
    await logoutFunction();
    
    // Clear all localStorage data
    localStorage.clear();
    
    // Keep the flag temporarily
    sessionStorage.setItem('admin_logout_in_progress', 'true');
    
    // Clean up the flag
    sessionStorage.removeItem('admin_logout_in_progress');
    
    console.log('✅ Logout successful, redirecting to login');
    
    // Force redirect to login page (replace to prevent back button)
    window.location.replace('/admin/login');
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Even on error, force cleanup and redirect
    localStorage.clear();
    sessionStorage.clear();
    
    // Force redirect
    window.location.replace('/admin/login');
  }
}
