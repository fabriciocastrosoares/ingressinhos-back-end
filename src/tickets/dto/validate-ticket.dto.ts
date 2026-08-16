import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @IsNotEmpty()
  shareToken: string;

  @IsInt()
  @Min(1)
  eventId: number;
}
