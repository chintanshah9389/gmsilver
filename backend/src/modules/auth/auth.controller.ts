import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { MpinLoginDto } from './dto/mpin-login.dto';
import { CreateMpinDto } from './dto/create-mpin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotMpinDto } from './dto/forgot-mpin.dto';
import { ResetMpinDto } from './dto/reset-mpin.dto';
import { ResetMpinWithPasswordDto } from './dto/reset-mpin-with-password.dto';
import { ResetWithSecurityQuestionDto } from './dto/reset-with-security-question.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeMpinDto } from './dto/change-mpin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getIdentifier } from './identifier.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new customer account' })
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email or mobile and password' })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login/mpin')
  @ApiOperation({ summary: 'Login with email or mobile and MPIN' })
  @HttpCode(HttpStatus.OK)
  mpinLogin(@Body() dto: MpinLoginDto) {
    return this.authService.mpinLogin(dto);
  }

  @Post('mpin/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create or update MPIN' })
  @HttpCode(HttpStatus.OK)
  createMpin(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMpinDto,
  ) {
    return this.authService.createMpin(userId, dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentUser('id') userId: string,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(userId, dto.refreshToken);
  }

  @Post('password/forgot')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with token' })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('mpin/forgot')
  @ApiOperation({ summary: 'Request MPIN reset' })
  @HttpCode(HttpStatus.OK)
  forgotMpin(@Body() dto: ForgotMpinDto) {
    return this.authService.forgotMpin(dto);
  }

  @Post('mpin/reset')
  @ApiOperation({ summary: 'Reset MPIN with token' })
  @HttpCode(HttpStatus.OK)
  resetMpin(@Body() dto: ResetMpinDto) {
    return this.authService.resetMpin(dto);
  }

  @Post('mpin/reset-with-password')
  @ApiOperation({ summary: 'Reset MPIN by verifying account password' })
  @HttpCode(HttpStatus.OK)
  resetMpinWithPassword(@Body() dto: ResetMpinWithPasswordDto) {
    return this.authService.resetMpinWithPassword(dto);
  }

  @Get('security-questions')
  @ApiOperation({ summary: 'List security questions for signup' })
  getSecurityQuestions() {
    return this.authService.getSecurityQuestions();
  }

  @Post('security-question')
  @ApiOperation({ summary: 'Look up security question by email' })
  @HttpCode(HttpStatus.OK)
  getSecurityQuestion(@Body() dto: ForgotPasswordDto) {
    return this.authService.getSecurityQuestion(getIdentifier(dto));
  }

  @Post('reset-with-security-question')
  @ApiOperation({ summary: 'Reset password and MPIN using security question' })
  @HttpCode(HttpStatus.OK)
  resetWithSecurityQuestion(@Body() dto: ResetWithSecurityQuestionDto) {
    return this.authService.resetWithSecurityQuestion(dto);
  }

  @Patch('password/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Change password (authenticated)' })
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Patch('mpin/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Change MPIN (authenticated)' })
  @HttpCode(HttpStatus.OK)
  changeMpin(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeMpinDto,
  ) {
    return this.authService.changeMpin(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}
