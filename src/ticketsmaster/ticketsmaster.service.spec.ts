import { TicketmasterService } from './ticketsmaster.service';

describe('TicketmasterService', () => {
  let service: TicketmasterService;
  const originalFetch = global.fetch;
  const originalApiKey = process.env.TICKETMASTER_API_KEY;

  beforeEach(() => {
    process.env.TICKETMASTER_API_KEY = 'test-api-key';
    service = new TicketmasterService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;

    if (originalApiKey === undefined) {
      delete process.env.TICKETMASTER_API_KEY;
    } else {
      process.env.TICKETMASTER_API_KEY = originalApiKey;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return Ticketmaster events', async () => {
    const events = [
      { id: 'event-1', name: 'Festival' },
      { id: 'event-2', name: 'Show' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        _embedded: {
          events,
        },
      }),
    });

    const result = await service.findEvents();

    expect(result).toEqual(events);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://app.ticketmaster.com/discovery/v2/events.json?apikey=',
      ),
    );
  });

  it('should return an empty array when Ticketmaster has no events', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(service.findEvents()).resolves.toEqual([]);
  });

  it('should throw when Ticketmaster returns an unsuccessful response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn(),
    });

    await expect(service.findEvents()).rejects.toThrow(
      'Ticketmaster API unavailable',
    );
  });

  it('should find an event by external id', async () => {
    const events = [
      { id: 'event-1', name: 'Festival' },
      { id: 'event-2', name: 'Show' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        _embedded: { events },
      }),
    });

    await expect(service.findEventByExternalId('event-2')).resolves.toEqual(
      events[1],
    );
  });

  it('should return null when the external id is not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        _embedded: {
          events: [{ id: 'event-1', name: 'Festival' }],
        },
      }),
    });

    await expect(
      service.findEventByExternalId('unknown-event'),
    ).resolves.toBeNull();
  });
});
