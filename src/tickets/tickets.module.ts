import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../Prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';

import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, AuthGuard, RolesGuard],
  exports: [TicketsService],
})
export class TicketsModule {}
