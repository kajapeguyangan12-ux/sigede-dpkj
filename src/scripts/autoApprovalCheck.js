const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { checkAndAutoApprove } = require('../lib/layananPublikService.ts');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Auto-approval checker function
async function runAutoApprovalCheck() {
  try {
    console.log('🔄 Starting auto-approval check...');
    
    const autoApprovedCount = await checkAndAutoApprove();
    
    if (autoApprovedCount > 0) {
      console.log(`✅ Auto-approved ${autoApprovedCount} layanan requests due to timeout`);
    } else {
      console.log('ℹ️ No layanan requests require auto-approval at this time');
    }
    
    return autoApprovedCount;
  } catch (error) {
    console.error('❌ Error in auto-approval check:', error);
    throw error;
  }
}

// Run the auto-approval check
if (require.main === module) {
  runAutoApprovalCheck()
    .then((count) => {
      console.log(`✨ Auto-approval check completed. ${count} items processed.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Auto-approval check failed:', error);
      process.exit(1);
    });
}

module.exports = { runAutoApprovalCheck };