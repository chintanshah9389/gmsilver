import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserCredentialsDto {
  @ApiPropertyOptional({ example: 'pass12' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  @Matches(/^\S+$/, { message: 'Password cannot contain spaces' })
  password?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  mpin?: string;
}