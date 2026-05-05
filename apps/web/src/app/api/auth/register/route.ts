import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN', // First user is Admin? Usually handled differently but following Fastify logic
      } as any,
    });

    // Generate a secure API key for the user
    const apiKey = await prisma.apiKey.create({
      data: {
        key: `key_${crypto.randomBytes(16).toString('hex')}`,
        name: 'Default Key',
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      apiKey: apiKey.key,
      user: { id: user.id, email: user.email, name: user.name, role: (user as any).role }
    });
  } catch (error: any) {
    console.error('Registration Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code // Prisma error code if applicable
    });
    return NextResponse.json({ 
      error: error.message,
      details: error.code ? `Prisma Error: ${error.code}` : undefined
    }, { status: 400 });
  }
}
