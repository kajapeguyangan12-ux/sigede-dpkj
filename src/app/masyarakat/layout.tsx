"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function MasyarakatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects and checks
    if (isRedirecting || hasCheckedAuth) {
      return;
    }

    // Wait for auth to load completely
    if (loading) {
      return;
    }

    // Define public paths that don't require authentication
    const publicPaths = ['/masyarakat/login', '/masyarakat/daftar', '/masyarakat'];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
    
    console.log('🔐 Masyarakat Layout Check:', { 
      pathname, 
      isPublicPath, 
      isAuthenticated, 
      userRole: user?.role 
    });

    // Mark that we've checked auth to prevent repeated checks
    setHasCheckedAuth(true);

    // If on login/register page and already authenticated, redirect to home
    if ((pathname === '/masyarakat/login' || pathname === '/masyarakat/daftar') && isAuthenticated) {
      if (user && ['administrator', 'admin_desa', 'kepala_desa'].includes(user.role)) {
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

    // If authenticated but is admin trying to access masyarakat pages
    if (!isPublicPath && isAuthenticated && user && ['administrator', 'admin_desa', 'kepala_desa'].includes(user.role)) {
      console.log('❌ Admin trying to access masyarakat page');
      setIsRedirecting(true);
      setTimeout(() => {
        router.replace('/admin/home');
      }, 100);
      return;
    }
  }, [isAuthenticated, user, loading, pathname, router, isRedirecting, hasCheckedAuth]);

  // Reset check flag when pathname changes
  useEffect(() => {
    setHasCheckedAuth(false);
    setIsRedirecting(false);
  }, [pathname]);

  // Show loading state while checking auth
  if (loading) {
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
