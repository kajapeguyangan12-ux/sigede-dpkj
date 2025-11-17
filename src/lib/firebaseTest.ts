/**
 * Firebase Connection Test Script
 * Untuk memverifikasi bahwa koneksi Firebase dan permissions berjalan dengan baik
 */

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const testFirebaseConnection = async () => {
  console.group('🔥 Firebase Connection Test');
  
  try {
    // Test 1: Read dari collection yang sudah ada
    console.log('📖 Test 1: Reading from users collection...');
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    console.log('✅ Users collection read successful:', usersSnapshot.size, 'documents');
    
    // Test 2: Write test document
    console.log('✍️ Test 2: Writing test document...');
    const testCollection = collection(db, 'connection-test');
    const testDoc = await addDoc(testCollection, {
      message: 'Firebase connection test',
      timestamp: new Date(),
      source: 'auth-debug'
    });
    console.log('✅ Test document written successfully:', testDoc.id);
    
    // Test 3: Read test document back
    console.log('📖 Test 3: Reading test documents...');
    const testSnapshot = await getDocs(testCollection);
    console.log('✅ Test documents read successful:', testSnapshot.size, 'documents');
    
    // Test 4: Delete test document
    console.log('🗑️ Test 4: Cleaning up test document...');
    await deleteDoc(doc(db, 'connection-test', testDoc.id));
    console.log('✅ Test document deleted successfully');
    
    console.log('🎉 All Firebase connection tests passed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  } finally {
    console.groupEnd();
  }
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testFirebaseConnection = testFirebaseConnection;
  console.log('🔧 Firebase test available: window.testFirebaseConnection()');
}