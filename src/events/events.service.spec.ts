import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { PrismaService } from '../Prisma/prisma.service';
import { TicketmasterService } from '../ticketsmaster/ticketsmaster.service';

describe('EventsService', () => {
  let service: EventsService;

  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByOrganizerId: jest.fn(),
    findOne: jest.fn(),
    findByExternalIds: jest.fn(),
    incrementSoldCount: jest.fn(),
    createReservation: jest.fn(),
  };

  const ticketmaster = {
    findEvents: jest.fn(),
    findEventByExternalId: jest.fn(),
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: repository },
        { provide: TicketmasterService, useValue: ticketmaster },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw when Ticketmaster event does not exist', async () => {
      ticketmaster.findEventByExternalId.mockResolvedValue(null);

      await expect(
        service.create(1, {
          externalId: 'unknown',
          capacity: 100,
          price: 50,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a local event using Ticketmaster data', async () => {
      ticketmaster.findEventByExternalId.mockResolvedValue({
        id: 'external-1',
        name: 'Festival',
        info: 'Descrição',
        dates: {
          start: {
            dateTime: '2030-01-10T20:00:00Z',
          },
        },
        _embedded: {
          venues: [
            {
              name: 'Arena',
              city: { name: 'São Paulo' },
              address: { line1: 'Rua A, 10' },
            },
          ],
        },
      });

      const created = {
        id: 1,
        title: 'Festival',
        externalId: 'external-1',
        capacity: 100,
      };

      repository.create.mockResolvedValue(created);

      const result = await service.create(10, {
        externalId: 'external-1',
        capacity: 100,
        price: 50,
      } as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Festival',
          description: 'Descrição',
          capacity: 100,
          externalId: 'external-1',
          organizerId: 10,
          location: 'Arena - São Paulo - Rua A, 10',
        }),
      );

      expect(result).toBe(created);
    });
  });

  describe('findAll', () => {
    it('should merge Ticketmaster events with local events', async () => {
      ticketmaster.findEvents.mockResolvedValue([
        {
          id: 'external-1',
          name: 'Festival',
          info: 'Descrição',
          dates: {
            start: {
              dateTime: '2030-01-10T20:00:00Z',
            },
          },
          _embedded: {
            venues: [
              {
                name: 'Arena',
                city: { name: 'São Paulo' },
                address: { line1: 'Rua A, 10' },
              },
            ],
          },
          url: 'https://example.com',
        },
      ]);

      repository.findByExternalIds.mockResolvedValue([
        {
          id: 7,
          externalId: 'external-1',
          title: 'Festival',
          capacity: 100,
          soldCount: 2,
          price: 50,
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        expect.objectContaining({
          id: 7,
          title: 'Festival',
          externalId: 'external-1',
          source: 'local',
          capacity: 100,
          soldCount: 2,
          price: 50,
        }),
      ]);
    });

    it('should return local events when Ticketmaster is unavailable', async () => {
      ticketmaster.findEvents.mockRejectedValue(new Error('API down'));

      repository.findAll.mockResolvedValue([
        {
          id: 1,
          title: 'Local Event',
          description: null,
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 50,
          soldCount: 0,
          price: '30',
          externalId: 'local-1',
        },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 1,
          title: 'Local Event',
          description: null,
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 50,
          soldCount: 0,
          price: 30,
          externalId: 'local-1',
          source: 'local',
          url: null,
        },
      ]);
    });
  });

  describe('findAllLocal', () => {
    it('should return normalized local events for the gatekeeper', async () => {
      const events = [
        {
          id: 1,
          title: 'Event',
          description: 'Description',
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 100,
          soldCount: 10,
          price: '99.90',
          externalId: 'external-1',
        },
      ];

      repository.findAll.mockResolvedValue(events);

      await expect(service.findAllLocal()).resolves.toEqual([
        {
          id: 1,
          title: 'Event',
          description: 'Description',
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 100,
          soldCount: 10,
          price: 99.9,
          externalId: 'external-1',
          source: 'local',
        },
      ]);
    });
  });

  describe('findMyEvents', () => {
    it('should return organizer events with numeric price', async () => {
      repository.findByOrganizerId.mockResolvedValue([
        {
          id: 1,
          title: 'Event',
          description: 'Description',
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 100,
          soldCount: 10,
          price: '99.90',
          externalId: 'external-1',
        },
      ]);

      const result = await service.findMyEvents(1);

      expect(repository.findByOrganizerId).toHaveBeenCalledWith(1);

      expect(result).toEqual([
        {
          id: 1,
          title: 'Event',
          description: 'Description',
          date: new Date('2030-01-10T20:00:00Z'),
          location: 'Arena',
          capacity: 100,
          soldCount: 10,
          price: 99.9,
          externalId: 'external-1',
          source: 'local',
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return an event', async () => {
      const event = { id: 1, title: 'Event' };

      repository.findOne.mockResolvedValue(event);

      await expect(service.findOne(1)).resolves.toBe(event);
    });

    it('should throw when event does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reserve', () => {
    const tx = {
      event: {
        findUnique: jest.fn(),
      },
    };

    beforeEach(() => {
      prisma.$transaction.mockImplementation(async (callback: any) =>
        callback(tx),
      );
    });

    it('should throw when event does not exist', async () => {
      tx.event.findUnique.mockResolvedValue(null);

      await expect(
        service.reserve(1, 2, { quantity: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when there are not enough tickets', async () => {
      tx.event.findUnique.mockResolvedValue({
        id: 1,
        capacity: 10,
        soldCount: 10,
      });

      await expect(
        service.reserve(1, 2, { quantity: 1 } as any),
      ).rejects.toThrow(BadRequestException);

      expect(repository.incrementSoldCount).not.toHaveBeenCalled();
    });

    it('should reserve tickets successfully', async () => {
      tx.event.findUnique.mockResolvedValue({
        id: 1,
        capacity: 10,
        soldCount: 2,
      });

      const reservation = {
        id: 5,
        eventId: 1,
        userId: 2,
        quantity: 3,
        status: 'CONFIRMED',
      };

      repository.incrementSoldCount.mockResolvedValue({});
      repository.createReservation.mockResolvedValue(reservation);

      const result = await service.reserve(1, 2, { quantity: 3 } as any);

      expect(repository.incrementSoldCount).toHaveBeenCalledWith(1, 3, tx);

      expect(repository.createReservation).toHaveBeenCalledWith(
        2,
        1,
        { quantity: 3 },
        tx,
      );

      expect(result).toBe(reservation);
    });
  });
});
