import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MpinLoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  mpin: string;

  @ApiPropertyOptional({ example: 'fcm_token_here' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
