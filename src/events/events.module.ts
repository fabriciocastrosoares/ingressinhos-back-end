import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../Prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TicketsModule } from '../tickets/tickets.module';

import { TicketmasterModule } from '../ticketsmaster/ticketmaster.module';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';

import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    TicketsModule,
    TicketmasterModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, RolesGuard],
})
export class EventsModule {}
