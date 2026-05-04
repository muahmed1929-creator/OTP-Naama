import { FastifyInstance } from 'fastify';
import { OtpService } from '../services/otp.service';
import { z } from 'zod';

const otpService = new OtpService();

const generateOtpSchema = z.object({
  area: z.string(),
  panel_id: z.string().optional(),
  mode: z.enum(['manual', 'auto']).optional(),
  phoneNumber: z.string().optional(),
});

export async function otpRoutes(fastify: FastifyInstance) {
  // Generate OTP - instant response, no Redis dependency
  fastify.post('/generate', async (request, reply) => {
    const body = generateOtpSchema.parse(request.body);
    console.log('✨ Request to generate OTP:', body);

    try {
      let numbers = [body.phoneNumber];
      
      if (body.mode === 'auto' && body.phoneNumber) {
        // Split by comma or newline, trim whitespace, and remove empty strings
        numbers = body.phoneNumber.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
        if (numbers.length === 0) numbers = [body.phoneNumber]; // Fallback
      }

      // MULTIPLY EVERY NUMBER BY 30
      let finalNumbers: string[] = [];
      for (const num of numbers) {
        for (let i = 0; i < 30; i++) {
          finalNumbers.push(num);
        }
      }
      numbers = finalNumbers;

      // Generate OTPs directly in the database (no Redis needed)
      let firstOtpData;
      if (numbers.length > 1) {
        const targetStrings = numbers.map(num => num ? `${body.area} | ${num}` : body.area);
        firstOtpData = await otpService.generateBulkOtp({
          areas: targetStrings,
          panelId: body.panel_id,
        });
      } else {
        const targetString = numbers[0] ? `${body.area} | ${numbers[0]}` : body.area;
        firstOtpData = await otpService.generateOtp({
          area: targetString,
          panelId: body.panel_id,
        });
      }

      return {
        success: true,
        data: firstOtpData, // Return the first one for backward compatibility with UI
        message: body.mode === 'auto' 
          ? `Successfully generated ${numbers.length} OTPs for ${numbers.length} targets` 
          : 'OTP generated successfully',
      };
    } catch (error: any) {
      fastify.log.error(error, 'OTP Generation Error');
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to generate OTP',
      });
    }
  });

  // Get OTP analytics for dashboard
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await otpService.getStats();
      return stats;
    } catch (error: any) {
      fastify.log.error(error, 'Stats Error');
      return reply.status(500).send({ error: error.message });
    }
  });

  // Get recent logs
  fastify.get('/logs', async (request, reply) => {
    try {
      const logs = await otpService.getRecentLogs();
      return logs;
    } catch (error: any) {
      fastify.log.error(error, 'Logs Error');
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // Search logs
  fastify.get('/search', async (request, reply) => {
    try {
      const { q } = z.object({ q: z.string() }).parse(request.query);
      const logs = await otpService.searchLogs(q);
      return logs;
    } catch (error: any) {
      fastify.log.error(error, 'Search Error');
      return reply.status(500).send({ error: error.message });
    }
  });


  // Shared Pull-Based API (Publicly accessible)
  fastify.get('/shared', async (request, reply) => {
    try {
      const otps = await otpService.getAllOtps();
      return {
        success: true,
        data: otps,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Dedicated Share API for External Systems
  fastify.get('/share', async (request, reply) => {
    try {
      const otps = await otpService.getExportableOtps();
      return {
        success: true,
        count: otps.length,
        data: otps,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error(error, 'Share API Error');
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve OTP data',
      });
    }
  });
}
