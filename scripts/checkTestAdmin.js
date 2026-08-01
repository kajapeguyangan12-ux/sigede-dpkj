#!/usr/bin/env node
/**
 * Check if test admin user exists in Firestore
 * Uses client SDK to check without needing server credentials
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking if test admin exists...');

// Create a temporary file to check Firestore
const checkScript = `
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDiwZyH9yQvJvjW4otawrNrwwbEYfMQ1vI'}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dpkj-ffc01.firebaseapp.com'}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dpkj-ffc01'}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dpkj-ffc01.firebasestorage.app'}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '528333091299'}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:528333091299:web:124c5d67f0c70a51a0b0d6'}"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTestAdmin() {
  try {
    const docRef = doc(db, 'users', 'admin_test_123');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Test admin exists:', docSnap.data());
    } else {
      console.log('❌ Test admin not found. Need to create one.');
    }
  } catch (error) {
    console.error('Error checking test admin:', error);
  }
}

checkTestAdmin();
`;

// Write the check script
fs.writeFileSync('temp-check-admin.mjs', checkScript);

try {
  // Run the check
  execSync('node temp-check-admin.mjs', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running check:', error.message);
} finally {
  // Clean up
  if (fs.existsSync('temp-check-admin.mjs')) {
    fs.unlinkSync('temp-check-admin.mjs');
  }
}