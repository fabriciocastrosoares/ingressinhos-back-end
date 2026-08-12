import { Module, forwardRef } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../Prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { EventsRepository } from './events.repository';

@Module({
  imports: [
    TicketsModule,
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [EventsService, RolesGuard, EventsRepository],
  controllers: [EventsController],
})
export class EventsModule {}
