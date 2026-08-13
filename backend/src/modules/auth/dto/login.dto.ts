import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'fcm_token_here' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
