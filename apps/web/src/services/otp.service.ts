import { prisma } from '../lib/prisma';

const OTPS_PER_NUMBER = 30;

export class OtpService {
  /**
   * Generate 30 unique OTPs for a single phone number
   */
  async generateOtp({ area, panelId }: { area: string; panelId?: string }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Generate 30 unique OTP codes for this number
    const otpCodes = new Set<string>();
    while (otpCodes.size < OTPS_PER_NUMBER) {
      otpCodes.add(Math.floor(100000 + Math.random() * 900000).toString());
    }

    const data = Array.from(otpCodes).map((code) => ({
      otpCode: code,
      area,
      panelId: panelId || null,
      status: 'SUCCESS' as any,
      expiresAt,
    }));

    // Insert all 30 OTPs at once
    await prisma.otp.createMany({
      data,
      skipDuplicates: true,
    });

    console.log(`✅ Generated ${OTPS_PER_NUMBER} OTPs for ${area}`);

    return {
      otpCode: data[0].otpCode,
      area: data[0].area,
      status: 'SUCCESS',
      totalGenerated: OTPS_PER_NUMBER,
    };
  }

  /**
   * Generate 30 OTPs per number in bulk mode (multiple numbers)
   */
  async generateBulkOtp({ areas, panelId }: { areas: string[]; panelId?: string }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const allData: any[] = [];

    for (const area of areas) {
      // Generate 30 unique OTP codes for each number
      const otpCodes = new Set<string>();
      while (otpCodes.size < OTPS_PER_NUMBER) {
        otpCodes.add(Math.floor(100000 + Math.random() * 900000).toString());
      }

      Array.from(otpCodes).forEach((code) => {
        allData.push({
          otpCode: code,
          area,
          panelId: panelId || null,
          status: 'SUCCESS' as any,
          expiresAt,
        });
      });
    }

    // Insert all at once
    await prisma.otp.createMany({
      data: allData,
      skipDuplicates: true,
    });
    
    console.log(`✅ Generated ${allData.length} OTPs for ${areas.length} numbers (${OTPS_PER_NUMBER} each)`);
    
    return {
      otpCode: allData[0]?.otpCode || '000000',
      area: allData[0]?.area || '',
      status: 'SUCCESS',
      totalGenerated: allData.length,
      numbersProcessed: areas.length,
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

    // Clean up area stats: group by country/region name (strip phone numbers)
    const areaMap = new Map<string, number>();
    areaStats.forEach(a => {
      // Area format: "Pakistan | +923115907063" — extract just the country part
      const cleanName = a.area.split('|')[0]?.trim() || a.area;
      areaMap.set(cleanName, (areaMap.get(cleanName) || 0) + a._count.id);
    });

    const cleanedAreaStats = Array.from(areaMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 areas for readability

    const stats = {
      metrics: {
        total: metrics._count.id,
        success: panelData.reduce((acc, p) => acc + p.logs.filter(l => l.status === 'SUCCESS').length, 0),
        failed: panelData.reduce((acc, p) => acc + p.logs.filter(l => l.status === 'FAILED').length, 0),
        daily,
        weekly,
        monthly,
      },
      areaStats: cleanedAreaStats,
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
        status: otp.status,
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
        status: otp.status,
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
