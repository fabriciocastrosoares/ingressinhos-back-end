import { IsInt, Min } from 'class-validator';

export class ReserveDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
