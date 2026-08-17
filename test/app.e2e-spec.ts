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

  const uniqueEmail = (prefix: string) => `${prefix}@example.com`;

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
      .send({
        email: payload.email,
        password: payload.password,
      })
      .expect(HttpStatus.OK);

    return {
      user: registration.body,
      token: `Bearer ${login.body.token}`,
      rawToken: login.body.token,
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

  const mockExternalEvent = (id: string, name: string) => ({
    id,
    name,
    info: `Descrição de ${name}`,
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
    url: `https://example.com/events/${id}`,
  });

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

  beforeEach(async () => {
    jest.clearAllMocks();
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await app.close();
  });

  it('GET /health should return 200', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(HttpStatus.OK)
      .expect("I'm okay!");
  });

  it('should reject invalid signup data', async () => {
    await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        username: '',
        email: 'invalid-email',
        password: '',
        role: 'INVALID_ROLE',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should create a user and authenticate successfully', async () => {
    const email = uniqueEmail('auth');

    const registration = await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'Test User',
        email,
        password: 'StrongPass123!',
        role: 'CLIENT',
      })
      .expect(HttpStatus.CREATED);

    expect(registration.body).toMatchObject({
      username: 'Test User',
      email,
      role: 'CLIENT',
    });

    const login = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email,
        password: 'StrongPass123!',
      })
      .expect(HttpStatus.OK);

    expect(login.body).toMatchObject({
      token: expect.any(String),
      user: {
        username: 'Test User',
        email,
        role: 'CLIENT',
      },
    });
  });

  it('should reject login with wrong password', async () => {
    const email = uniqueEmail('wrong-password');

    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'Test User',
        email,
        password: 'StrongPass123!',
        role: 'CLIENT',
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email,
        password: 'WrongPass123!',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should reject protected endpoints without authentication', async () => {
    await request(app.getHttpServer())
      .get('/events/my')
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .get('/events/gatekeeper')
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .get('/tickets/my')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should enforce organizer role on /events/my and /events POST', async () => {
    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    await request(app.getHttpServer())
      .get('/events/my')
      .set('Authorization', client.token)
      .expect(HttpStatus.FORBIDDEN);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', client.token)
      .send({
        externalId: 'external-role-test',
        capacity: 100,
        price: 50,
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should allow organizer to create an event and list its events', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const externalEvent = mockExternalEvent(
      'event-external-1',
      'Festival de Música',
    );

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 100,
        price: 150,
      })
      .expect(HttpStatus.CREATED);

    expect(created.body).toMatchObject({
      title: 'Festival de Música',
      capacity: 100,
      externalId: 'event-external-1',
      organizerId: organizer.user.id,
    });

    const myEvents = await request(app.getHttpServer())
      .get('/events/my')
      .set('Authorization', organizer.token)
      .expect(HttpStatus.OK);

    expect(myEvents.body).toEqual([
      expect.objectContaining({
        id: created.body.id,
        title: 'Festival de Música',
        source: 'local',
        price: 150,
      }),
    ]);
  });

  it('should allow client to reserve tickets and update sold count', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('reserve-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('reserve-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const externalEvent = mockExternalEvent('event-reserve', 'Evento Reserva');

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 5,
        price: 40,
      })
      .expect(HttpStatus.CREATED);

    const reservation = await request(app.getHttpServer())
      .post(`/events/${created.body.id}/reserve`)
      .set('Authorization', client.token)
      .send({ quantity: 2 })
      .expect(HttpStatus.CREATED);

    expect(reservation.body).toMatchObject({
      eventId: created.body.id,
      userId: client.user.id,
      quantity: 2,
      status: 'CONFIRMED',
    });

    const event = await request(app.getHttpServer())
      .get(`/events/${created.body.id}`)
      .expect(HttpStatus.OK);

    expect(event.body.soldCount).toBe(2);
  });

  it('should reject reservation by a non-client role', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('reserve-role-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const externalEvent = mockExternalEvent(
      'event-reserve-role',
      'Evento Role',
    );

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 10,
        price: 50,
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post(`/events/${created.body.id}/reserve`)
      .set('Authorization', organizer.token)
      .send({ quantity: 1 })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should reject a reservation above available capacity', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('capacity-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('capacity-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const externalEvent = mockExternalEvent(
      'event-capacity',
      'Evento Capacidade',
    );

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 2,
        price: 50,
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post(`/events/${created.body.id}/reserve`)
      .set('Authorization', client.token)
      .send({ quantity: 3 })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should allow client to buy tickets and list them', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('buy-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('buy-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const externalEvent = mockExternalEvent('event-ticket', 'Tech Summit');

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 30,
        price: 90,
      })
      .expect(HttpStatus.CREATED);

    const buy = await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', client.token)
      .send({
        eventId: created.body.id,
        quantity: 2,
      })
      .expect(HttpStatus.CREATED);

    expect(buy.body).toMatchObject({
      eventId: created.body.id,
      userId: client.user.id,
      quantity: 2,
      status: 'CONFIRMED',
      tickets: expect.any(Array),
    });

    expect(buy.body.tickets).toHaveLength(2);

    const myTickets = await request(app.getHttpServer())
      .get('/tickets/my')
      .set('Authorization', client.token)
      .expect(HttpStatus.OK);

    expect(myTickets.body).toHaveLength(2);
    expect(myTickets.body[0]).toMatchObject({
      status: 'VALID',
      event: {
        title: 'Tech Summit',
      },
    });
  });

  it('should reject ticket purchase by organizer', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('buy-role-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', organizer.token)
      .send({
        eventId: 1,
        quantity: 1,
      })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should validate a ticket by the correct gatekeeper and reject reuse', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('validation-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('validation-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const gatekeeper = await createUser({
      username: 'Gatekeeper',
      email: uniqueEmail('validation-gatekeeper'),
      password: 'StrongPass123!',
      role: 'GATEKEEPER',
    });

    const externalEvent = mockExternalEvent(
      'event-validation',
      'Festival Validação',
    );

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 20,
        price: 70,
      })
      .expect(HttpStatus.CREATED);

    const buy = await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', client.token)
      .send({
        eventId: created.body.id,
        quantity: 1,
      })
      .expect(HttpStatus.CREATED);

    const ticket = buy.body.tickets[0];

    const validation = await request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', gatekeeper.token)
      .send({
        shareToken: ticket.shareToken,
        eventId: created.body.id,
      })
      .expect(HttpStatus.CREATED);

    expect(validation.body).toMatchObject({
      message: 'Ticket validated successfully',
      event: 'Festival Validação',
      owner: 'Client',
    });

    await request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', gatekeeper.token)
      .send({
        shareToken: ticket.shareToken,
        eventId: created.body.id,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should reject ticket validation from another event', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('wrong-event-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('wrong-event-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const gatekeeper = await createUser({
      username: 'Gatekeeper',
      email: uniqueEmail('wrong-event-gatekeeper'),
      password: 'StrongPass123!',
      role: 'GATEKEEPER',
    });

    const first = mockExternalEvent('event-first', 'Evento Primeiro');
    const second = mockExternalEvent('event-second', 'Evento Segundo');

    ticketmasterMock.findEventByExternalId.mockImplementation(
      async (externalId: string) => (externalId === first.id ? first : second),
    );

    const firstCreated = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: first.id,
        capacity: 10,
        price: 50,
      })
      .expect(HttpStatus.CREATED);

    const secondCreated = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: second.id,
        capacity: 10,
        price: 50,
      })
      .expect(HttpStatus.CREATED);

    const buy = await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', client.token)
      .send({
        eventId: firstCreated.body.id,
        quantity: 1,
      })
      .expect(HttpStatus.CREATED);

    await request(app.getHttpServer())
      .post('/tickets/validate')
      .set('Authorization', gatekeeper.token)
      .send({
        shareToken: buy.body.tickets[0].shareToken,
        eventId: secondCreated.body.id,
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should expose a public ticket and show it as used after validation', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('public-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('public-client'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    const externalEvent = mockExternalEvent('event-public', 'Evento Público');

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    const created = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 10,
        price: 50,
      })
      .expect(HttpStatus.CREATED);

    const buy = await request(app.getHttpServer())
      .post('/tickets/buy')
      .set('Authorization', client.token)
      .send({
        eventId: created.body.id,
        quantity: 1,
      })
      .expect(HttpStatus.CREATED);

    const shareToken = buy.body.tickets[0].shareToken;

    const publicTicket = await request(app.getHttpServer())
      .get(`/tickets/public/${shareToken}`)
      .expect(HttpStatus.OK);

    expect(publicTicket.body).toMatchObject({
      id: expect.any(Number),
      status: 'VALID',
      event: {
        title: 'Evento Público',
      },
    });
  });

  it('should allow gatekeeper to list local events', async () => {
    const organizer = await createUser({
      username: 'Organizer',
      email: uniqueEmail('gate-events-organizer'),
      password: 'StrongPass123!',
      role: 'ORGANIZER',
    });

    const gatekeeper = await createUser({
      username: 'Gatekeeper',
      email: uniqueEmail('gate-events-gatekeeper'),
      password: 'StrongPass123!',
      role: 'GATEKEEPER',
    });

    const externalEvent = mockExternalEvent(
      'event-gatekeeper',
      'Evento Portaria',
    );

    ticketmasterMock.findEventByExternalId.mockResolvedValue(externalEvent);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', organizer.token)
      .send({
        externalId: externalEvent.id,
        capacity: 20,
        price: 60,
      })
      .expect(HttpStatus.CREATED);

    const events = await request(app.getHttpServer())
      .get('/events/gatekeeper')
      .set('Authorization', gatekeeper.token)
      .expect(HttpStatus.OK);

    expect(events.body).toEqual([
      expect.objectContaining({
        title: 'Evento Portaria',
        capacity: 20,
      }),
    ]);
  });

  it('should logout successfully', async () => {
    const client = await createUser({
      username: 'Client',
      email: uniqueEmail('logout'),
      password: 'StrongPass123!',
      role: 'CLIENT',
    });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', client.token)
      .expect(HttpStatus.OK)
      .expect({ message: 'Logout successful' });

    const sessions = await prisma.session.findMany({
      where: {
        token: client.rawToken,
      },
    });

    expect(sessions).toHaveLength(0);
  });
});
