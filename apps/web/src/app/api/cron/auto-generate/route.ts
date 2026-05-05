import { NextResponse } from 'next/server';
import { OtpService } from '@/services/otp.service';

const otpService = new OtpService();

export async function GET(request: Request) {
  // Check for Vercel Cron authorization header if you want to secure it
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  console.log('⏰ Cron: Auto-generating OTPs...');
  try {
    await otpService.generateOtp({
      area: 'AUTOMATIC_SYSTEM',
    });
    return NextResponse.json({ success: true, message: 'Auto-generation complete' });
  } catch (error: any) {
    console.error('❌ Cron Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
