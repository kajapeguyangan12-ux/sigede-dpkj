# Vercel Deployment Setup Guide

## Quick Deploy Steps

### 1. Environment Variables Setup

Setelah project di-import ke Vercel, tambahkan environment variables berikut di **Vercel Dashboard** > **Settings** > **Environment Variables**:

#### Server-Side Variables (SENSITIVE - Jangan di-commit ke Git)

**FIREBASE_PROJECT_ID**
```
dpkj-ffc01
```

**FIREBASE_PRIVATE_KEY_ID**
```
e138070360d6e03545e694c15cf573174ce3c2e3
```

**FIREBASE_PRIVATE_KEY** (Copy entire value including quotes and \n)
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCR2iDXzftlphXw\nSyKPJek7UxwatTY5AdPgaqaXKzm073HDOH6F1hRUYYw7/RrMHEl7WHQmcv5eEWU7\ngwbATrTT+N13ZdSS2PRo7PsYo3yYzthzKHE8yH3I2WP/+RcRv+zv3AR+J+n7Cayo\nd9IA8XA/hCVMDexW4esBzp6/bF7hhRPtuU4s2M0dOersn9xV/bK0dNlxsuqZqzSB\nLatnwPJydR/cESpZ560yE0xMb1kIV8M6FrmdBsmimX/RYVMJd2Q3SmTlp7sh1vpb\n3f05Oez2FTm1oKRVBfOKllYNf4yZgN+7Ku5fBMatrKpgYvfjU/SkVD9Mp8Q1Kqp+\nWdI45dz3AgMBAAECggEAIG6dsP8nsNG+vSEn/SbT9xIjBLlY5lJGt/dfNewxt88q\nv9tXHxGckarjUQ+WHt8HY/smUMpvT6GUnigjny2hPiVvsbYeD81Yg+B2cWMhOKV+\nMhVDIN4AQmI8v1W3UIYZ/Lgy846Sk/TxxMBoHTeS2zzaQlAyRpuT82HroOtLKeBk\nv26kNiTB7qgfIYMEyvqtXr60gluGKZstcQDUv4kyI1z8KQ4yOolGmIFl1IzIpKeM\nz5rMDN4Wq0Ja4gJXmV643BGQa77nDGybt7fQlrz1xp/BACdg+bieZ0f4r7yyXqvn\nzzms7ENTCiFYmncJOeXAZWX71S1DLrdujrDmu24q2QKBgQDBTPqolYnPJ5tMGG6w\naSVNPU61FEmw0x46Q9uzTTEz/kzvaxPQ0KmEoBVxvesvqD/FlFrylCJBMJTILJ2+\n/sVqiglrBa8Nb6bsLTHhvLAnfWvTL+KdXehfnUc5XnhnNumvAb8seIZVTk/0HGzW\ne2WNc5GzCfjOd+sI6Fl0u61bYwKBgQDBKS2+wBlcBaO38CxaWqWNVaFeQ4Rf7aF1\noAXbW66vSKjbOXR2+47pEgSg69HomWAclGbrLObuIhJhvGMk0HSy0PWkLc3NPXr5\nmx61FI0QnI8OlcGpR7gFud33HROm0/GiC4TyDUbkO79jlQnLCBHq+TUPtaNyiKAa\nVmbcEbbOXQKBgBFlZiGJ468a92TvxfZmYA8Fd3Hgc4lQVqYTuU/3oHf3aOEbF9tx\nC/B9n7Bu0R2m3KZhZZXzMun+/0TMjx3DO+0MozBYgJqK89DJeHXCT3AeX3fQFWro\nKqOAOgq1r8xKKtmvJI9SAXTn6VYkwL7EuCz0u6YLPbMHI8XXc0WIJl/VAoGANhA3\nfIc50dbGPwpa76MlaQyJkN+m4k6ZfVmfqgjcOLVGha1sGo1IL5Xac8vtQYQEMZub\nvsEflZE1weM/gKNTtmTkC+LCEmrdy5UOIDKzVO3s4HEr9hxbtkaSiMK7qFrz6537\nxN/QcrsCU3X4ero0gabkohP9vmXdIeIDAh93IgUCgYEAj6hls3zZnampWnxgNkiZ\n6MvLDqOQg2SvblIb8DfcO1zj1kArNtgYMMwb2EyygwwLHelUrIJvJbIlIGycomDt\nkNXNJ/AFkrnQuGb0lAWC4mO0O9pMVk/ePW1o4t2IiI8Thq88cwyBueesVnU5ctyB\nEr26S0tAopjrOo5WzfjHQ+A=\n-----END PRIVATE KEY-----\n"
```

**FIREBASE_CLIENT_EMAIL**
```
firebase-adminsdk-fbsvc@dpkj-ffc01.iam.gserviceaccount.com
```

**FIREBASE_CLIENT_ID**
```
114977913128932684085
```

**RESEND_API_KEY** (for OTP Email)
```
re_hG6RqwEr_4UrAjgzaDNNjntZdqqqphzUb
```

### 2. Environment Settings

Untuk setiap variable di atas, pastikan centang semua environment:
- ✅ Production
- ✅ Preview
- ✅ Development

### 3. Deploy

Setelah semua environment variables ditambahkan, klik **"Deploy"** atau push code baru ke repository untuk trigger auto-deployment.

---

## Important Notes

- ✅ **Client-side variables** (NEXT_PUBLIC_*) sudah ada di `.env.production` dan akan otomatis terbaca
- ⚠️ **Server-side variables** (FIREBASE_*, RESEND_*) harus ditambahkan manual di Vercel Dashboard untuk keamanan
- 🔒 Jangan commit FIREBASE_PRIVATE_KEY atau RESEND_API_KEY ke Git
- 📍 Region deployment: Singapore (sin1)

## Troubleshooting

Jika deployment gagal:
1. Pastikan semua environment variables sudah ditambahkan
2. Check build logs di Vercel Dashboard
3. Pastikan tidak ada typo di environment variable names
4. Redeploy dengan klik "Redeploy" di deployment terakhir

## Contact

Untuk bantuan lebih lanjut, hubungi developer atau buka issue di repository.
