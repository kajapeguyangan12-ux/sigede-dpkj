// Script to check e-news data in Firestore
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath))
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkENewsData() {
  try {
    console.log('Checking e-news collections...\n');

    // Check e-news_berita
    console.log('=== e-news_berita collection ===');
    const beritaRef = db.collection('e-news_berita');
    const beritaDocs = await beritaRef.get();
    console.log(`Total documents: ${beritaDocs.size}`);
    
    beritaDocs.forEach(doc => {
      console.log(`\nDocument ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });

    // Check e-news_pengumuman
    console.log('\n\n=== e-news_pengumuman collection ===');
    const pengumumanRef = db.collection('e-news_pengumuman');
    const pengumumanDocs = await pengumumanRef.get();
    console.log(`Total documents: ${pengumumanDocs.size}`);
    
    pengumumanDocs.forEach(doc => {
      console.log(`\nDocument ID: ${doc.id}`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });

    // Check published items
    console.log('\n\n=== Published items in e-news_berita ===');
    const publishedBerita = await beritaRef.where('status', '==', 'published').get();
    console.log(`Published documents: ${publishedBerita.size}`);
    
    publishedBerita.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
      console.log('Status:', doc.data().status);
    });

    console.log('\n\n=== Published items in e-news_pengumuman ===');
    const publishedPengumuman = await pengumumanRef.where('status', '==', 'published').get();
    console.log(`Published documents: ${publishedPengumuman.size}`);
    
    publishedPengumuman.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
      console.log('Status:', doc.data().status);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking e-news data:', error);
    process.exit(1);
  }
}

checkENewsData();
