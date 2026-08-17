import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';

describe('TicketsService', () => {
  let service: TicketsService;

  const repository = {
    findEvent: jest.fn(),
    incrementSoldCount: jest.fn(),
    createReservation: jest.fn(),
    createPayment: jest.fn(),
    createTicket: jest.fn(),
    findReservation: jest.fn(),
    findTicketByShareToken: jest.fn(),
    updateTicketStatus: jest.fn(),
    createValidation: jest.fn(),
    findByOwner: jest.fn(),
    findByShareToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buy', () => {
    it('should throw when the event does not exist', async () => {
      repository.findEvent.mockResolvedValue(null);

      await expect(
        service.buy(1, { eventId: 99, quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create reservation, payment and the requested tickets', async () => {
      repository.findEvent.mockResolvedValue({
        id: 5,
        price: '80.00',
      });

      repository.incrementSoldCount.mockResolvedValue({});
      repository.createReservation.mockResolvedValue({
        id: 10,
        eventId: 5,
        userId: 1,
        quantity: 2,
        status: 'CONFIRMED',
      });
      repository.createPayment.mockResolvedValue({});
      repository.createTicket.mockResolvedValue({});
      repository.findReservation.mockResolvedValue({
        id: 10,
        tickets: [{ id: 1 }, { id: 2 }],
      });

      const result = await service.buy(1, {
        eventId: 5,
        quantity: 2,
      });

      expect(repository.incrementSoldCount).toHaveBeenCalledWith(5, 2);

      expect(repository.createReservation).toHaveBeenCalledWith({
        eventId: 5,
        userId: 1,
        quantity: 2,
        status: 'CONFIRMED',
      });

      expect(repository.createPayment).toHaveBeenCalledWith({
        reservationId: 10,
        amount: 160,
        status: 'APPROVED',
      });

      expect(repository.createTicket).toHaveBeenCalledTimes(2);
      expect(repository.createTicket).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          reservationId: 10,
          eventId: 5,
          ownerId: 1,
          code: expect.any(String),
        }),
      );

      expect(result).toEqual({
        id: 10,
        tickets: [{ id: 1 }, { id: 2 }],
      });
    });
  });

  describe('validate', () => {
    const ticket = {
      id: 20,
      eventId: 5,
      status: 'VALID',
      owner: { username: 'Client' },
      event: { title: 'Festival' },
    };

    it('should throw when ticket does not exist', async () => {
      repository.findTicketByShareToken.mockResolvedValue(null);

      await expect(
        service.validate(30, {
          shareToken: 'token',
          eventId: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when ticket belongs to another event', async () => {
      repository.findTicketByShareToken.mockResolvedValue({
        ...ticket,
        eventId: 99,
      });

      await expect(
        service.validate(30, {
          shareToken: 'token',
          eventId: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when ticket was already used', async () => {
      repository.findTicketByShareToken.mockResolvedValue({
        ...ticket,
        status: 'USED',
      });

      await expect(
        service.validate(30, {
          shareToken: 'token',
          eventId: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate a valid ticket', async () => {
      repository.findTicketByShareToken.mockResolvedValue(ticket);
      repository.updateTicketStatus.mockResolvedValue({});
      repository.createValidation.mockResolvedValue({});

      const result = await service.validate(30, {
        shareToken: 'token',
        eventId: 5,
      });

      expect(repository.updateTicketStatus).toHaveBeenCalledWith(20, 'USED');

      expect(repository.createValidation).toHaveBeenCalledWith({
        ticketId: 20,
        gatekeeperId: 30,
        result: 'VALID',
      });

      expect(result).toEqual({
        message: 'Ticket validated successfully',
        ticketId: 20,
        owner: 'Client',
        event: 'Festival',
      });
    });
  });

  it('should return the current user tickets', async () => {
    repository.findByOwner.mockResolvedValue([
      {
        id: 1,
        shareToken: 'share-1',
        status: 'VALID',
        event: {
          id: 5,
          title: 'Festival',
          date: new Date('2030-01-01'),
          location: 'Arena',
        },
      },
    ]);

    await expect(service.findMyTickets(1)).resolves.toEqual([
      {
        id: 1,
        shareToken: 'share-1',
        status: 'VALID',
        event: {
          id: 5,
          title: 'Festival',
          date: new Date('2030-01-01'),
          location: 'Arena',
        },
      },
    ]);
  });

  it('should return a public ticket', async () => {
    repository.findTicketByShareToken.mockResolvedValue({
      id: 1,
      status: 'VALID',
      event: {
        id: 5,
        title: 'Festival',
        date: new Date('2030-01-01'),
        location: 'Arena',
      },
    });

    await expect(service.getPublicTicket('share-1')).resolves.toEqual({
      id: 1,
      status: 'VALID',
      event: {
        id: 5,
        title: 'Festival',
        date: new Date('2030-01-01'),
        location: 'Arena',
      },
    });
  });

  it('should throw when public ticket does not exist', async () => {
    repository.findTicketByShareToken.mockResolvedValue(null);

    await expect(service.getPublicTicket('unknown')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return a ticket by code', async () => {
    repository.findByShareToken.mockResolvedValue({
      id: 1,
      code: 'code-1',
      shareToken: 'share-1',
      status: 'VALID',
      owner: { username: 'Client' },
      event: {
        id: 5,
        title: 'Festival',
        date: new Date('2030-01-01'),
        location: 'Arena',
      },
    });

    await expect(service.getByCode('share-1')).resolves.toEqual({
      id: 1,
      code: 'code-1',
      shareToken: 'share-1',
      status: 'VALID',
      owner: 'Client',
      event: {
        id: 5,
        title: 'Festival',
        date: new Date('2030-01-01'),
        location: 'Arena',
      },
    });
  });
});
