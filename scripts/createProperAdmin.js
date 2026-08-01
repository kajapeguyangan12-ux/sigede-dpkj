#!/usr/bin/env node
/**
 * Create admin user with proper Firebase Auth
 * This will create user in both Firebase Auth and Firestore
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Import Firebase Admin SDK
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.error('Please install firebase-admin: npm install firebase-admin --save-dev');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to use service account if available
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const cred = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(cred),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dpkj-ffc01'
      });
    } else {
      // Fallback to project ID only
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dpkj-ffc01'
      });
    }
  } catch (initError) {
    console.error('Failed to initialize Firebase Admin:', initError.message);
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function createProperAdminUser() {
  try {
    console.log('🔧 Creating proper admin user with Firebase Auth...');
    
    const adminEmail = 'admin@dpkj.test';
    const adminPassword = 'admin123456';
    const adminData = {
      uid: 'admin_test_123',
      email: adminEmail,
      displayName: 'Admin Test',
      userName: 'admin',
      role: 'administrator',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      notes: 'Admin user with proper Firebase Auth'
    };

    // 1. Create user in Firebase Auth
    try {
      console.log('👤 Creating Firebase Auth user...');
      const userRecord = await auth.createUser({
        uid: adminData.uid,
        email: adminEmail,
        password: adminPassword,
        displayName: adminData.displayName,
        emailVerified: true
      });
      console.log('✅ Firebase Auth user created:', userRecord.uid);
    } catch (authError) {
      if (authError.code === 'auth/uid-already-exists') {
        console.log('ℹ️ Firebase Auth user already exists, updating...');
        await auth.updateUser(adminData.uid, {
          email: adminEmail,
          password: adminPassword,
          displayName: adminData.displayName,
          emailVerified: true
        });
      } else {
        throw authError;
      }
    }

    // 2. Create user in Firestore
    console.log('📝 Creating Firestore user document...');
    await db.collection('users').doc(adminData.uid).set(adminData);
    console.log('✅ Firestore user document created');

    // 3. Create admin collection entry
    await db.collection('admins').doc(adminData.uid).set({
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Admin collection entry created');

    console.log('\n📋 Admin Login Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Username:', adminData.userName);
    console.log('User ID:', adminData.uid);
    console.log('\n🎯 You can now test login at http://localhost:3001/admin/login');
    console.log('💡 Use either email or username to login');
    
  } catch (error) {
    console.error('❌ Error creating proper admin user:', error);
  }
}

createProperAdminUser();