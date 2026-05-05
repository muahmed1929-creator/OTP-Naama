import { NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { PanelService } from '@/services/panel.service';
import { z } from 'zod';

const panelService = new PanelService();

const panelSchema = z.object({
  name: z.string(),
  apiUrl: z.string().url(),
  apiKey: z.string(),
});

export async function GET(request: Request) {
  const user = await validateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const panels = await panelService.getAllPanels();
    return NextResponse.json(panels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await validateRequest(request);
  if (!user || (user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized or not an admin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = panelSchema.parse(body);
    const panel = await panelService.createPanel(data);
    return NextResponse.json(panel);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
