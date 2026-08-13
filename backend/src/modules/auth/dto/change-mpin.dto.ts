import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeMpinDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  currentMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  newMpin: string;

  @ApiProperty({ example: '654321' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Confirm MPIN must be exactly 6 digits' })
  confirmMpin: string;
}
