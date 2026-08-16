import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/Prisma/prisma.service';
import { TicketmasterService } from '../src/ticketsmaster/ticketsmaster.service';

describe('Ingressinho API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const ticketmasterMock = {
    findEvents: jest.fn(),
    findEventByExternalId: jest.fn(),
  };

  const createUser = async (payload: {
    username: string;
    email: string;
    password: string;
    role: 'ORGANIZER' | 'CLIENT' | 'GATEKEEPER';
  }) => {
    const registration = await request(app.getHttpServer())
      .post('/users')
      .send(payload)
      .expect(HttpStatus.CREATED);

    const login = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: payload.email, password: payload.password })
      .expect(HttpStatus.OK);

    return {
      user: registration.body,
      token: `Bearer ${login.body.token}`,
    };
  };

  const resetDatabase = async () => {
    await prisma.ticketValidation.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'ingressinho-jwt-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TicketmasterService)
      .useValue(ticketmasterMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await app.close();
  });

  it('GET /health should return 200 and healthy message', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(HttpStatus.OK)
      .expect("I'm okay!");
  });

  it('should create user, authenticate and owner can list events', async () => {
    const organizer = await createUser({
      username: 'Organizer Test',
      email: 'organizer.e2e@example.com',
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    await request(app.getHttpServer())
      .get('/events/my')
      .set('Authorization', organizer.token)
      .expect(HttpStatus.OK)
      .expect([]);

    expect(organizer.user.email).toBe('organizer.e2e@example.com');
    expect(organizer.token).toContain('Bearer ');
  });

  it('should allow organizer to create an event and client to reserve tickets', async () => {
    const organizer = await createUser({
      username: 'Organizer Event',
      email: 'organizer.event@example.com',
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client Event',
      email: 'client.event@example.com',
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    ticketmasterMock.findEventByExternalId.mockResolvedValue({
      id: 'event-external-1',
      name: 'Festival de Música',
      info: 'Show especial com artistas locais.',
      pleaseNote: 'Atenção para fila de entrada.',
      dates: {
        start: {
          dateTime: '2030-11-15T20:00:00Z',
        },
      },
      _embedded: {
        venues: [
          {
            name: 'Arena Central',
            city: { name: 'São Paulo' },
            address: { line1: 'Av. Paulista, 1000' },
          },
        ],
      },
      url: 'https://example.com/event/external-1',
    });

    const createEventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: 'event-external-1',
        capacity: 100,
        price: 150,
      })
      .expect(HttpStatus.CREATED);

    expect(createEventResponse.body).toMatchObject({
      title: 'Festival de Música',
      location: 'Arena Central - São Paulo - Av. Paulista, 1000',
      capacity: 100,
      externalId: 'event-external-1',
    });

    const reserve = await request(app.getHttpServer())
      .post(`/events/${createEventResponse.body.id}/reserve`)
      .set('Authorization', client.token)
      .send({ quantity: 2 })
      .expect(HttpStatus.CREATED);

    expect(reserve.body).toMatchObject({
      quantity: 2,
      status: 'CONFIRMED',
      userId: expect.any(Number),
      eventId: createEventResponse.body.id,
    });

    const myEvents = await request(app.getHttpServer())
      .get('/events/my')
      .set('Authorization', organizer.token)
      .expect(HttpStatus.OK);

    expect(myEvents.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Festival de Música',
          source: 'local',
        }),
      ]),
    );
  });

  it('should allow client to buy tickets and gatekeeper validate a ticket', async () => {
    const organizer = await createUser({
      username: 'Organizer Ticket',
      email: 'ticket.organizer@example.com',
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client Ticket',
      email: 'ticket.client@example.com',
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const gatekeeper = await createUser({
      username: 'Gatekeeper Ticket',
      email: 'ticket.gatekeeper@example.com',
      password: 'StrongPass123!',
      role: 'GATEKEEPER',
    });

    ticketmasterMock.findEventByExternalId.mockResolvedValue({
      id: 'event-external-2',
      name: 'Tech Summit',
      info: 'Conferência de tecnologia',
      dates: {
        start: {
          dateTime: '2031-02-20T18:30:00Z',
        },
      },
      _embedded: {
        venues: [
          {
            name: 'Centro de Eventos',
            city: { name: 'Rio de Janeiro' },
            address: { line1: 'Rua da Ciência, 15' },
          },
        ],
      },
      url: 'https://example.com/event/external-2',
    });

    const createEventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: 'event-external-2',
        capacity: 30,
        price: 90,
      })
      .expect(HttpStatus.CREATED);

    const buyResponse = await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', client.token)
      .send({
        eventId: createEventResponse.body.id,
        quantity: 1,
      })
      .expect(HttpStatus.CREATED);

    expect(buyResponse.body).toMatchObject({
      eventId: createEventResponse.body.id,
      quantity: 1,
      status: 'CONFIRMED',
      tickets: expect.any(Array),
    });

    const myTickets = await request(app.getHttpServer())
      .get('/tickets/my')
      .set('Authorization', client.token)
      .expect(HttpStatus.OK);

    const ticketToValidate = myTickets.body[0];
    expect(ticketToValidate).toMatchObject({
      status: 'VALID',
      event: expect.objectContaining({
        title: 'Tech Summit',
      }),
    });

    const validateResponse = await request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', gatekeeper.token)
      .send({
        shareToken: ticketToValidate.shareToken,
        eventId: createEventResponse.body.id,
      })
      .expect(HttpStatus.CREATED);

    expect(validateResponse.body).toMatchObject({
      message: 'Ticket validated successfully',
      event: 'Tech Summit',
    });

    const publicTicket = await request(app.getHttpServer())
      .get(`/tickets/public/${ticketToValidate.shareToken}`)
      .expect(HttpStatus.OK);

    expect(publicTicket.body).toMatchObject({
      status: 'USED',
      event: expect.objectContaining({ title: 'Tech Summit' }),
    });
  });
});
