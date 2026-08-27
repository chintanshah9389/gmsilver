import { IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CartUnit } from '@prisma/client';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ enum: CartUnit })
  @IsOptional()
  @IsEnum(CartUnit)
  unit?: CartUnit;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  unitAmount?: number;
}
