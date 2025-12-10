# Setup Email Production dengan Nodemailer

## Langkah-langkah Setup untuk Production

### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Setup Gmail App Password

Jika menggunakan Gmail:

1. Buka [Google Account Settings](https://myaccount.google.com/)
2. Pilih "Security"
3. Enable "2-Step Verification" jika belum
4. Scroll ke "App passwords"
5. Generate app password untuk aplikasi
6. Copy password yang di-generate

### 3. Setup Environment Variables

Buat file `.env.local` di root project (jika belum ada):

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
EMAIL_FROM=noreply@desadauhpurikaja.com

# Optional: Email Service Provider
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 4. Uncomment Kode di `src/app/api/send-otp/route.ts`

Cari bagian komentar di file tersebut:

```typescript
// TODO: Untuk production, integrate dengan email service
```

Dan uncomment kode nodemailer di bawahnya.

### 5. Update Kode Production

Edit file `src/app/api/send-otp/route.ts` untuk menggunakan Nodemailer:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, otp } = body;

    // Validasi input
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email dan OTP harus diisi' },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Setup transporter
    const transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Kode Verifikasi OTP - Registrasi Warga DPKJ',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">Desa Dauh Puri Kaja</h1>
              <p style="color: #6b7280; margin-top: 10px;">Sistem Informasi Desa</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Halo ${name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Terima kasih telah mendaftar sebagai warga Desa Dauh Puri Kaja.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Gunakan kode OTP berikut untuk memverifikasi email Anda:
            </p>
            
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <div style="background-color: white; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #dc2626; font-family: monospace;">
                  ${otp}
                </p>
              </div>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #dc2626; margin: 0; font-weight: bold;">
                ⚠️ Kode ini akan kadaluarsa dalam 5 menit
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              Jangan bagikan kode ini kepada siapapun. Tim Desa Dauh Puri Kaja tidak akan pernah meminta kode OTP Anda.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Jika Anda tidak merasa melakukan pendaftaran, abaikan email ini.
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                Email ini dikirim secara otomatis, mohon tidak membalas email ini.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">
                Salam,<br>
                <strong>Tim Desa Dauh Puri Kaja</strong>
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    console.log('📧 Sending OTP email to:', email);
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'OTP berhasil dikirim ke email'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal mengirim OTP. Silakan coba lagi.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
```

### 6. Test Email di Development

Setelah setup, test dengan:

```bash
npm run dev
```

Kemudian coba registrasi dan pastikan email OTP terkirim ke inbox.

## Alternatif Email Service

### SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: email,
  from: process.env.EMAIL_FROM!,
  subject: 'Kode Verifikasi OTP - Registrasi Warga DPKJ',
  html: '...'
};

await sgMail.send(msg);
```

### Resend (Modern Email API)

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: email,
  subject: 'Kode Verifikasi OTP - Registrasi Warga DPKJ',
  html: '...'
});
```

### AWS SES

```bash
npm install @aws-sdk/client-ses
```

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const client = new SESClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const command = new SendEmailCommand({
  Source: process.env.EMAIL_FROM,
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: 'Kode Verifikasi OTP - Registrasi Warga DPKJ' },
    Body: { Html: { Data: '...' } }
  }
});

await client.send(command);
```

## Troubleshooting

### Email tidak terkirim

1. **Cek credentials**: Pastikan EMAIL_USER dan EMAIL_PASSWORD benar
2. **Cek firewall**: Pastikan port 587 (SMTP) tidak diblock
3. **Cek spam folder**: Email mungkin masuk ke spam
4. **Enable "Less secure app access"**: Untuk Gmail lama
5. **Gunakan App Password**: Untuk Gmail dengan 2FA

### Email masuk spam

1. **Setup SPF Record**: Di DNS domain Anda
2. **Setup DKIM**: Untuk verifikasi pengirim
3. **Setup DMARC**: Untuk policy email
4. **Gunakan domain sendiri**: Jangan gunakan free email
5. **Warm up email**: Kirim email bertahap, jangan langsung banyak

### Rate Limiting

- Gmail: 500 email/hari (free), 2000 email/hari (Google Workspace)
- SendGrid: 100 email/hari (free), unlimited (paid)
- AWS SES: 200 email/hari (free), pay per email setelahnya

## Best Practices

1. **Gunakan environment variables** untuk credentials
2. **Jangan commit credentials** ke git
3. **Implementasi rate limiting** untuk prevent abuse
4. **Log semua email** untuk debugging
5. **Implement retry mechanism** untuk failed emails
6. **Monitor email deliverability** rates
7. **Setup email templates** yang responsive
8. **Test di berbagai email client** (Gmail, Outlook, Yahoo)

## Security Tips

1. **Rotate credentials** secara berkala
2. **Limit OTP lifetime** (5 menit sudah cukup)
3. **Implement throttling** untuk prevent spam
4. **Validate email format** sebelum kirim
5. **Log suspicious activities**
6. **Implement CAPTCHA** jika perlu
7. **Rate limit per IP address**

## Monitoring

Setup monitoring untuk:
- Email delivery rate
- Bounce rate
- Open rate
- Failed deliveries
- API errors
- Response time

Tools yang bisa digunakan:
- AWS CloudWatch (untuk SES)
- SendGrid Analytics
- Google Cloud Monitoring
- Custom logging dengan Sentry/LogRocket

## Support

Jika ada masalah saat setup, dokumentasikan error message dan cek:
1. Console logs
2. Email service provider dashboard
3. Network tab di browser DevTools
4. Server logs
