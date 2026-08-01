"use client";
import React, { useState } from 'react';
import { auth, db } from '../../../../lib/firebase';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useCurrentUser } from '../../../masyarakat/lib/useCurrentUser';

export default function AdminRoleManager() {
  const { user: currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const setCurrentUserAsAdmin = async () => {
    // Check Firebase Auth first
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      setError('No Firebase user logged in. Please login first.');
      return;
    }

    const targetUser = currentUser || {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Admin User'
    };

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const userRef = doc(db, 'users', targetUser.uid);
      
      // Check if document exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user document using setDoc
        await setDoc(userRef, {
          uid: targetUser.uid,
          email: targetUser.email,
          displayName: targetUser.displayName || 'Admin User',
          role: 'administrator',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'self-promotion'
        });
      } else {
        // Update existing document
        await updateDoc(userRef, {
          role: 'administrator',
          updatedAt: serverTimestamp()
        });
      }

      setMessage('✅ Successfully set role to administrator! Please refresh the page to see changes.');
      
      // Refresh the page after 2 seconds to reload user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error updating role:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Show this component in development or if user needs admin setup
  const firebaseUser = auth.currentUser;
  const shouldShow = firebaseUser && (
    !currentUser || 
    currentUser.role === 'unknown' || 
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost'
  );

  if (!shouldShow) return null;

  return (
    <div className="mb-8 mx-auto max-w-2xl">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-2xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 text-lg mb-2">Admin Role Setup</h4>
            <div className="text-sm text-blue-800 mb-4">
              <p className="mb-2">Current status:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li><strong>Firebase Auth:</strong> {firebaseUser ? '✅ Logged In' : '❌ Not Logged In'}</li>
                <li><strong>Email:</strong> {firebaseUser?.email || currentUser?.email || 'N/A'}</li>
                <li><strong>Display Name:</strong> {firebaseUser?.displayName || currentUser?.displayName || 'N/A'}</li>
                <li><strong>Firestore Role:</strong> {currentUser?.role || '❌ Not Set'}</li>
                <li><strong>UID:</strong> {firebaseUser?.uid || currentUser?.uid || 'N/A'}</li>
              </ul>
              <p>Click the button below to create/update your admin role in Firestore database.</p>
            </div>
            
            {message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
                {error}
              </div>
            )}
            
            <button
              onClick={setCurrentUserAsAdmin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {loading ? 'Setting Admin Role...' : 'Set as Administrator'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}