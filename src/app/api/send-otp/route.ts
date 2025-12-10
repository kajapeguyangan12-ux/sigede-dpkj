import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateOTP, saveOTPToFirestore } from '@/lib/otpService';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('🚀 API /api/send-otp - REQUEST RECEIVED');
  console.log('========================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📦 Request Body Parsed Successfully');
      console.log('📧 Email:', body.email);
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError.message);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validasi input
    console.log('\n🔍 Validating Input...');
    if (!email) {
      console.error('❌ Validation Failed: Missing email');
      return NextResponse.json(
        { success: false, message: 'Email harus diisi' },
        { status: 400 }
      );
    }
    console.log('✅ Input validation passed');

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid Email Format:', email);
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      );
    }
    console.log('✅ Email format valid');

    // Check Resend API Key
    console.log('\n🔍 Checking Environment Variables...');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET');

    // Check if API key is valid (not placeholder)
    const isValidApiKey = process.env.RESEND_API_KEY && 
                          process.env.RESEND_API_KEY.startsWith('re_') && 
                          !process.env.RESEND_API_KEY.includes('YourResendAPIKeyHere');

    if (!isValidApiKey) {
      console.warn('⚠️⚠️⚠️ RESEND API KEY NOT CONFIGURED - DEVELOPMENT MODE ⚠️⚠️⚠️');
      console.warn('📝 OTP will be logged to console only (email not sent)');
      console.warn('📝 To enable email sending:');
      console.warn('   1. Sign up at https://resend.com/signup');
      console.warn('   2. Get API key from dashboard');
      console.warn('   3. Update RESEND_API_KEY in .env.local');
      console.warn('   4. Restart dev server');
      console.warn('========================================\n');
    }

    // Generate OTP 6 digit
    const otp = generateOTP();
    console.log('\n🔑 Generated OTP:', otp);

    // Simpan OTP ke Firestore
    console.log('💾 Saving OTP to Firestore...');
    try {
      await saveOTPToFirestore(email, otp);
      console.log('✅ OTP saved to Firestore successfully');
    } catch (firestoreError: any) {
      console.error('❌ Firestore Error:', firestoreError.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal menyimpan OTP. Silakan coba lagi.' 
        },
        { status: 500 }
      );
    }

    console.log('\n========================================');
    console.log('📧 SENDING OTP EMAIL VIA RESEND');
    console.log('========================================');
    console.log('To:', email);
    console.log('OTP Code:', otp);
    console.log('========================================\n');

    // Development Mode: Skip email sending if API key not configured
    if (!isValidApiKey) {
      console.log('🔧 DEVELOPMENT MODE - EMAIL NOT SENT');
      console.log('📝 Use this OTP for testing:', otp);
      console.log('📝 Valid for 5 minutes');
      console.log('========================================\n');
      
      return NextResponse.json(
        {
          success: true,
          message: '⚠️ MODE DEVELOPMENT: Email belum dikonfigurasi. OTP tersedia di console server untuk testing.',
          devMode: true,
          devOtp: otp // For development only!
        },
        { status: 200 }
      );
    }

    // Email HTML template - Professional design
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kode Verifikasi OTP - SiGeDe DPKJ</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      SiGeDe DPKJ
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #fef2f2; font-size: 14px;">
                      Sistem Informasi Desa Dauh Puri Kaja
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                      Verifikasi Email Anda
                    </h2>
                    
                    <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      Terima kasih telah mendaftar di SiGeDe DPKJ. Gunakan kode OTP di bawah ini untuk memverifikasi email Anda:
                    </p>
                    
                    <!-- OTP Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 25px;">
                          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                            Kode Verifikasi Anda
                          </p>
                          <p style="margin: 0; color: #dc2626; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                        ⚠️ <strong>Penting:</strong> Kode OTP ini berlaku selama <strong>5 menit</strong> dan hanya dapat digunakan sekali.
                      </p>
                    </div>
                    
                    <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Jika Anda tidak melakukan registrasi di SiGeDe DPKJ, abaikan email ini.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                      © ${new Date().getFullYear()} SiGeDe DPKJ - Desa Dauh Puri Kaja
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Email otomatis, mohon tidak membalas email ini
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Kirim email via Resend
    console.log('📤 Sending email via Resend...');
    try {
      // Email sender configuration
      // Default: onboarding@resend.dev (for testing)
      // Production: Setup custom domain di Resend Dashboard
      // Docs: https://resend.com/docs/dashboard/domains/introduction
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'SiGeDe DPKJ <onboarding@resend.dev>';
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: 'Kode OTP Registrasi SiGeDe DPKJ',
        html: emailHTML,
        // Optional: Add reply-to for production
        // replyTo: 'support@yourdomain.com',
        // Optional: Add tags for tracking
        tags: [
          { name: 'category', value: 'otp' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      });

      if (error) {
        console.error('\n❌❌❌ RESEND API ERROR ❌❌❌');
        console.error('Error:', JSON.stringify(error, null, 2));
        console.error('========================================\n');

        // User-friendly error messages
        let userMessage = 'Gagal mengirim email OTP. ';
        if (error.message?.includes('API key')) {
          userMessage += 'Konfigurasi email tidak valid. Hubungi administrator.';
        } else if (error.message?.includes('rate limit')) {
          userMessage += 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.';
        } else {
          userMessage += 'Silakan coba lagi atau hubungi administrator.';
        }

        return NextResponse.json(
          { 
            success: false, 
            message: userMessage,
            error_type: 'EMAIL_SEND_ERROR',
            error_code: error.name,
            error_details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        );
      }

      console.log('✅✅✅ EMAIL SENT SUCCESSFULLY ✅✅✅');
      console.log('Email ID:', data?.id);
      console.log('Sent to:', email);
      console.log('From:', fromEmail);
      console.log('========================================\n');

      return NextResponse.json(
        {
          success: true,
          message: 'Kode OTP telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
          emailId: data?.id
        },
        { status: 200 }
      );

    } catch (emailError: any) {
      console.error('\n❌❌❌ EMAIL SEND ERROR ❌❌❌');
      console.error('Error Name:', emailError.name);
      console.error('Error Message:', emailError.message);
      console.error('Error Details:', JSON.stringify(emailError, null, 2));
      console.error('========================================\n');

      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal mengirim email OTP. Silakan coba lagi atau hubungi administrator.',
          error_type: 'EMAIL_SEND_ERROR',
          error_details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('\n❌❌❌ UNEXPECTED ERROR ❌❌❌');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('========================================\n');
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan tidak terduga. Silakan coba lagi.',
        error_type: 'UNEXPECTED_ERROR',
        error_details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
