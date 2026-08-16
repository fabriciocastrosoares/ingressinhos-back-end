import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EventsService } from './events.service';

import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/roles.decorator';

import { CreateEventDto } from './dto/create-event.dto';
import { ReserveDto } from './dto/reserve.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list() {
    return this.eventsService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Get('my')
  myEvents(@Req() request: any) {
    return this.eventsService.findMyEvents(request.user.id);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto, @Req() request: any) {
    return this.eventsService.create(request.user.id, dto);
  }

  @Post(':id/reserve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('CLIENT')
  reserve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserveDto,
    @Req() request: any,
  ) {
    return this.eventsService.reserve(id, request.user.id, dto);
  }
}
