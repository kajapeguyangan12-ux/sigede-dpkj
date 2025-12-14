# 🚀 Deployment Guide - Vercel Production

## 📋 Checklist Sebelum Deploy

### ✅ Yang Sudah Siap:
- [x] Build berhasil tanpa error
- [x] TypeScript check passed
- [x] Next.js config optimized untuk production
- [x] Security headers configured
- [x] Image optimization enabled
- [x] Role-based access control implemented
- [x] Firebase integration ready

## 🔧 Setup di Vercel

### 1. Environment Variables yang WAJIB di-set di Vercel:

```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDiwZyH9yQvJvjW4otawrNrwwbEYfMQ1vI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dpkj-ffc01.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dpkj-ffc01
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dpkj-ffc01.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=528333091299
NEXT_PUBLIC_FIREBASE_APP_ID=1:528333091299:web:124c5d67f0c70a51a0b0d6

# Firebase Admin SDK (Server Side - RAHASIA!)
FIREBASE_PROJECT_ID=dpkj-ffc01
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@dpkj-ffc01.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Service (Optional)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

### 2. Cara Set Environment Variables di Vercel:

1. Buka project di Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. Add setiap variable di atas
4. Pilih **Production**, **Preview**, dan **Development**
5. Klik **Save**

### 3. Build & Output Settings:

**Framework Preset:** Next.js  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`  
**Node Version:** 20.x (otomatis dari Vercel)

### 4. Domain Settings (Optional):

Jika punya custom domain:
- Go to **Settings** → **Domains**
- Add domain Anda
- Configure DNS sesuai instruksi Vercel

## 🚀 Deploy ke Vercel

### Via GitHub (Recommended):

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Production ready deployment"
   git push origin main
   ```

2. **Connect ke Vercel:**
   - Login ke [vercel.com](https://vercel.com)
   - Click **Add New Project**
   - Import dari GitHub repository
   - Pilih repository ini
   - Configure project (isi environment variables)
   - Click **Deploy**

### Via Vercel CLI:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Preview deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

## ⚠️ Important Notes:

### 🔒 Security:
- **JANGAN commit** file `.env.local` ke Git
- **FIREBASE_PRIVATE_KEY** harus dalam format: `"-----BEGIN...\\n...\\n-----END...\\n"`
- Pastikan Firebase Rules sudah proper di production

### 🎯 Testing After Deploy:
1. Test login admin & masyarakat
2. Test upload images (Firebase Storage)
3. Test role permissions (kepala_desa untuk analisis)
4. Test responsive design di mobile
5. Check console untuk errors

### 📊 Monitoring:
- Vercel Analytics: Otomatis enabled
- Vercel Logs: Available di Dashboard
- Firebase Console: Monitor database & storage usage

## 🐛 Troubleshooting:

### Build Error:
```bash
# Local test build
npm run build

# Check logs di Vercel Dashboard → Deployments → [deployment] → Build Logs
```

### Environment Variables Not Working:
- Pastikan prefix `NEXT_PUBLIC_` untuk client-side variables
- Redeploy setelah update env vars
- Check typo di nama variable

### Firebase Connection Error:
- Verify Firebase config di Vercel env vars
- Check Firebase project settings
- Ensure Storage CORS configured

## 📞 Support:

Jika ada masalah saat deployment:
1. Check Vercel build logs
2. Check browser console errors
3. Check Firebase console

---

**Good luck with your deployment! 🎉**
