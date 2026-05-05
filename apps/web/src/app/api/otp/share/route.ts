import { NextResponse } from 'next/server';
import { OtpService } from '@/services/otp.service';

const otpService = new OtpService();

export async function GET() {
  try {
    const otps = await otpService.getExportableOtps();
    return NextResponse.json({
      success: true,
      count: otps.length,
      data: otps,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve OTP data',
    }, { status: 500 });
  }
}
