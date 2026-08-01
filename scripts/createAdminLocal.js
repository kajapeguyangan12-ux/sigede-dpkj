#!/usr/bin/env node
/**
 * Usage: node scripts/createAdminLocal.js <uid>
 * Requires GOOGLE_APPLICATION_CREDENTIALS (path) or FIREBASE_SERVICE_ACCOUNT (JSON) env var set.
 */
const fs = require('fs');
async function loadAdminSdk() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.error('Please install firebase-admin: npm install firebase-admin');
    process.exit(1);
  }

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saRaw) {
    console.error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path) environment variable.');
    process.exit(1);
  }

  let cred = saRaw;
  if (typeof saRaw === 'string') {
    const t = saRaw.trim();
    if (t.startsWith('{')) {
      cred = JSON.parse(t);
    } else {
      if (!fs.existsSync(t)) {
        console.error('Service account path not found:', t);
        process.exit(1);
      }
      const file = fs.readFileSync(t, 'utf8');
      cred = JSON.parse(file);
    }
  }

  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(cred) });
  return admin;
}

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: node scripts/createAdminLocal.js <uid>');
    process.exit(1);
  }
  const admin = await loadAdminSdk();
  const db = admin.firestore();
  try {
    await db.doc(`admins/${uid}`).set({ role: 'admin', createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`Created admins/${uid}`);
    process.exit(0);
  } catch (e) {
    console.error('Failed to create admin doc:', e);
    process.exit(1);
  }
}

main();
