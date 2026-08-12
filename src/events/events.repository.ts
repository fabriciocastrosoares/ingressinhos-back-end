import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ReserveDto } from './dto/reserve.dto';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) {
    const createData = {
      title: data.title,
      description: data.description,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      location: data.location,
      capacity: data.capacity,
      price: data.price,
      externalId: data.externalId || `event-${Date.now()}`,
      organizerId: data.organizerId,
    };
    return this.prisma.event.create({ data: createData as any });
  }

  findAll() {
    return this.prisma.event.findMany();
  }

  findByExternalId(externalId: string) {
    return this.prisma.event.findFirst({ where: { externalId } });
  }

  findOne(id: string) {
    return this.prisma.event.findUnique({ where: { id } });
  }

  incrementSoldCount(
    eventId: string,
    quantity: number,
    client: any = this.prisma,
  ) {
    return client.event.update({
      where: { id: eventId },
      data: { soldCount: { increment: quantity } },
    });
  }

  createReservation(
    userId: string,
    eventId: string,
    dto: ReserveDto,
    client: any = this.prisma,
  ) {
    return client.reservation.create({
      data: { userId, eventId, quantity: dto.quantity, status: 'CONFIRMED' },
    });
  }
}
