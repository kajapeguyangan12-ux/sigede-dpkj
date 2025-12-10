import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPFromFirestore } from '@/lib/otpService';

export async function POST(request: NextRequest) {
  console.log('\n========================================');
  console.log('🚀 API /api/verify-otp - REQUEST RECEIVED');
  console.log('========================================');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📦 Request Body Parsed Successfully');
      console.log('📧 Email:', body.email);
      console.log('🔑 OTP:', body.otp);
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError.message);
      return NextResponse.json(
        { verified: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, otp } = body;

    // Validasi input
    console.log('\n🔍 Validating Input...');
    if (!email || !otp) {
      console.error('❌ Validation Failed: Missing email or OTP');
      return NextResponse.json(
        { verified: false, message: 'Email dan OTP harus diisi' },
        { status: 400 }
      );
    }
    
    // Validasi format OTP (harus 6 digit)
    if (!/^\d{6}$/.test(otp)) {
      console.error('❌ Invalid OTP Format:', otp);
      return NextResponse.json(
        { verified: false, message: 'Format OTP tidak valid. Harus 6 digit angka.' },
        { status: 400 }
      );
    }
    console.log('✅ Input validation passed');

    // Verify OTP dari Firestore
    console.log('\n🔍 Verifying OTP from Firestore...');
    const result = await verifyOTPFromFirestore(email, otp);
    
    if (result.valid) {
      console.log('✅✅✅ OTP VERIFIED SUCCESSFULLY ✅✅✅');
      console.log('Email:', email);
      console.log('========================================\n');
      
      return NextResponse.json(
        {
          verified: true,
          message: result.message
        },
        { status: 200 }
      );
    } else {
      console.log('❌ OTP VERIFICATION FAILED');
      console.log('Email:', email);
      console.log('Reason:', result.message);
      console.log('========================================\n');
      
      return NextResponse.json(
        {
          verified: false,
          message: result.message
        },
        { status: 400 }
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
        verified: false, 
        message: 'Terjadi kesalahan tidak terduga. Silakan coba lagi.',
        error_details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
