import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetMpinDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'reset-token-uuid' })
  @IsString()
  token: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Length(6, 6)
  newMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Length(6, 6)
  confirmMpin: string;
}
