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

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saRaw) {
    throw new Error('No service account provided. Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path or JSON) environment variable.');
  }

  try {
    let cred: any = saRaw;
    if (typeof saRaw === 'string') {
      const t = saRaw.trim();
      if (t.startsWith('{')) {
        cred = JSON.parse(t);
      } else {
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

    // Verify requester is an admin
    const decoded = await adminSdk.auth().verifyIdToken(token);
    const adminDoc = await adminSdk.firestore().doc(`admins/${decoded.uid}`).get();
    if (!adminDoc.exists) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Update user password via Admin SDK
    const { userId, password, email } = body;
    if (!userId || !password) return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 });

    // Update password
    await adminSdk.auth().updateUser(userId, { 
      password,
      email: email || undefined,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('update-user-password error', err);
    const message = err?.message || String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
