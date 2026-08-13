import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
