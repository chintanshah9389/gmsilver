import { IsEmail, IsString, MinLength, MaxLength, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SECURITY_QUESTION_KEYS } from '../security-questions';

export class SignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^\+?[\d\s-]{10,15}$/, { message: 'Enter a valid 10-digit mobile number' })
  phone: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
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
}
