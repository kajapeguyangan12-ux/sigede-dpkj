// Script to send rating reminder notifications for E-UMKM visits
// Run this script daily (e.g., using cron job or scheduled task)

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getVisitsNeedingReminder, markNotificationSent } from '../src/lib/ratingService';
import { createRatingReminderNotification } from '../src/lib/notificationService';

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

async function sendRatingReminders() {
  try {
    console.log('🔍 Checking for visits needing rating reminders...');
    
    // Get visits that are 1-2 days old and haven't received notification
    const visits = await getVisitsNeedingReminder();
    
    console.log(`📊 Found ${visits.length} visits needing reminders`);
    
    if (visits.length === 0) {
      console.log('✅ No reminders needed at this time.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const visit of visits) {
      try {
        // Create notification
        await createRatingReminderNotification({
          userId: visit.userId,
          umkmId: visit.umkmId,
          umkmName: visit.umkmName,
          priority: 'low'
        });
        
        // Mark notification as sent
        if (visit.id) {
          await markNotificationSent(visit.id);
        }
        
        successCount++;
        console.log(`✅ Reminder sent to user ${visit.userId} for ${visit.umkmName}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error sending reminder for visit ${visit.id}:`, error);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${visits.length}`);
    
  } catch (error) {
    console.error('❌ Error in sendRatingReminders:', error);
    process.exit(1);
  }
}

// Run the script
sendRatingReminders()
  .then(() => {
    console.log('\n🎉 Rating reminder script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
