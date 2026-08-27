import { IsOptional, IsString, IsUUID, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() page?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() limit?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isAvailable?: string;
  @ApiPropertyOptional({ description: 'Filter by active flag; omit for default catalog behavior' })
  @IsOptional()
  @IsString()
  isActive?: string;
  @ApiPropertyOptional({
    description: 'When true, include inactive products (admin catalog). Default false for public catalog.',
  })
  @IsOptional()
  @IsString()
  includeInactive?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() minPrice?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() maxPrice?: string;
  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'name', 'newest'] })
  @IsOptional() @IsString() sortBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() purity?: string;
}
