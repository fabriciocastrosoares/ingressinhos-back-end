import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketmasterService {
  private readonly BASE_URL =
    'https://app.ticketmaster.com/discovery/v2/events.json';

  private readonly API_KEY = process.env.TICKETMASTER_API_KEY;

  async findEvents() {
    const response = await fetch(`${this.BASE_URL}?apikey=${this.API_KEY}`);

    if (!response.ok) {
      throw new Error('Ticketmaster API unavailable');
    }

    const data = await response.json();

    return data._embedded?.events ?? [];
  }

  async findEventByExternalId(externalId: string) {
    const events = await this.findEvents();

    const event = events.find((e: any) => e.id === externalId);

    return event ?? null;
  }
}
