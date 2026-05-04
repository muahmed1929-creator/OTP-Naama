import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const panelNames = [
    'Zone panel',
    'Lamix',
    'Konekta',
    'Dialer',
    'sub clients'
  ];

  console.log('Fetching existing panels...');
  const existingPanels = await prisma.panel.findMany();
  
  // We can either update existing or delete and recreate. Since there are relations (logs, otps),
  // we shouldn't delete if they are in use. Let's update existing ones first if they exist,
  // then add the rest.
  
  for (let i = 0; i < panelNames.length; i++) {
    const newName = panelNames[i];
    if (existingPanels[i]) {
      console.log(`Updating panel ${existingPanels[i].name} to ${newName}`);
      await prisma.panel.update({
        where: { id: existingPanels[i].id },
        data: { name: newName }
      });
    } else {
      console.log(`Creating new panel ${newName}`);
      await prisma.panel.create({
        data: {
          name: newName,
          apiUrl: 'https://api.example.com', // placeholder
          apiKey: 'placeholder_key' // placeholder
        }
      });
    }
  }

  // If there are extra existing panels, we leave them or delete them? The user requested these 5 panels.
  // I will leave any extras for safety, or maybe just delete them if they have no relations, but it's safer to just let the user know.

  console.log('Panels updated successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
