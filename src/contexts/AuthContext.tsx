"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { AuthUser, LoginCredentials } from '../lib/authenticationService';
import { clearAllAuthData } from '../lib/developmentUtils';
import { setupSessionCheck, validateSession } from '../lib/sessionService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for existing session in localStorage
    const checkExistingSession = async () => {
      try {
        const savedUser = localStorage.getItem('sigede_auth_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('🔍 AUTH CONTEXT: Found existing session:', userData);
          
          // Validate session
          const isValid = await validateSession(userData.uid);
          if (isValid) {
            setUser(userData);
            
            // Setup session check interval
            const interval = setupSessionCheck(userData.uid, handleSessionInvalidated);
            setSessionCheckInterval(interval);
          } else {
            console.log('⚠️ AUTH CONTEXT: Session invalid, clearing data');
            clearAllAuthData();
          }
        }
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('sigede_auth_user');
      } finally {
        setLoading(false);
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
    console.log('❌ AUTH CONTEXT: Session invalidated by another login');
    setUser(null);
    clearAllAuthData();
    
    // Clear interval
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval);
      setSessionCheckInterval(null);
    }
    
    // Redirect to login
    const userType = user?.role && authService.isAdmin(user.role) ? 'admin' : 'masyarakat';
    const redirectPath = userType === 'admin' ? '/admin/login' : '/masyarakat/login';
    
    alert('Anda telah login dari perangkat lain. Sesi ini akan diakhiri.');
    window.location.replace(redirectPath);
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
      
      // Setup session check interval
      const interval = setupSessionCheck(authUser.uid, handleSessionInvalidated);
      setSessionCheckInterval(interval);
      
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