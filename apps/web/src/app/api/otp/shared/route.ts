import { NextResponse } from 'next/server';
import { OtpService } from '@/services/otp.service';

const otpService = new OtpService();

export async function GET() {
  try {
    const otps = await otpService.getAllOtps();
    return NextResponse.json({
      success: true,
      data: otps,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
