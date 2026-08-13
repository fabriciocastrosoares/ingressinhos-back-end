import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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

  @Post('validate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('GATEKEEPER')
  validate(@Req() request: any, @Body() dto: ValidateTicketDto) {
    return this.service.validate(request.user.id, dto);
  }
}
