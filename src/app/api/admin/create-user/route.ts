import { NextResponse } from 'next/server';
import fs from 'fs';

let admin: any = null;

async function ensureAdminSdk() {
  if (admin && admin.apps && admin.apps.length) return admin;
  try {
    const mod = await import('firebase-admin');
    admin = (mod && (mod.default || mod));
  } catch (e) {
    throw new Error('Server missing dependency "firebase-admin". Please run `npm install firebase-admin` on the server.');
  }

  // Initialize using service account JSON string in env if provided
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saRaw) {
    // Do not attempt application-default credentials in local dev — it will try to contact metadata.google.internal
    throw new Error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path or JSON) environment variable.');
  }

  try {
    let cred: any = saRaw;
    // If saRaw looks like JSON string, parse it. If it looks like a file path, read it.
    if (typeof saRaw === 'string') {
      const t = saRaw.trim();
      if (t.startsWith('{')) {
        cred = JSON.parse(t);
      } else {
        // treat as file path
        if (!fs.existsSync(t)) {
          throw new Error(`Service account path not found: ${t}`);
        }
        const file = fs.readFileSync(t, 'utf8');
        cred = JSON.parse(file);
      }
    }

    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(cred) });
  } catch (e) {
    console.error('Failed to initialize firebase-admin:', e);
    throw new Error('Failed to initialize firebase-admin: check FIREBASE_SERVICE_ACCOUNT/GOOGLE_APPLICATION_CREDENTIALS formatting and content');
  }
  return admin;
}

export async function POST(req: Request) {
  try {
    const adminSdk = await ensureAdminSdk();

    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

    // Verify requester is an admin (by checking /admins/{uid} exists)
    const decoded = await adminSdk.auth().verifyIdToken(token);
    const adminDoc = await adminSdk.firestore().doc(`admins/${decoded.uid}`).get();
    if (!adminDoc.exists) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Create user via Admin SDK
    const { displayName, username, phone, email, password, role } = body;
    if (!email || !password) return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });

    const userRecord = await adminSdk.auth().createUser({ email, password, displayName });

    // Persist user doc in Firestore
    await adminSdk.firestore().doc(`users/${userRecord.uid}`).set({
      displayName: displayName || '',
      username: username || '',
      phone: phone || '',
      email: email,
      role: role || 'admin',
      createdAt: adminSdk.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (err: any) {
    console.error('create-user error', err);
    const message = err?.message || String(err);
    // Provide helpful status codes for common cases
    if (message.includes('Missing') || message.includes('service account') || message.includes('firebase-admin')) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
