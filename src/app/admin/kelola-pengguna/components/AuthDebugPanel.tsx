"use client";
import React from 'react';
import { auth } from '../../../../lib/firebase';
import { useCurrentUser } from '../../../masyarakat/lib/useCurrentUser';

export default function AuthDebugPanel() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const firebaseUser = auth.currentUser;
  
  // Check various authentication sources
  const authSources = {
    firebaseAuth: firebaseUser ? {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    } : null,
    currentUser: currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      role: currentUser.role
    } : null,
    localStorage: typeof window !== 'undefined' ? {
      adminAuth: localStorage.getItem('adminAuth'),
      adminRole: localStorage.getItem('adminRole'),
      adminEmail: localStorage.getItem('adminEmail')
    } : null,
    sessionStorage: typeof window !== 'undefined' ? {
      adminAuth: sessionStorage.getItem('adminAuth'),
      adminRole: sessionStorage.getItem('adminRole'),
      adminEmail: sessionStorage.getItem('adminEmail')
    } : null
  };

  const isAuthenticated = firebaseUser || currentUser || 
                         (typeof window !== 'undefined' && localStorage.getItem('adminAuth'));

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        🔍 Debug: Status Autentikasi
        <span className={`text-xs px-2 py-1 rounded-full ${
          isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </span>
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Firebase Auth */}
        <div className="bg-white p-3 rounded border">
          <div className="font-semibold text-blue-700 mb-2">🔥 Firebase Auth</div>
          {authSources.firebaseAuth ? (
            <div className="space-y-1">
              <div><strong>Status:</strong> <span className="text-green-600">✅ Logged In</span></div>
              <div><strong>UID:</strong> {authSources.firebaseAuth.uid}</div>
              <div><strong>Email:</strong> {authSources.firebaseAuth.email}</div>
              <div><strong>Name:</strong> {authSources.firebaseAuth.displayName || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-red-600">❌ Not authenticated</div>
          )}
        </div>

        {/* Current User Context */}
        <div className="bg-white p-3 rounded border">
          <div className="font-semibold text-purple-700 mb-2">👤 Current User Context</div>
          {userLoading ? (
            <div className="text-yellow-600">⏳ Loading...</div>
          ) : authSources.currentUser ? (
            <div className="space-y-1">
              <div><strong>Status:</strong> <span className="text-green-600">✅ Available</span></div>
              <div><strong>UID:</strong> {authSources.currentUser.uid}</div>
              <div><strong>Email:</strong> {authSources.currentUser.email}</div>
              <div><strong>Name:</strong> {authSources.currentUser.displayName || 'N/A'}</div>
              <div><strong>Role:</strong> 
                <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                  authSources.currentUser.role === 'administrator' ? 'bg-purple-100 text-purple-800' :
                  authSources.currentUser.role === 'admin_desa' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {authSources.currentUser.role}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-red-600">❌ No user data</div>
          )}
        </div>

        {/* Local Storage */}
        <div className="bg-white p-3 rounded border">
          <div className="font-semibold text-green-700 mb-2">💾 LocalStorage</div>
          {authSources.localStorage?.adminAuth ? (
            <div className="space-y-1">
              <div><strong>Status:</strong> <span className="text-green-600">✅ Has Auth</span></div>
              <div><strong>Role:</strong> {authSources.localStorage.adminRole || 'N/A'}</div>
              <div><strong>Email:</strong> {authSources.localStorage.adminEmail || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-red-600">❌ No auth data</div>
          )}
        </div>

        {/* Session Storage */}
        <div className="bg-white p-3 rounded border">
          <div className="font-semibold text-orange-700 mb-2">🔄 SessionStorage</div>
          {authSources.sessionStorage?.adminAuth ? (
            <div className="space-y-1">
              <div><strong>Status:</strong> <span className="text-green-600">✅ Has Auth</span></div>
              <div><strong>Role:</strong> {authSources.sessionStorage.adminRole || 'N/A'}</div>
              <div><strong>Email:</strong> {authSources.sessionStorage.adminEmail || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-red-600">❌ No auth data</div>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <div className="mt-4 p-3 bg-gray-100 rounded border-l-4 border-gray-400">
        <div className="font-semibold text-gray-700 mb-2">📊 Overall Assessment</div>
        <div className="text-sm space-y-1">
          <div><strong>Authentication Methods Found:</strong> {
            [
              authSources.firebaseAuth && 'Firebase Auth',
              authSources.currentUser && 'Current User Context',
              authSources.localStorage?.adminAuth && 'LocalStorage',
              authSources.sessionStorage?.adminAuth && 'SessionStorage'
            ].filter(Boolean).join(', ') || 'None'
          }</div>
          <div><strong>Can Create Users:</strong> 
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div><strong>Environment:</strong> 
            <span className="text-blue-600">
              {process.env.NODE_ENV === 'development' ? '🧪 Development' : '🚀 Production'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}