import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../Prisma/prisma.service';
import { TicketmasterService } from '../ticketsmaster/ticketsmaster.service';

import { EventsRepository } from './events.repository';

import { CreateEventDto } from './dto/create-event.dto';
import { ReserveDto } from './dto/reserve.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: EventsRepository,
    private readonly ticketmaster: TicketmasterService,
  ) {}

  async create(organizerId: number, dto: CreateEventDto) {
    const ticketmasterEvent = await this.ticketmaster.findEventByExternalId(
      dto.externalId,
    );

    if (!ticketmasterEvent) {
      throw new NotFoundException('Event not found');
    }

    const venue = ticketmasterEvent._embedded?.venues?.[0];

    const data = {
      title: ticketmasterEvent.name,
      description:
        ticketmasterEvent.info ?? ticketmasterEvent.pleaseNote ?? null,
      date: new Date(
        ticketmasterEvent.dates.start.dateTime ??
          ticketmasterEvent.dates.start.localDate,
      ),
      location: [venue?.name, venue?.city?.name, venue?.address?.line1]
        .filter(Boolean)
        .join(' - '),
      capacity: dto.capacity,
      price: new Prisma.Decimal(dto.price),
      externalId: dto.externalId,
      organizerId,
    };

    const result = await this.repository.create(data);

    return result;
  }

  async findAll() {
    try {
      const ticketmasterEvents = await this.ticketmaster.findEvents();

      return this.mergeEvents(ticketmasterEvents);
    } catch {
      return this.getLocalEvents();
    }
  }

  async findOne(id: number) {
    const event = await this.repository.findOne(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async reserve(eventId: number, userId: number, dto: ReserveDto) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (event.soldCount + dto.quantity > event.capacity) {
        throw new BadRequestException('Not enough available tickets');
      }

      await this.repository.incrementSoldCount(eventId, dto.quantity, tx);

      return this.repository.createReservation(userId, eventId, dto, tx);
    });
  }

  private async mergeEvents(ticketmasterEvents: any[]) {
    const externalIds = ticketmasterEvents.map((event) => event.id);

    const localEvents = await this.repository.findByExternalIds(externalIds);

    const localEventsMap = new Map(
      localEvents.map((event) => [event.externalId, event]),
    );

    return ticketmasterEvents.map((event) =>
      this.normalizeEvent(event, localEventsMap.get(event.id)),
    );
  }

  private normalizeEvent(event: any, localEvent?: any) {
    const venue = event._embedded?.venues?.[0];

    return {
      id: localEvent?.id ?? null,

      title: event.name,

      description: event.info ?? event.pleaseNote ?? null,

      date: event.dates?.start?.dateTime ?? event.dates?.start?.localDate,

      location: [venue?.name, venue?.city?.name, venue?.address?.line1]
        .filter(Boolean)
        .join(' - '),

      capacity: localEvent?.capacity ?? null,

      soldCount: localEvent?.soldCount ?? null,

      price: localEvent ? Number(localEvent.price) : this.getPrice(event),

      externalId: event.id,

      url: event.url,

      source: localEvent ? 'local' : 'ticketmaster',
    };
  }

  private getPrice(event: any) {
    const range = event.priceRanges?.[0];

    return range?.min ?? range?.max ?? null;
  }

  private async getLocalEvents() {
    const events = await this.repository.findAll();

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      soldCount: event.soldCount,
      price: Number(event.price),
      externalId: event.externalId,
      source: 'local',
      url: null,
    }));
  }
}
