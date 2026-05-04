import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  // 1. Create a Default User
  const user = await prisma.user.upsert({
    where: { email: 'admin@otpsaas.com' },
    update: {},
    create: {
      email: 'admin@otpsaas.com',
      name: 'Admin User',
      password: 'password123', // Default password for dev
    },
  });

  // 2. Create an API Key
  await prisma.apiKey.upsert({
    where: { key: 'dev-key-123' },
    update: {},
    create: {
      key: 'dev-key-123',
      name: 'Default Development Key',
      userId: user.id,
    },
  });

  // 3. Create 4 Panels
  const panels = [
    { name: 'Panel Alpha', apiUrl: 'https://api.panel-alpha.com/v1/otp', apiKey: 'alpha-secret' },
    { name: 'Panel Beta', apiUrl: 'https://api.panel-beta.com/v1/otp', apiKey: 'beta-secret' },
    { name: 'Panel Gamma', apiUrl: 'https://api.panel-gamma.com/v1/otp', apiKey: 'gamma-secret' },
    { name: 'Panel Delta', apiUrl: 'https://api.panel-delta.com/v1/otp', apiKey: 'delta-secret' },
  ];

  for (const panel of panels) {
    await prisma.panel.create({
      data: panel,
    });
  }

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
