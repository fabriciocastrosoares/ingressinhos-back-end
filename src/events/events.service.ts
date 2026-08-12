import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

import { ReserveDto } from './dto/reserve.dto';

import { ReservationStatus } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: EventsRepository,
  ) {}

  async create(organizerId: string, data: CreateEventDto) {
    const payload = {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      location: data.location,
      capacity: data.capacity,
      price: new Prisma.Decimal(data.price),
      externalId: `event-${Date.now()}`,
      organizerId,
    } as any;
    return this.repo.create(payload as CreateEventDto);
  }

  async findAll() {
    const url =
      'https://app.ticketmaster.com/discovery/v2/events.json?apikey=aFL3gFPY25AaXTXIqOe3RN9ini7gCeRu';

    try {
      const res = await (globalThis as any).fetch(url);
      if (!res.ok) throw new Error('Ticketmaster fetch failed');
      const data = await res.json();
      const events = data._embedded?.events ?? [];

      const normalized = await Promise.all(
        events.map(async (e: any) => {
          const venue = e._embedded?.venues?.[0] ?? {};
          const date =
            e.dates?.start?.dateTime ?? e.dates?.start?.localDate ?? null;
          const priceRange = Array.isArray(e.priceRanges)
            ? e.priceRanges[0]
            : null;
          const price = priceRange ? (priceRange.min ?? priceRange.max) : null;

          const externalId = e.id;
          const local = await this.repo.findByExternalId(externalId);

          return {
            id: local?.id ?? null,
            title: e.name,
            description: e.info ?? e.pleaseNote ?? null,
            date,
            location: [venue.name, venue.city?.name, venue.address?.line1]
              .filter(Boolean)
              .join(' - '),
            capacity: local?.capacity ?? null,
            soldCount: local?.soldCount ?? null,
            price: local ? Number(local.price) : price,
            externalId,
            source: 'ticketmaster',
            url: e.url,
          };
        }),
      );

      return normalized;
    } catch (err) {
      const locals = await this.repo.findAll();
      return locals.map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        date: l.date instanceof Date ? l.date.toISOString() : l.date,
        location: l.location,
        capacity: l.capacity,
        soldCount: l.soldCount,
        price: Number(l.price),
        externalId: l.externalId,
        source: 'local',
        url: null,
      }));
    }
  }

  async findOne(id: string) {
    const event = await this.repo.findOne(id);
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async reserve(eventId: string, userId: string, dto: ReserveDto) {
    const quantity = dto.quantity;
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('Event not found');
      if (event.soldCount + quantity > event.capacity)
        throw new BadRequestException('Not enough available tickets');

      await this.repo.incrementSoldCount(eventId, quantity, tx);

      const reservation = await this.repo.createReservation(
        userId,
        eventId,
        dto,
        tx,
      );

      return reservation;
    });
  }
}
