import { Worker } from '@otp-saas/queue';
import { prisma } from '../lib/prisma';
import axios from 'axios';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Worker for panel distribution
const panelWorker = new Worker('panel-distribution', async (job) => {
  const { otpId, otpCode, area, panelId } = job.data;

  // Determine which panels to send to
  const panels = panelId 
    ? await prisma.panel.findMany({ where: { id: panelId } })
    : await prisma.panel.findMany();

  for (const panel of panels) {
    try {
      const response = await axios.post(panel.apiUrl, {
        otp: otpCode,
        area: area,
      }, {
        headers: {
          'Authorization': `Bearer ${panel.apiKey}`,
        },
        timeout: 5000,
      });

      // Log success
      await prisma.log.create({
        data: {
          otpId,
          panelId: panel.id,
          status: 'SUCCESS',
          response: response.data,
        },
      });

      // Update OTP status if at least one panel succeeded
      await prisma.otp.update({
        where: { id: otpId },
        data: { status: 'SENT' },
      });

    } catch (error: any) {
      console.error(`Failed to send OTP to panel ${panel.name}:`, error.message);
      
      // Log failure
      await prisma.log.create({
        data: {
          otpId,
          panelId: panel.id,
          status: 'FAILED',
          response: { error: error.message, details: error.response?.data },
        },
      });

      // Update OTP status to FAILED if not already SENT
      const currentOtp = await prisma.otp.findUnique({ where: { id: otpId } });
      if (currentOtp?.status !== 'SENT') {
        await prisma.otp.update({
          where: { id: otpId },
          data: { status: 'FAILED' },
        });
      }
    }

    // 🕒 Add 5 seconds delay between each panel API call to prevent getting blocked for spam
    await sleep(5000);
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    connectTimeout: 1000,
  },
  limiter: {
    max: 1, // Process maximum 1 job...
    duration: 5000, // ...every 5 seconds
  }
});

panelWorker.on('error', (err) => {
  // Silent error
});

console.log('👷 Workers initialized (Redis-dependent features may be limited)');
