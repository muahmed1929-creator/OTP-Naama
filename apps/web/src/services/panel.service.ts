import { prisma } from '../lib/prisma';

export class PanelService {
  async getAllPanels() {
    return prisma.panel.findMany({
      include: {
        _count: {
          select: { otps: true }
        }
      }
    });
  }

  async createPanel(data: { name: string; apiUrl: string; apiKey: string }) {
    return prisma.panel.create({
      data
    });
  }

  async deletePanel(id: string) {
    return prisma.panel.delete({
      where: { id }
    });
  }
}
