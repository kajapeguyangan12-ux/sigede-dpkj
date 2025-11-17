"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { AuthUser, LoginCredentials } from '../lib/authenticationService';
import { clearAllAuthData } from '../lib/developmentUtils';
import { setupSessionCheck, validateSession } from '../lib/sessionService';
import '../lib/authDebug'; // Load auth debugging utilities in development
import '../lib/firebaseTest'; // Load Firebase connection test in development

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (userType?: 'admin' | 'masyarakat') => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false); // Only for login/logout operations
  const [initializing, setInitializing] = useState(true); // Only for initial auth check
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initialization
    if (authInitialized) return;
    
    // Check for existing session in localStorage
    const checkExistingSession = async () => {
      try {
        const savedUser = localStorage.getItem('sigede_auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('🔍 AUTH CONTEXT: Found existing session:', userData);
          
          // Set user immediately for better UX
          setUser(userData);
          
          // Validate session in background (non-blocking)
          try {
            const isValid = await validateSession(userData.uid);
            if (!isValid) {
              console.log('⚠️ AUTH CONTEXT: Background session validation failed, but keeping user logged in');
              // Don't logout immediately, give user chance to continue working
            }
            
            // Setup session check interval (DISABLED by default for admin stability)
            const disableSessionCheck = process.env.NEXT_PUBLIC_DISABLE_SESSION_CHECK === 'true';
            if (!disableSessionCheck) {
              console.log('⚠️ Session check is ENABLED - this may cause unwanted logouts');
              const interval = setupSessionCheck(userData.uid, handleSessionInvalidated);
              setSessionCheckInterval(interval);
              console.log('✅ Session check enabled for existing session');
            } else {
              console.log('✅ Session check DISABLED for admin stability - no automatic logouts');
            }
          } catch (sessionError) {
            console.warn('⚠️ AUTH CONTEXT: Session validation error (non-critical):', sessionError);
            // Keep user logged in even if session validation fails
          }
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('sigede_auth_user');
      } finally {
        setInitializing(false);
        setAuthInitialized(true);
      }
    };

    checkExistingSession();
    
    // Cleanup interval on unmount
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  // Handle session invalidation (user logged in from another device)
  const handleSessionInvalidated = () => {
    console.log('❌ AUTH CONTEXT: Session invalidation requested - but we will be more conservative');
    
    // Prevent multiple logout attempts
    if (isLoggingOut) {
      console.log('🚫 AUTH CONTEXT: Session invalidation ignored - logout already in progress');
      return;
    }

    // Don't automatically logout - instead show a warning and let user continue
    // This prevents unwanted logouts due to network issues or temporary problems
    console.log('⚠️ AUTH CONTEXT: Session validation issue detected, but keeping user logged in');
    console.log('🔧 AUTH CONTEXT: User can manually logout if needed');
    
    // Clear interval to prevent further checks
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      setSessionCheckInterval(null);
    }
    
    // Show a notification to user but don't force logout
    if (typeof window !== 'undefined') {
      console.log('� TIP: If experiencing issues, please logout and login again manually');
    }
    
    // Reset the logging out state
    setIsLoggingOut(false);
  };

  const login = async (credentials: LoginCredentials) => {
    // Create a promise that times out after 20 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login timeout. Silakan coba lagi.')), 20000);
    });

    try {
      console.log('🔐 AUTH CONTEXT: Login attempt');
      setLoading(true);
      
      // Clear any existing session first to prevent conflicts
      clearAllAuthData();
      setUser(null);
      
      // Race between login and timeout
      const authUser = await Promise.race([
        authService.login(credentials),
        timeoutPromise
      ]) as AuthUser;
      
      // Save to state and localStorage
      setUser(authUser);
      localStorage.setItem('sigede_auth_user', JSON.stringify(authUser));
      
      // Also save userId for backward compatibility
      localStorage.setItem('userId', authUser.uid);
      
      // Additional admin authentication markers for form validation
      if (authUser.role === 'administrator' || authUser.role === 'admin_desa') {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminRole', authUser.role);
        localStorage.setItem('adminEmail', authUser.email);
        localStorage.setItem('adminUID', authUser.uid);
        console.log('✅ AUTH CONTEXT: Admin authentication markers saved');
      }
      
      // Setup session check interval (DISABLED by default for admin stability)
      const disableSessionCheck = process.env.NEXT_PUBLIC_DISABLE_SESSION_CHECK === 'true';
      if (!disableSessionCheck) {
        console.log('⚠️ Session check is ENABLED - this may cause unwanted admin logouts');
        const interval = setupSessionCheck(authUser.uid, handleSessionInvalidated);
        setSessionCheckInterval(interval);
        console.log('✅ Session check enabled after login');
      } else {
        console.log('✅ Session check DISABLED for admin stability - no automatic logouts');
      }
      
      console.log('✅ AUTH CONTEXT: Login successful, userId:', authUser.uid);
    } catch (error) {
      console.error('❌ AUTH CONTEXT: Login failed:', error);
      // Clear everything on login failure
      clearAllAuthData();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (userType: 'admin' | 'masyarakat' = 'admin') => {
    // Prevent multiple logout calls
    if (isLoggingOut) {
      console.log('🚫 AUTH CONTEXT: Logout already in progress');
      return;
    }

    try {
      console.log('🚪 AUTH CONTEXT: Logout attempt for userType:', userType);
      setIsLoggingOut(true);
      
      // Clear session check interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }
      
      // Clear auth service first (includes session termination)
      await authService.logout();
      
      // Clear state
      setUser(null);
      
      // Use utility to clear all auth data thoroughly
      clearAllAuthData();
      
      console.log('✅ AUTH CONTEXT: Logout successful');
      
      // DON'T redirect here - let the calling component handle it
      // This prevents double redirect issues
      
    } catch (error) {
      console.error('❌ AUTH CONTEXT: Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
      clearAllAuthData();
      
      // Clear interval on error
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }
    } finally {
      setIsLoggingOut(false);
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user ? authService.isAdmin(user.role) : false;

  const value: AuthContextType = {
    user,
    loading,
    initializing,
    login,
    logout,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;