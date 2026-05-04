import { prisma } from '../lib/prisma';

export class OtpService {
  async generateOtp({ area, panelId }: { area: string; panelId?: string }) {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Store directly in PostgreSQL (instant, no Redis needed)
    const otp = await prisma.otp.create({
      data: {
        otpCode,
        area,
        panelId: panelId || null,
        status: 'PENDING',
        expiresAt,
      },
    });

    console.log(`✅ OTP ${otpCode} generated for ${area}`);
    return otp;
  }

  async generateBulkOtp({ areas, panelId }: { areas: string[]; panelId?: string }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const data = areas.map((area) => ({
      otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
      area,
      panelId: panelId || null,
      status: 'PENDING' as any,
      expiresAt,
    }));

    // Insert all at once
    await prisma.otp.createMany({
      data,
      skipDuplicates: true,
    });
    
    console.log(`✅ Generated ${areas.length} OTPs in bulk`);
    
    // Return a dummy OTP payload matching the usual format for the frontend
    return {
      otpCode: data[0].otpCode,
      area: data[0].area,
      status: data[0].status
    };
  }

  async getStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [daily, weekly, monthly, metrics, panelData, areaStats] = await Promise.all([
      prisma.otp.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.otp.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.otp.count({ where: { createdAt: { gte: oneMonthAgo } } }),
      prisma.otp.aggregate({
        _count: { id: true },
      }),
      prisma.panel.findMany({
        include: {
          _count: { select: { otps: true } },
          logs: { select: { status: true } }
        }
      }),
      prisma.otp.groupBy({
        by: ['area'],
        _count: { id: true }
      })
    ]);

    const stats = {
      metrics: {
        total: metrics._count.id,
        success: panelData.reduce((acc, p) => acc + p.logs.filter(l => l.status === 'SUCCESS').length, 0),
        failed: panelData.reduce((acc, p) => acc + p.logs.filter(l => l.status === 'FAILED').length, 0),
        daily,
        weekly,
        monthly,
      },
      areaStats,
      panelStats: panelData.map(p => ({
        id: p.id,
        name: p.name,
        total: p._count.otps,
        success: p.logs.filter(l => l.status === 'SUCCESS').length,
        failed: p.logs.filter(l => l.status === 'FAILED').length,
      }))
    };

    return stats;
  }

  async getRecentLogs() {
    const otps = await prisma.otp.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        panel: true,
        logs: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return otps.map(otp => {
      const parts = otp.area.split('|');
      const areaName = parts[0]?.trim() || otp.area;
      const phoneNumber = parts[1]?.trim() || '';
      
      return {
        id: otp.id,
        otp: {
          otpCode: otp.otpCode,
          area: areaName,
          number: phoneNumber
        },
        panel: otp.panel || { name: 'Direct' },
        status: otp.logs[0]?.status || otp.status,
        timestamp: otp.createdAt
      };
    });
  }

  async searchLogs(query: string) {
    const otps = await prisma.otp.findMany({
      where: {
        OR: [
          { area: { contains: query, mode: 'insensitive' } },
          { otpCode: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        panel: true,
        logs: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    return otps.map(otp => {
      const parts = otp.area.split('|');
      const areaName = parts[0]?.trim() || otp.area;
      const phoneNumber = parts[1]?.trim() || '';

      return {
        id: otp.id,
        otp: {
          otpCode: otp.otpCode,
          area: areaName,
          number: phoneNumber
        },
        panel: otp.panel || { name: 'Direct' },
        status: otp.logs[0]?.status || otp.status,
        timestamp: otp.createdAt
      };
    });
  }

  async getAllOtps() {
    return prisma.otp.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        panel: true
      }
    });
  }

  async getExportableOtps() {
    return prisma.otp.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        panel: {
          select: {
            name: true,
            apiUrl: true
          }
        },
        logs: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: {
            status: true,
            response: true
          }
        }
      }
    });
  }
}
