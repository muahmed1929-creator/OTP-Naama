import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1, // Fail fast to prevent event loop blocking
  enableOfflineQueue: false,
  connectTimeout: 500,
});

connection.on('error', (err) => {
  // Silenced Redis Connection Error to prevent log spam
});

export const otpQueue = new Queue('otp-generation', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const panelQueue = new Queue('panel-distribution', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export { Worker, QueueEvents, connection };
