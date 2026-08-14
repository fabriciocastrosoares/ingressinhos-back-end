import 'dotenv/config';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { PrismaClient } from '../generated/prisma/client';
import {
  PaymentStatus,
  ReservationStatus,
  Role,
} from '../generated/prisma/enums';

import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });

  const password = await bcrypt.hash('password123', 10);

  console.log('Seeding database...');

  const organizer = await prisma.user.upsert({
    where: {
      email: 'organizer@example.com',
    },
    update: {},
    create: {
      username: 'Organizer',
      email: 'organizer@example.com',
      password,
      role: Role.ORGANIZER,
    },
  });

  const client = await prisma.user.upsert({
    where: {
      email: 'client@example.com',
    },
    update: {},
    create: {
      username: 'Client',
      email: 'client@example.com',
      password,
      role: Role.CLIENT,
    },
  });

  const gatekeeper = await prisma.user.upsert({
    where: {
      email: 'gate@example.com',
    },
    update: {},
    create: {
      username: 'Gatekeeper',
      email: 'gate@example.com',
      password,
      role: Role.GATEKEEPER,
    },
  });

  let event = await prisma.event.findFirst({
    where: {
      externalId: 'seed-event-1',
    },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        title: 'Seeded Concert',
        description: 'Event created by seed',
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        location: 'Seed Hall',
        capacity: 100,
        soldCount: 1,
        price: 50,
        externalId: 'seed-event-1',
        organizerId: organizer.id,
      },
    });
  }

  let reservation = await prisma.reservation.findFirst({
    where: {
      userId: client.id,
      eventId: event.id,
    },
  });

  if (!reservation) {
    reservation = await prisma.reservation.create({
      data: {
        userId: client.id,
        eventId: event.id,
        quantity: 1,
        status: ReservationStatus.CONFIRMED,
      },
    });
  }

  const payment = await prisma.payment.upsert({
    where: {
      reservationId: reservation.id,
    },
    update: {},
    create: {
      reservationId: reservation.id,
      amount: 50,
      status: PaymentStatus.APPROVED,
    },
  });

  let ticket = await prisma.ticket.findFirst({
    where: {
      reservationId: reservation.id,
    },
  });

  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: {
        reservationId: reservation.id,
        ownerId: client.id,
        eventId: event.id,
        code: randomUUID(),
      },
    });
  }

  console.log(`
====================================================

Seed executed successfully!

ORGANIZER
email: organizer@example.com
password: password123

CLIENT
email: client@example.com
password: password123

GATEKEEPER
email: gate@example.com
password: password123

EVENT
id: ${event.id}
title: ${event.title}

TICKET
id: ${ticket.id}
shareToken: ${ticket.shareToken}
status: ${ticket.status}

====================================================
`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
