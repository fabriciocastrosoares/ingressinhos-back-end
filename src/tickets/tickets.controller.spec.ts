import { Test, TestingModule } from '@nestjs/testing';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';

describe('TicketsController', () => {
  let controller: TicketsController;

  const service = {
    buy: jest.fn(),
    findMyTickets: jest.fn(),
    getPublicTicket: jest.fn(),
    getByCode: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: service,
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

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should buy tickets using request user id', async () => {
    const request = {
      user: {
        id: 1,
      },
    };

    const dto = {
      eventId: 10,
      quantity: 2,
    };

    const result = {
      id: 5,
      ...dto,
    };

    service.buy.mockResolvedValue(result);

    const response = await controller.buy(request, dto);

    expect(service.buy).toHaveBeenCalledWith(1, dto);
    expect(response).toBe(result);
  });

  it('should return the current user tickets', async () => {
    const request = {
      user: {
        id: 1,
      },
    };

    service.findMyTickets.mockResolvedValue([]);

    const response = await controller.findMyTickets(request);

    expect(service.findMyTickets).toHaveBeenCalledWith(1);
    expect(response).toEqual([]);
  });

  it('should return a public ticket', async () => {
    const ticket = {
      id: 1,
      status: 'VALID',
    };

    service.getPublicTicket.mockResolvedValue(ticket);

    const response = await controller.getPublicTicket('share-1');

    expect(service.getPublicTicket).toHaveBeenCalledWith('share-1');
    expect(response).toBe(ticket);
  });

  it('should return a ticket by code', async () => {
    const ticket = {
      id: 1,
      code: 'code-1',
    };

    service.getByCode.mockResolvedValue(ticket);

    const response = await controller.getTicket('share-1');

    expect(service.getByCode).toHaveBeenCalledWith('share-1');
    expect(response).toBe(ticket);
  });

  it('should validate a ticket using request user id', async () => {
    const request = {
      user: {
        id: 30,
      },
    };

    const dto = {
      shareToken: 'share-1',
      eventId: 10,
    };

    const result = {
      message: 'Ticket validated successfully',
    };

    service.validate.mockResolvedValue(result);

    const response = await controller.validate(request, dto);

    expect(service.validate).toHaveBeenCalledWith(30, dto);
    expect(response).toBe(result);
  });
});
