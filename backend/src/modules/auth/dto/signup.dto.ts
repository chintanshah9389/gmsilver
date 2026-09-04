import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsIn,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SECURITY_QUESTION_KEYS } from '../security-questions';

export class SignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Acme Jewellers' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName: string;

  @ApiProperty({ example: 'Mumbai', description: 'City or destination' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^\+?[\d\s-]{10,15}$/, { message: 'Enter a valid 10-digit mobile number' })
  phone: string;

  @ApiProperty({ example: 'pass12' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  @Matches(/^\S+$/, { message: 'Password cannot contain spaces' })
  password: string;

  @ApiProperty({ example: '123456', description: '6-digit MPIN used for app login' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MPIN must be exactly 6 digits' })
  mpin: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Confirm MPIN must be exactly 6 digits' })
  confirmMpin: string;

  @ApiProperty({ example: 'FIRST_PET' })
  @IsString()
  @IsIn(SECURITY_QUESTION_KEYS, { message: 'Select a valid security question' })
  securityQuestion: string;

  @ApiProperty({ example: 'Bruno' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  securityAnswer: string;

  @ApiPropertyOptional({
    example: 'fcm_token_here',
    description: 'Device FCM token so approval push can be delivered before first login',
  })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
