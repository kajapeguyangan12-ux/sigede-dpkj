#!/usr/bin/env node
/**
 * Create a temporary admin user for testing login functionality
 * This creates user directly in Firestore without Firebase Auth
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

// Initialize Firebase Admin with project ID only (for public Firestore access)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dpkj-ffc01'
  });
}

const db = admin.firestore();

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');
    
    const testAdminData = {
      uid: 'admin_test_123',
      email: 'admin@dpkj.test',
      displayName: 'Admin Test',
      userName: 'admin',
      role: 'administrator',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      notes: 'Test admin user created for login testing'
    };

    // Create in users collection
    await db.collection('users').doc(testAdminData.uid).set(testAdminData);
    console.log('✅ Test admin created in users collection');

    // Also create in admins collection if needed
    await db.collection('admins').doc(testAdminData.uid).set({
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Test admin created in admins collection');

    console.log('\n📋 Test Admin Login Credentials:');
    console.log('Username/ID: admin');
    console.log('Email: admin@dpkj.test');
    console.log('User ID: admin_test_123');
    console.log('Password: (any password will work for now)');
    console.log('\n🎯 You can now test login at http://localhost:3001/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  }
}

createTestAdmin();