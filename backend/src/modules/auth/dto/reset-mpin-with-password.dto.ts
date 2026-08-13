import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetMpinWithPasswordDto {
  @ApiPropertyOptional({ example: 'john@example.com or 9876543210' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  newMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Confirm MPIN must be exactly 6 digits' })
  confirmMpin: string;
}
