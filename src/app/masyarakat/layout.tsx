"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function MasyarakatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects and checks
    if (isRedirecting) {
      console.log('🚫 Already redirecting, skipping check');
      return;
    }

    if (hasCheckedAuth) {
      console.log('✓ Already checked auth for this pathname');
      return;
    }

    // Wait for auth to load completely - CRITICAL: use initializing not loading
    if (initializing) {
      console.log('⏳ Waiting for auth initialization...');
      return;
    }

    // Ensure user object is fully loaded if authenticated
    if (isAuthenticated && !user) {
      console.log('⚠️ Authenticated but user object not loaded yet');
      return;
    }

    // Define public paths that don't require authentication
    const publicPaths = ['/masyarakat/login', '/masyarakat/daftar'];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
    
    console.log('🔐 Masyarakat Layout Check:', { 
      pathname, 
      isPublicPath, 
      isAuthenticated,
      initializing,
      userRole: user?.role,
      userId: user?.uid,
      hasCheckedAuth,
      isRedirecting
    });

    // Mark that we've checked auth to prevent repeated checks
    setHasCheckedAuth(true);

    // If on login/register page and already authenticated, redirect to home
    if ((pathname === '/masyarakat/login' || pathname === '/masyarakat/daftar') && isAuthenticated && user) {
      if (['administrator', 'admin_desa'].includes(user.role)) {
        console.log('✅ Redirecting admin to admin/home');
        setIsRedirecting(true);
        setTimeout(() => {
          router.replace('/admin/home');
        }, 100);
      } else {
        console.log('✅ Redirecting authenticated user to masyarakat/home');
        setIsRedirecting(true);
        setTimeout(() => {
          router.replace('/masyarakat/home');
        }, 100);
      }
      return;
    }

    // If on protected page and NOT authenticated, redirect to login
    if (!isPublicPath && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      setIsRedirecting(true);
      setTimeout(() => {
        router.replace('/masyarakat/login');
      }, 100);
      return;
    }

    // Only administrator and admin_desa should be redirected to admin panel
    // kepala_desa and kepala_dusun can access masyarakat pages
    if (!isPublicPath && isAuthenticated && user && ['administrator', 'admin_desa'].includes(user.role)) {
      console.log('❌ Admin trying to access masyarakat page');
      setIsRedirecting(true);
      setTimeout(() => {
        router.replace('/admin/home');
      }, 100);
      return;
    }
  }, [isAuthenticated, user, initializing, pathname, router, isRedirecting, hasCheckedAuth]);

  // Reset check flag when pathname changes - with delay to prevent loops
  useEffect(() => {
    // Only reset if not currently redirecting
    if (!isRedirecting) {
      const timer = setTimeout(() => {
        setHasCheckedAuth(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, isRedirecting]);

  // Show loading state while checking auth - use initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}