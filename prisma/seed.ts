import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding users...');

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      username: 'organizer',
      email: 'organizer@example.com',
      password,
      role: Role.ORGANIZER,
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: {},
    create: {
      username: 'client1',
      email: 'client1@example.com',
      password,
      role: Role.CLIENT,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {},
    create: {
      username: 'client2',
      email: 'client2@example.com',
      password,
      role: Role.CLIENT,
    },
  });

  const gatekeeper = await prisma.user.upsert({
    where: { email: 'gate@example.com' },
    update: {},
    create: {
      username: 'gate',
      email: 'gate@example.com',
      password,
      role: Role.GATEKEEPER,
    },
  });

  console.log('Seeding event...');

  let event = await prisma.event.findFirst({
    where: { externalId: 'seed-event-1' },
  });
  if (!event) {
    event = await prisma.event.create({
      data: {
        title: 'Seeded Concert',
        description: 'A seeded event for testing flows',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        location: 'Seed Hall',
        capacity: 100,
        price: 50.0,
        externalId: 'seed-event-1',
        organizerId: organizer.id,
      },
    });
  }

  console.log({
    organizer: organizer.email,
    client1: client1.email,
    client2: client2.email,
    gatekeeper: gatekeeper.email,
    event: event.title,
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
