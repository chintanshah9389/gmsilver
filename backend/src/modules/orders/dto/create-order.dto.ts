import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'Please pack carefully' })
  @IsOptional()
  @IsString()
  notes?: string;
}
