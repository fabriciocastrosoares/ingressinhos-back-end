import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import {
  PaymentStatus,
  ReservationStatus,
  TicketStatus,
} from '../../generated/prisma/enums';

import { TicketsRepository } from './tickets.repository';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly repository: TicketsRepository) {}

  async buy(userId: number, dto: BuyTicketDto) {
    const event = await this.repository.findEvent(dto.eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.repository.incrementSoldCount(event.id, dto.quantity);

    const reservation = await this.repository.createReservation({
      eventId: event.id,
      userId,
      quantity: dto.quantity,
      status: ReservationStatus.CONFIRMED,
    });

    await this.repository.createPayment({
      reservationId: reservation.id,
      amount: Number(event.price) * dto.quantity,
      status: PaymentStatus.APPROVED,
    });

    for (let i = 0; i < dto.quantity; i++) {
      await this.repository.createTicket({
        reservationId: reservation.id,
        eventId: event.id,
        ownerId: userId,
        code: randomUUID(),
      });
    }

    return this.repository.findReservation(reservation.id);
  }

  async validate(gatekeeperId: number, dto: ValidateTicketDto) {
    const ticket = await this.repository.findTicketByShareToken(dto.shareToken);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestException('Ticket already used');
    }

    await this.repository.updateTicketStatus(ticket.id, TicketStatus.USED);

    await this.repository.createValidation({
      ticketId: ticket.id,
      gatekeeperId,
      result: 'VALID',
    });

    return {
      message: 'Ticket validated successfully',
      ticketId: ticket.id,
      owner: ticket.owner.username,
      event: ticket.event.title,
    };
  }

  async findMyTickets(userId: number) {
    const tickets = await this.repository.findByOwner(userId);

    return tickets.map((ticket) => ({
      id: ticket.id,
      shareToken: ticket.shareToken,
      status: ticket.status,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        date: ticket.event.date,
        location: ticket.event.location,
      },
    }));
  }

  async getByCode(code: string) {
    const ticket = await this.repository.findByShareToken(code);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      id: ticket.id,
      code: ticket.code,
      shareToken: ticket.shareToken,
      status: ticket.status,
      owner: ticket.owner.username,
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        date: ticket.event.date,
        location: ticket.event.location,
      },
    };
  }
}
