import { otpQueue } from '@otp-saas/queue';
import { OtpService } from '../services/otp.service';
import { Worker } from '@otp-saas/queue';

const otpService = new OtpService();

// Worker to process automatic generation tasks
const autoOtpWorker = new Worker('otp-generation', async (job) => {
  console.log('🤖 Auto-generating OTP...');
  await otpService.generateOtp({
    area: 'AUTOMATIC_SYSTEM',
    // No specific panel_id means it goes to all
  });
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    connectTimeout: 1000,
  }
});

autoOtpWorker.on('error', (err) => {
  // Silent error
});

// Schedule the cron job
async function scheduleCron() {
  try {
    // Clear existing repeatable jobs to avoid duplicates on restart
    const jobs = await otpQueue.getRepeatableJobs();
    for (const job of jobs) {
      await otpQueue.removeRepeatableByKey(job.key);
    }

    // Add new cron job: Every 1 minute
    await otpQueue.add('auto-generate', {}, {
      repeat: {
        pattern: '*/1 * * * *', // Every minute
      }
    });
    
    console.log('⏰ Cron job scheduled: Every 1 minute');
  } catch (err: any) {
    // console.error('Failed to schedule cron job (Redis likely down):', err.message);
  }
}

scheduleCron();
