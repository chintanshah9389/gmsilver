import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerType, BannerLinkType } from '@prisma/client';

export class CreateBannerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ enum: BannerType })
  @IsOptional()
  @IsEnum(BannerType)
  badgeLabel?: BannerType;

  @ApiPropertyOptional({ enum: BannerLinkType })
  @IsOptional()
  @IsEnum(BannerLinkType)
  linkType?: BannerLinkType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  @IsInt()
  sortOrder?: number;
}
