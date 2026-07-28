import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeMpinDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  currentMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Length(6, 6)
  newMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Length(6, 6)
  confirmMpin: string;
}
