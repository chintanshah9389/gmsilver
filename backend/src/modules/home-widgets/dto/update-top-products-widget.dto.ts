import { BannerLinkType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTopProductsWidgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

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
}