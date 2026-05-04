import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request, reply) => {
    const body = authSchema.parse(request.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
      });

      // Generate a secure API key for the user
      const apiKey = await prisma.apiKey.create({
        data: {
          key: `key_${crypto.randomBytes(16).toString('hex')}`,
          name: 'Default Key',
          userId: user.id,
        },
      });

      return { 
        success: true, 
        message: 'User registered successfully', 
        apiKey: apiKey.key,
        user: { id: user.id, email: user.email, name: user.name, role: (user as any).role }
      };
    } catch (error: any) {
      fastify.log.error('Registration Error: ' + error.message);
      throw error; // Let the global error handler handle it
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { apiKeys: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: (user as any).role });

    return { 
      success: true, 
      token, 
      apiKey: (user as any).apiKeys[0]?.key,
      user: { id: user.id, email: user.email, name: user.name, role: (user as any).role }
    };
  });

  fastify.post('/create-employee', async (request, reply) => {
    const admin = request.user as any;
    if (admin.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only admins can create employees' });
    }

    const body = authSchema.parse(request.body);
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: 'EMPLOYEE',
      } as any, // Cast to any to bypass outdated Prisma types
    });

    return { success: true, user: { id: user.id, email: user.email, name: user.name, role: (user as any).role } };
  });
}
