import { IsUUID, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CartUnit } from '@prisma/client';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID('all')
  productId: string;

  @ApiProperty({ example: 1, description: 'Piece quantity (always stored as pcs)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ enum: CartUnit, default: CartUnit.PIECES })
  @IsOptional()
  @IsEnum(CartUnit)
  unit?: CartUnit;

  @ApiPropertyOptional({
    example: 0.5,
    description: 'Display amount in the selected unit (pcs count or kg)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  unitAmount?: number;
}
