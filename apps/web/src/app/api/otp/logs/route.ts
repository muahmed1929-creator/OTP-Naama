import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { OtpService } from '@/services/otp.service';

const otpService = new OtpService();

export async function GET(request: Request) {
  const user = await validateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await otpService.getRecentLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
