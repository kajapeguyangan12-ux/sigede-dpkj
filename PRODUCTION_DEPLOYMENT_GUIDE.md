# 🚀 Production Deployment Guide - OTP Email System

## ✅ Checklist Sebelum Production

### 1. ✅ Resend API Setup
- [ ] Sign up di https://resend.com/signup
- [ ] Verifikasi email
- [ ] Create API Key
- [ ] Update `RESEND_API_KEY` di `.env.local` atau environment variables
- [ ] Test send email dari development

### 2. ✅ Firestore Configuration
- [ ] Collection `email_otps` ada
- [ ] Rules sudah di-deploy: `firebase deploy --only firestore:rules`
- [ ] Test write/read dari development
- [ ] Setup indexes jika diperlukan

### 3. ✅ Environment Variables
```env
# Required
RESEND_API_KEY=re_YourActualAPIKey123456789

# Optional
RESEND_FROM_EMAIL=SiGeDe DPKJ <noreply@yourdomain.com>
NODE_ENV=production
```

### 4. ✅ Custom Domain (Recommended)
- [ ] Beli domain (optional, tapi recommended)
- [ ] Verify domain di Resend Dashboard
- [ ] Setup DNS records (SPF, DKIM, DMARC)
- [ ] Update `RESEND_FROM_EMAIL` di environment

---

## 📊 Resend Limits & Pricing

### Free Tier
- ✅ **100 emails/day**
- ✅ **3,000 emails/month**
- ✅ Unlimited domains
- ✅ Full API access
- ✅ Dashboard & logs
- ⚠️ Using `onboarding@resend.dev` sender

**Estimasi:**
- 100 registrations/day = OK
- 3,000 registrations/month = OK

### Pro Plan ($20/month)
- ✅ **50,000 emails/month**
- ✅ Priority support
- ✅ Custom SMTP
- ✅ Webhooks
- ✅ Better deliverability

**Upgrade jika:**
- Lebih dari 100 registrations/day
- Butuh custom domain dengan reputation tinggi
- Butuh advanced analytics

---

## 🌐 Custom Domain Setup (Optional)

### Kenapa Pakai Custom Domain?

**❌ Tanpa Custom Domain:**
- Sender: `onboarding@resend.dev`
- Kemungkinan masuk spam lebih tinggi
- Terlihat kurang profesional

**✅ Dengan Custom Domain:**
- Sender: `noreply@sigede-dpkj.com`
- Deliverability lebih baik
- Branding profesional
- Trustworthy

### Langkah Setup:

#### 1. Beli Domain
Beli domain di:
- Namecheap: https://www.namecheap.com
- GoDaddy: https://www.godaddy.com
- Niagahoster: https://www.niagahoster.co.id

Contoh domain:
- `sigede-dpkj.com`
- `sigede-kaja.id`
- `dpkj.desa.id`

#### 2. Add Domain di Resend

1. Login ke **Resend Dashboard**
2. Klik **Domains** → **Add Domain**
3. Input domain Anda (atau subdomain: `mail.yourdomain.com`)
4. Klik **Add**

#### 3. Setup DNS Records

Resend akan memberikan 3 DNS records:

**SPF Record (TXT):**
```
Type: TXT
Host: @
Value: v=spf1 include:resend.com ~all
```

**DKIM Record (TXT):**
```
Type: TXT
Host: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBA...
```

**DMARC Record (TXT):**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

#### 4. Add Records di DNS Provider

**Namecheap:**
1. Login → Domain List → Manage
2. Advanced DNS → Add New Record
3. Copy-paste records dari Resend

**Cloudflare:**
1. Login → Select Domain → DNS
2. Add Record → TXT
3. Copy-paste records dari Resend

#### 5. Verify Domain

1. Kembali ke **Resend Dashboard**
2. Klik **Verify** di domain Anda
3. Tunggu propagasi DNS (5 menit - 24 jam)
4. Status harus **Verified** ✅

#### 6. Update Environment Variable

```env
RESEND_FROM_EMAIL=SiGeDe DPKJ <noreply@sigede-dpkj.com>
```

---

## 🔒 Security Best Practices

### 1. API Key Management

**Development:**
```env
# .env.local (NOT committed to git)
RESEND_API_KEY=re_dev_123456789
```

**Production (Vercel):**
```
Dashboard → Settings → Environment Variables
RESEND_API_KEY=re_prod_987654321
```

**Production (VPS/Server):**
```bash
# Use secrets management
export RESEND_API_KEY="re_prod_987654321"
```

### 2. Rate Limiting

Tambahkan rate limiting untuk prevent abuse:

```typescript
// Optional: Add to API route
const rateLimitMap = new Map();

function rateLimit(email: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(email) || [];
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter((time: number) => now - time < 3600000);
  
  if (recentAttempts.length >= 3) {
    return false; // Max 3 OTP per hour per email
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(email, recentAttempts);
  return true;
}
```

### 3. Email Validation

Gunakan library untuk validasi email yang lebih strict:

```bash
npm install email-validator
```

```typescript
import * as EmailValidator from 'email-validator';

if (!EmailValidator.validate(email)) {
  return NextResponse.json({ 
    success: false, 
    message: 'Email tidak valid' 
  });
}
```

### 4. Firestore Security

Pastikan rules ketat:

