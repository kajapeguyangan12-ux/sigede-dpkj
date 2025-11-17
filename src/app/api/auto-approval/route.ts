import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { checkAndAutoApprove } from '../../../lib/layananPublikService';

export async function GET() {
  try {
    // Verifikasi bahwa request berasal dari cron job atau admin
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running auto-approval check...');
    
    const autoApprovedCount = await checkAndAutoApprove();
    
    const response = {
      success: true,
      autoApprovedCount,
      message: autoApprovedCount > 0 
        ? `Auto-approved ${autoApprovedCount} layanan requests`
        : 'No layanan requests require auto-approval',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Auto-approval check completed:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Auto-approval check failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  // Allow manual trigger for testing
  return GET();
}