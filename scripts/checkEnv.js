#!/usr/bin/env node
// Simple env checker for local development
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

function ok(msg) { console.log('\x1b[32m%s\x1b[0m', 'OK:', msg); }
function warn(msg) { console.log('\x1b[33m%s\x1b[0m', 'WARN:', msg); }
function err(msg) { console.log('\x1b[31m%s\x1b[0m', 'ERROR:', msg); }

console.log('Checking environment for Firebase configuration...');

const clientKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let missingClient = clientKeys.filter(k => !process.env[k]);
if (missingClient.length) {
  warn('Missing client-side Firebase keys: ' + missingClient.join(', '));
} else {
  ok('Client-side Firebase keys present');
}

const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const saInline = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!saPath && !saInline) {
  warn('No server service account provided. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
} else if (saPath) {
  if (fs.existsSync(saPath)) ok(`Service account file found at ${saPath}`);
  else err(`Service account path not found: ${saPath}`);
} else if (saInline) {
  try {
    JSON.parse(saInline);
    ok('FIREBASE_SERVICE_ACCOUNT contains valid JSON');
  } catch (e) {
    err('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }
}

console.log('\nTip: copy .env.local.example to .env.local and edit values.');