```javascript
match /email_otps/{otpId} {
  // Only allow server-side writes (via Admin SDK)
  allow create: if false; // Disable client-side creates
  allow read: if false;   // Disable client-side reads
  allow update: if false;
  allow delete: if false;
}
```

Lalu gunakan Firebase Admin SDK di API route untuk write:

```typescript
import { adminDb } from '@/lib/firebaseAdmin';

await adminDb.collection('email_otps').add({
  email,
  otp,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  expiresAt: admin.firestore.Timestamp.fromDate(expiryDate)
});
```

---

## 📈 Monitoring & Analytics

### 1. Resend Dashboard

Monitor email delivery:
- **Logs:** https://resend.com/logs
- Lihat status: Sent, Delivered, Bounced, Failed
- Track delivery rate

### 2. Firestore Monitoring

Track OTP usage:

```typescript
// Add to otpService.ts
export async function getOTPStats() {
  const snapshot = await getDocs(collection(db, 'email_otps'));
  return {
    totalActive: snapshot.size,
    expiredCount: snapshot.docs.filter(doc => 
      doc.data().expiresAt.toDate() < new Date()
    ).length
  };
}
```

### 3. Google Analytics (Optional)

Track OTP success/fail:

```typescript
// Track OTP sent
gtag('event', 'otp_sent', {
  event_category: 'registration',
  event_label: 'email_verification'
});

// Track OTP verified
gtag('event', 'otp_verified', {
  event_category: 'registration',
  event_label: 'email_verification_success'
});
```

---

## 🧪 Pre-Production Testing

### Test Checklist:

#### ✅ Functionality Test
- [ ] OTP generated correctly (6 digits)
- [ ] OTP saved to Firestore with correct expiry
- [ ] Email sent successfully
- [ ] Email received within 1 minute
- [ ] OTP verification works
- [ ] OTP deleted after verification
- [ ] Expired OTP rejected
- [ ] Wrong OTP rejected
- [ ] Resend OTP works

#### ✅ Email Quality Test
- [ ] Email tidak masuk spam
- [ ] HTML rendering correct (Gmail, Outlook, Yahoo)
- [ ] Mobile responsive
- [ ] Links work (jika ada)
- [ ] Branding correct (logo, colors)

#### ✅ Security Test
- [ ] API key hidden in responses
- [ ] No OTP visible in client-side code (production)
- [ ] Rate limiting works
- [ ] Firestore rules enforced

#### ✅ Performance Test
- [ ] API response < 2 seconds
- [ ] Email delivery < 1 minute
- [ ] Firestore queries optimized
- [ ] No memory leaks

#### ✅ Error Handling Test
- [ ] Invalid email format rejected
- [ ] API key missing handled gracefully
- [ ] Resend API errors handled
- [ ] Firestore errors handled
- [ ] Network errors handled

---

## 🚀 Deployment Steps

### Deploy ke Vercel (Recommended)

#### 1. Push to GitHub
```bash
git add .
git commit -m "Add OTP email system with Resend"
git push origin main
```

#### 2. Connect to Vercel
1. Login ke **Vercel**: https://vercel.com
2. Import repository dari GitHub
3. Project name: `sigede-dpkj`

#### 3. Configure Environment Variables
```
RESEND_API_KEY=re_YourProductionAPIKey
RESEND_FROM_EMAIL=SiGeDe DPKJ <noreply@yourdomain.com>
NODE_ENV=production

# Firebase configs (copy from .env.local)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... etc
```

#### 4. Deploy
- Klik **Deploy**
- Tunggu build selesai
- Test production URL

### Deploy ke VPS/Server

#### 1. Build Production
```bash
npm run build
```

#### 2. Set Environment Variables
```bash
export RESEND_API_KEY="re_YourProductionAPIKey"
export NODE_ENV="production"
```

#### 3. Start Production Server
```bash
npm start
# atau dengan PM2:
pm2 start npm --name "sigede-dpkj" -- start
```

---

## 📞 Support & Troubleshooting

### Issue: Email masuk spam

**Solusi:**
1. Setup custom domain dengan SPF/DKIM/DMARC
2. Tambahkan unsubscribe link
3. Avoid spam trigger words
4. Test dengan mail-tester.com

### Issue: Email tidak sampai

**Cek:**
1. Resend Dashboard → Logs → Lihat status
2. Email address valid?
3. Rate limit exceeded?
4. Domain verified?

### Issue: Slow email delivery

**Causes:**
- Resend API delay (rare)
- DNS propagation
- Email provider filtering

**Monitor:**
- Resend Dashboard → Logs → Delivery time

---

## ✅ Production Launch Checklist

### Pre-Launch:
- [ ] Resend API key configured
- [ ] Custom domain setup & verified (optional)
- [ ] Firestore rules deployed
- [ ] Environment variables set
- [ ] Testing complete
- [ ] Error monitoring setup
- [ ] Rate limiting implemented
- [ ] Documentation complete

### Launch:
- [ ] Deploy to production
- [ ] Test from production URL
- [ ] Send test OTP to real email
- [ ] Monitor Resend logs
- [ ] Monitor Firestore usage
- [ ] Check error rates

### Post-Launch:
- [ ] Monitor first 100 registrations
- [ ] Track email delivery rate
- [ ] Track spam reports
- [ ] Optimize based on metrics
- [ ] Scale if needed (upgrade Resend plan)

---

**🎉 Ready for Production! Good luck with your launch!**
