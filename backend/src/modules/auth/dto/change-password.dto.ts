import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsString()
  currentPassword: string;

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
