import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  date: string; // ISO string

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber()
  price: number;
}
