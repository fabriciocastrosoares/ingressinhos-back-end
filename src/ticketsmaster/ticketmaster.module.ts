import { Module } from '@nestjs/common';
import { TicketmasterService } from './ticketsmaster.service';

@Module({
  providers: [TicketmasterService],
  exports: [TicketmasterService],
})
export class TicketmasterModule {}
