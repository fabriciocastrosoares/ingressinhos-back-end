import { IsInt, IsPositive } from 'class-validator';

export class BuyTicketDto {
  @IsInt()
  eventId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
