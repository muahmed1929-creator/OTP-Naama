import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPanels() {
  const panels = await prisma.panel.findMany();
  console.log(`Found ${panels.length} panels.`);
  if (panels.length === 0) {
    console.log('Seeding panels...');
    const panelNames = ['Zone panel', 'Lamix', 'Konekta', 'Dialer', 'sub clients'];
    for (const name of panelNames) {
      await prisma.panel.create({
        data: {
          name,
          apiUrl: 'https://example.com',
          apiKey: 'key'
        }
      });
    }
    console.log('Panels seeded successfully!');
  }
}

checkPanels().then(() => prisma.$disconnect());
