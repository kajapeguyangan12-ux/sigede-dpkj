/**
 * Masyarakat Logout Helper
 * Centralized logout function for masyarakat pages
 */

export async function handleMasyarakatLogout(logoutFunction: () => Promise<void>): Promise<void> {
  try {
    console.log('🚪 Starting masyarakat logout process');
    
    // Set flag to prevent auth checks during logout
    sessionStorage.setItem('masyarakat_logout_in_progress', 'true');
    
    // Call the logout function from AuthContext
    await logoutFunction();
    
    // Clear all localStorage data
    localStorage.clear();
    
    // Keep the flag temporarily
    sessionStorage.setItem('masyarakat_logout_in_progress', 'true');
    
    // Clean up the flag
    sessionStorage.removeItem('masyarakat_logout_in_progress');
    
    console.log('✅ Logout successful, redirecting to login');
    
    // Force redirect to masyarakat login page
    window.location.replace('/masyarakat/login');
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Even on error, force cleanup and redirect
    localStorage.clear();
    sessionStorage.clear();
    
    // Force redirect
    window.location.replace('/masyarakat/login');
  }
}
