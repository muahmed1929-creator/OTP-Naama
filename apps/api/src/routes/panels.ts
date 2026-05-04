import { FastifyInstance } from 'fastify';
import { PanelService } from '../services/panel.service';
import { z } from 'zod';

const panelService = new PanelService();

const panelSchema = z.object({
  name: z.string(),
  apiUrl: z.string().url(),
  apiKey: z.string(),
});

export async function panelRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return panelService.getAllPanels();
  });

  fastify.post('/', async (request, reply) => {
    // Only Admin can create panels
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only admins can manage panels' });
    }

    const body = panelSchema.parse(request.body);
    return panelService.createPanel(body);
  });

  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Only admins can manage panels' });
    }

    const { id } = request.params as { id: string };
    await panelService.deletePanel(id);
    return { success: true };
  });
}
