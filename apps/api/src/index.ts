import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import { otpRoutes } from './routes/otp';
import { authRoutes } from './routes/auth';
import { panelRoutes } from './routes/panels';
import { authPlugin } from './plugins/auth';
// Workers disabled until Redis is available
// import './workers';
// import './workers/cron';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    });
    return;
  }

  if (error.name === 'ZodError') {
    const issues = (error as any).issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
    reply.status(400).send({
      error: 'Validation Error',
      message: `Invalid request: ${issues}`,
      details: error
    });
    return;
  }

  fastify.log.error(error);
  reply.status(500).send({ 
    error: 'Internal Server Error',
    message: error.message 
  });
});

async function bootstrap() {
  // Premium Security Headers
  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy: false, // Disabled for API server (frontend handles its own CSP)
    crossOriginEmbedderPolicy: false, // Must be false for cross-origin API calls
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false, // Must be false for cross-origin API calls
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // Strict CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL || 'https://your-production-domain.com')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-123',
  });

  // Premium Anti-DDoS Rate Limiting
  await fastify.register(rateLimit, {
    max: 100, // strictly 100 requests
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'], // exempt localhost from limits if needed internally
    errorResponseBuilder: function (request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Premium Protection Active: You have exceeded your rate limit. Please wait before trying again.`
      }
    }
  });

  // Public Routes (Auth)
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Protected Routes Middleware
  await fastify.register(authPlugin);

  // Routes
  await fastify.register(otpRoutes, { prefix: '/otp' });
  await fastify.register(panelRoutes, { prefix: '/panels' });

  // Dashboard Metrics (Simplified for now)
  fastify.get('/metrics', async (request, reply) => {
    // This will be used by the frontend
    return { status: 'ok' };
  });

  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server ready at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
