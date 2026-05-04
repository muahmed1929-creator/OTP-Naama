import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma';

const authPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health check, auth routes, or the shared pull API
    const isPublicRoute = 
      request.url.includes('/auth/') || 
      request.url === '/health' || 
      request.url === '/metrics' ||
      request.url === '/otp/shared' ||
      request.url === '/otp/share';
    
    if (isPublicRoute) {
      return;
    }

    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      fastify.log.warn(`Blocked request to ${request.url} - Missing API Key`);
      return reply.status(401).send({ error: 'API key is required' });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });

    if (!keyRecord) {
      return reply.status(401).send({ error: 'Invalid API key' });
    }

    // Add user info to request
    (request as any).user = { 
      id: keyRecord.userId, 
      apiKeyId: keyRecord.id,
      role: (keyRecord.user as any).role 
    };
  });
};

export const authPlugin = fp(authPluginCallback);
