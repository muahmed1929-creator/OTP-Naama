import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { OtpService } from '@/services/otp.service';
import { z } from 'zod';

const otpService = new OtpService();

const generateSchema = z.object({
  area: z.string(),
  phoneNumber: z.string(),
  mode: z.enum(['manual', 'auto']),
  panel_id: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await validateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { area, phoneNumber, mode, panel_id } = generateSchema.parse(body);

    const fullArea = `${area} | ${phoneNumber}`;

    let result;
    if (mode === 'auto') {
      // Split bulk numbers
      const numbers = phoneNumber.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
      const areas = numbers.map(n => `${area} | ${n}`);
      result = await otpService.generateBulkOtp({ areas, panelId: panel_id });
    } else {
      result = await otpService.generateOtp({ area: fullArea, panelId: panel_id });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
