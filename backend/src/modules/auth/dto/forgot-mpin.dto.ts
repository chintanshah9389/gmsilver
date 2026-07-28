import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotMpinDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
