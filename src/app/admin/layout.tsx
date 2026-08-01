"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check if user can access admin panel (includes kepala_desa and kepala_dusun)
  const canAccessAdmin = user ? ['administrator', 'admin_desa', 'kepala_desa', 'kepala_dusun'].includes(user.role) : false;

  useEffect(() => {
    // Prevent multiple redirects and checks
    if (isRedirecting || hasCheckedAuth) {
      return;
    }

    // Wait for auth to load completely
    if (initializing) {
      return;
    }

    // Login page is public
    const isLoginPage = pathname === '/admin/login';
    
    console.log('🔐 Admin Layout Check:', { 
      pathname, 
      isLoginPage, 
      isAuthenticated, 
      canAccessAdmin,
      userRole: user?.role 
    });

    // Mark that we've checked auth to prevent repeated checks
    setHasCheckedAuth(true);

    // Allow login page to be accessed even if authenticated
    // This allows switching accounts without manual logout
    if (isLoginPage) {
      console.log('📝 On login page, allowing access');
      return;
    }

    // If on protected page (not login) and NOT authenticated, redirect to login
    if (!isLoginPage && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to admin login');
      setIsRedirecting(true);
      setTimeout(() => {
        router.replace('/admin/login');
      }, 100);
      return;
    }

    // If authenticated but cannot access admin panel
    if (!isLoginPage && isAuthenticated && !canAccessAdmin) {
      console.log('❌ User cannot access admin panel, redirecting to masyarakat');
      setIsRedirecting(true);
      setTimeout(() => {
        router.replace('/masyarakat/home');
      }, 100);
      return;
    }
  }, [isAuthenticated, user, initializing, pathname, router, isRedirecting, canAccessAdmin, hasCheckedAuth]);

  // Reset check flag when pathname changes
  useEffect(() => {
    setHasCheckedAuth(false);
    setIsRedirecting(false);
  }, [pathname]);

  // Show loading state only during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
