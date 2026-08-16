import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../Prisma/prisma.service';
import { ReserveDto } from './dto/reserve.dto';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EventUncheckedCreateInput) {
    return this.prisma.event.create({
      data,
    });
  }

  findAll() {
    return this.prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
    });
  }

  findByOrganizerId(organizerId: number) {
    return this.prisma.event.findMany({
      where: {
        organizerId,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.event.findUnique({
      where: { id },
    });
  }

  findByExternalId(externalId: string) {
    return this.prisma.event.findFirst({
      where: {
        externalId,
      },
    });
  }

  findByExternalIds(externalIds: string[]) {
    return this.prisma.event.findMany({
      where: {
        externalId: {
          in: externalIds,
        },
      },
    });
  }

  incrementSoldCount(
    eventId: number,
    quantity: number,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.event.update({
      where: {
        id: eventId,
      },
      data: {
        soldCount: {
          increment: quantity,
        },
      },
    });
  }

  createReservation(
    userId: number,
    eventId: number,
    dto: ReserveDto,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    return client.reservation.create({
      data: {
        userId,
        eventId,
        quantity: dto.quantity,
        status: 'CONFIRMED',
      },
    });
  }
}
