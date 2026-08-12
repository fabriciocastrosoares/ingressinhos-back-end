import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { AuthGuard } from '../guards/auth.guards';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../common/roles.decorator';
import { ReserveDto } from './dto/reserve.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEventDto, @Req() request: any) {
    const organizerId = request.user?.id;
    return this.eventsService.create(organizerId, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('CLIENT')
  @Post(':id/reserve')
  async reserve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReserveDto,
    @Req() request: any,
  ) {
    const userId = request.user?.id;
    return this.eventsService.reserve(id, userId, dto);
  }
}
