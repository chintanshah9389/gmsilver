import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateAppReleaseConfigDto {
  @ApiPropertyOptional({ example: '1.0.1' })
  @IsOptional()
  @IsString()
  androidLatestVersionName?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  androidLatestVersionCode?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  androidMinVersionCode?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/gmsilver-1.0.1.apk',
  })
  @IsOptional()
  @IsString()
  androidApkUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  androidForceUpdate?: boolean;

  @ApiPropertyOptional({ example: '1.0.1' })
  @IsOptional()
  @IsString()
  iosLatestVersionName?: string;

  @ApiPropertyOptional({
    example: 'https://apps.apple.com/app/idXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  iosStoreUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  iosForceUpdate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  enabled?: boolean;
}
