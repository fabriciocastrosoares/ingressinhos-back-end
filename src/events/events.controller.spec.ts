import { Test, TestingModule } from '@nestjs/testing';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';

describe('EventsController', () => {
  let controller: EventsController;

  const eventsService = {
    findAll: jest.fn(),
    findMyEvents: jest.fn(),
    findAllLocal: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    reserve: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list events', async () => {
    eventsService.findAll.mockResolvedValue([]);

    const result = await controller.list();

    expect(eventsService.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should list organizer events using request user id', async () => {
    const request = {
      user: {
        id: 10,
      },
    };

    eventsService.findMyEvents.mockResolvedValue([]);

    const result = await controller.myEvents(request);

    expect(eventsService.findMyEvents).toHaveBeenCalledWith(10);
    expect(result).toEqual([]);
  });

  it('should list local events for gatekeeper', async () => {
    eventsService.findAllLocal.mockResolvedValue([]);

    const result = await controller.listForGatekeeper();

    expect(eventsService.findAllLocal).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should find one event', async () => {
    const event = {
      id: 1,
      title: 'Event',
    };

    eventsService.findOne.mockResolvedValue(event);

    const result = await controller.get(1);

    expect(eventsService.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(event);
  });

  it('should create an event using request user id', async () => {
    const dto = {
      externalId: 'external-1',
      capacity: 100,
      price: 50,
    };

    const request = {
      user: {
        id: 10,
      },
    };

    const event = {
      id: 1,
      ...dto,
    };

    eventsService.create.mockResolvedValue(event);

    const result = await controller.create(dto as any, request);

    expect(eventsService.create).toHaveBeenCalledWith(10, dto);
    expect(result).toBe(event);
  });

  it('should reserve an event using request user id', async () => {
    const dto = {
      quantity: 2,
    };

    const request = {
      user: {
        id: 20,
      },
    };

    const reservation = {
      id: 1,
      eventId: 5,
      userId: 20,
      quantity: 2,
    };

    eventsService.reserve.mockResolvedValue(reservation);

    const result = await controller.reserve(5, dto as any, request);

    expect(eventsService.reserve).toHaveBeenCalledWith(5, 20, dto);
    expect(result).toBe(reservation);
  });
});
