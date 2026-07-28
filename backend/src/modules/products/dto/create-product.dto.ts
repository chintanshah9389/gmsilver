import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Silver Coin 10g' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Pure 999 silver coin' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '5500.00' })
  @IsString()
  price: string;

  @ApiPropertyOptional({ example: '10.000' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ example: '999' })
  @IsOptional()
  @IsString()
  purity?: string;

  @ApiPropertyOptional({ example: 'SC-10G-999' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  isAvailable?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
