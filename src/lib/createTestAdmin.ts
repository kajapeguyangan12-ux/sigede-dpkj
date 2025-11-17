// Temporary solution: Create admin user directly via client SDK
// This script can be run in browser console at localhost:3001/admin/login

import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function createTestAdminUser() {
  try {
    console.log('🔧 Creating test admin user via client SDK...');
    
    const testAdminData = {
      uid: 'admin_test_123',
      email: 'admin@dpkj.test',
      displayName: 'Admin Test',
      userName: 'admin',
      role: 'administrator',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system',
      notes: 'Test admin user - Email: admin@dpkj.test, Password: admin123456'
    };

    // Create in users collection
    await setDoc(doc(db, 'users', testAdminData.uid), testAdminData);
    console.log('✅ Test admin created in users collection');

    console.log('\n📋 Test Admin Login Credentials:');
    console.log('Email: admin@dpkj.test');
    console.log('Password: admin123456');
    console.log('Username: admin');
    console.log('User ID: admin_test_123');
    console.log('\n🎯 You can now test login!');
    console.log('💡 Use email + password for proper Firebase Auth');
    
    return testAdminData;
    
  } catch (error) {
    console.error('❌ Error creating test admin:', error);
    throw error;
  }
}

// Make it available globally for console use
declare global {
  interface Window {
    createTestAdminUser: () => Promise<any>;
  }
}

if (typeof window !== 'undefined') {
  window.createTestAdminUser = createTestAdminUser;
}