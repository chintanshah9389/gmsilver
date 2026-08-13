import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MpinLoginDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  mpin: string;

  @ApiPropertyOptional({ example: 'fcm_token_here' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
