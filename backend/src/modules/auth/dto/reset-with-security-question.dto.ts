import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetWithSecurityQuestionDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  securityAnswer: string;

  @ApiProperty({ example: 'newpass' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  @Matches(/^\S+$/, { message: 'Password cannot contain spaces' })
  newPassword: string;

  @ApiProperty({ example: 'NewPass@123' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  newMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Confirm MPIN must be exactly 6 digits' })
  confirmMpin: string;
}
