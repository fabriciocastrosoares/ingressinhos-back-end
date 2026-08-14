import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post('buy')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('CLIENT')
  @HttpCode(HttpStatus.CREATED)
  buy(@Req() request: any, @Body() dto: BuyTicketDto) {
    return this.service.buy(request.user.id, dto);
  }

  @Get('my')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('CLIENT')
  findMyTickets(@Req() request: any) {
    return this.service.findMyTickets(request.user.id);
  }

  @Get(':code')
  @UseGuards(AuthGuard)
  getTicket(@Param('code') code: string) {
    return this.service.getByCode(code);
  }

  @Post('validate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GATEKEEPER')
  validate(@Req() request: any, @Body() dto: ValidateTicketDto) {
    return this.service.validate(request.user.id, dto);
  }
}
