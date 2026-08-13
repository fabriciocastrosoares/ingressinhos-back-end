import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Prisma/prisma.service';
import { Prisma, TicketStatus } from '../../generated/prisma/client';

@Injectable()
export class TicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEvent(id: number) {
    return this.prisma.event.findUnique({
      where: {
        id,
      },
    });
  }

  incrementSoldCount(eventId: number, quantity: number) {
    return this.prisma.event.update({
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

  createReservation(data: Prisma.ReservationUncheckedCreateInput) {
    return this.prisma.reservation.create({
      data,
    });
  }

  createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({
      data,
    });
  }

  createTicket(data: Prisma.TicketUncheckedCreateInput) {
    return this.prisma.ticket.create({
      data,
    });
  }

  findReservation(id: number) {
    return this.prisma.reservation.findUnique({
      where: {
        id,
      },
      include: {
        tickets: true,
      },
    });
  }

  findTicketByShareToken(shareToken: string) {
    return this.prisma.ticket.findUnique({
      where: {
        shareToken,
      },
      include: {
        owner: true,
        event: true,
      },
    });
  }

  updateTicketStatus(id: number, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  createValidation(data: Prisma.TicketValidationUncheckedCreateInput) {
    return this.prisma.ticketValidation.create({
      data,
    });
  }
}
