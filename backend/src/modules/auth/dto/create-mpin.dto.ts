import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMpinDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  mpin: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  confirmMpin: string;
}
