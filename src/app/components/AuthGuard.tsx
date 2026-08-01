"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAdmin = false, 
  redirectTo = '/admin/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  console.log('🛡️ AuthGuard State:', { 
    isAuthenticated, 
    isAdmin, 
    loading, 
    requireAdmin, 
    redirectTo,
    hasStoredUser: typeof window !== 'undefined' ? !!localStorage.getItem('sigede_auth_user') : false
  });

  useEffect(() => {
    // Add a small delay to prevent race conditions during logout
    const checkAuthTimeout = setTimeout(() => {
      if (!loading && typeof window !== 'undefined') {
        // Check if we're already in the process of redirecting
        const isRedirecting = sessionStorage.getItem('auth_redirecting');
        if (isRedirecting) {
          console.log('🔄 AuthGuard: Already redirecting, skipping');
          return;
        }

        // Check if user is logging out (no localStorage data)
        const hasStoredUser = localStorage.getItem('sigede_auth_user');
        
        // Not authenticated at all
        if (!isAuthenticated || !hasStoredUser) {
          console.log('🚫 AuthGuard: Not authenticated, redirecting to:', redirectTo);
          
          // Set redirecting flag to prevent multiple redirects
          sessionStorage.setItem('auth_redirecting', 'true');
          
          // Clear any remaining auth data
          localStorage.removeItem('sigede_auth_user');
          localStorage.removeItem('firebase:authUser');
          localStorage.removeItem('firebase:host');
          
          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 10);
          return;
        }
        
        // Require admin but user is not admin
        if (requireAdmin && !isAdmin) {
          console.log('🚫 AuthGuard: Not admin, redirecting to masyarakat');
          
          // Set redirecting flag
          sessionStorage.setItem('auth_redirecting', 'true');
          
          setTimeout(() => {
            window.location.replace('/masyarakat/home');
          }, 10);
          return;
        }
      }
    }, 50);

    return () => clearTimeout(checkAuthTimeout);
  }, [isAuthenticated, isAdmin, loading, requireAdmin, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or admin (will redirect)
  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}