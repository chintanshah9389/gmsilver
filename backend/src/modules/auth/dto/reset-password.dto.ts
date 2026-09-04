import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'reset-token-uuid' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newpass' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  @Matches(/^\S+$/, { message: 'Password cannot contain spaces' })
  newPassword: string;

  @ApiProperty({ example: 'NewPass@123' })
  @IsString()
  confirmPassword: string;
}
