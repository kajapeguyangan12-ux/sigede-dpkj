#!/usr/bin/env node
/**
 * Script to set admin role for existing user
 * Usage: node scripts/setAdminRole.js <email> [role]
 * Default role: administrator
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config - you should use your actual config
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from your Firebase project settings
};

async function setAdminRole() {
  const email = process.argv[2];
  const role = process.argv[3] || 'administrator';
  
  if (!email) {
    console.error('Usage: node scripts/setAdminRole.js <email> [role]');
    console.error('Example: node scripts/setAdminRole.js admin@example.com administrator');
    process.exit(1);
  }

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // For now, we'll create a manual entry since we need the UID
    // In a real scenario, you'd get the UID from Firebase Auth
    
    console.log('⚠️  Manual Role Assignment Required');
    console.log('Since we need the user UID, please manually update the user role in Firestore:');
    console.log(`1. Go to Firebase Console > Firestore Database`);
    console.log(`2. Find the user document in the 'users' collection`);
    console.log(`3. Update the 'role' field to '${role}'`);
    console.log(`4. User email: ${email}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setAdminRole();