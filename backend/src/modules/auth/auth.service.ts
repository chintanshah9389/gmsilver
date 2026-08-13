import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { BcryptUtil } from '../../common/utils/bcrypt.util';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { MpinLoginDto } from './dto/mpin-login.dto';
import { CreateMpinDto } from './dto/create-mpin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotMpinDto } from './dto/forgot-mpin.dto';
import { ResetMpinDto } from './dto/reset-mpin.dto';
import { ResetMpinWithPasswordDto } from './dto/reset-mpin-with-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeMpinDto } from './dto/change-mpin.dto';
import { ResetWithSecurityQuestionDto } from './dto/reset-with-security-question.dto';
import {
  getSecurityQuestionLabel,
  normalizeSecurityAnswer,
  SECURITY_QUESTIONS,
} from './security-questions';
import { getIdentifier, isEmailIdentifier, normalizePhone } from './identifier.util';
import { UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  // ─── SIGNUP ───────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const phone = normalizePhone(dto.phone);
    if (phone.length < 10) {
      throw new BadRequestException('Enter a valid 10-digit mobile number');
    }

    const existingPhone = await this.findUserByIdentifier(phone);
    if (existingPhone) {
      throw new ConflictException('Mobile number already registered');
    }

    if (dto.mpin !== dto.confirmMpin) {
      throw new BadRequestException('MPINs do not match');
    }

    const hashedPassword = await BcryptUtil.hash(dto.password);
    const hashedMpin = await BcryptUtil.hashMpin(dto.mpin);
    const hashedAnswer = await BcryptUtil.hash(
      normalizeSecurityAnswer(dto.securityAnswer),
    );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        phone,
        password: hashedPassword,
        mpin: hashedMpin,
        securityQuestion: dto.securityQuestion,
        securityAnswer: hashedAnswer,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Notify admins about new signup
    await this.notificationsService.notifyAdminsNewUser(user.id, user.name);

    return {
      message: 'Registration successful. Awaiting admin approval.',
      data: user,
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.requireUserByIdentifier(getIdentifier(dto));

    if (user.deletedAt) {
      throw new ForbiddenException('Account has been deleted');
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Account pending approval');
    }

    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException('Account has been rejected');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Account has been blocked');
    }

    const isPasswordValid = await BcryptUtil.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update FCM token if provided
    if (dto.fcmToken) {
      await this.usersService.updateFcmToken(user.id, dto.fcmToken);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Login successful',
      data: {
        user: this.toAuthUser(user),
        ...tokens,
      },
    };
  }

  // ─── MPIN LOGIN ───────────────────────────────────────────────────
  async mpinLogin(dto: MpinLoginDto) {
    const user = await this.requireUserByIdentifier(getIdentifier(dto));

    if (!user.mpin) {
      throw new UnauthorizedException('MPIN not set up for this account');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('Account has been deleted');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Account is not active');
    }

    const isMpinValid = await BcryptUtil.compareMpin(dto.mpin, user.mpin);

    if (!isMpinValid) {
      throw new UnauthorizedException('Invalid MPIN');
    }

    if (dto.fcmToken) {
      await this.usersService.updateFcmToken(user.id, dto.fcmToken);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'MPIN login successful',
      data: {
        user: this.toAuthUser(user),
        ...tokens,
      },
    };
  }

  // ─── CREATE MPIN ──────────────────────────────────────────────────
  async createMpin(userId: string, dto: CreateMpinDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.mpin !== dto.confirmMpin) {
      throw new BadRequestException('MPINs do not match');
    }

    const hashedMpin = await BcryptUtil.hashMpin(dto.mpin);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mpin: hashedMpin },
    });

    return { message: 'MPIN created successfully' };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────
  async refreshToken(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (storedToken.user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Account is not active');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return { message: 'Token refreshed', data: tokens };
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────
  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.findUserByIdentifier(getIdentifier(dto));

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    // In production, generate OTP/token and send via email/SMS
    // For now, return a placeholder token
    const resetToken = uuidv4();

    // Store reset token with expiry (you'd use a separate table or Redis in production)
    // For this implementation, we'll use a temporary approach
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        deviceDetails: {
          ...((user.deviceDetails as object) || {}),
          passwordResetToken: resetToken,
          passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      },
    });

    return {
      message: 'Password reset token generated',
      data: { resetToken }, // In production, send this via email/SMS only
    };
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.findUserByIdentifier(getIdentifier(dto));

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const deviceDetails = user.deviceDetails as any;
    const storedToken = deviceDetails?.passwordResetToken;
    const expiry = deviceDetails?.passwordResetExpiry;

    if (!storedToken || storedToken !== dto.token) {
      throw new BadRequestException('Invalid reset token');
    }

    if (new Date() > new Date(expiry)) {
      throw new BadRequestException('Reset token expired');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedPassword = await BcryptUtil.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        deviceDetails: {
          ...((deviceDetails as object) || {}),
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── FORGOT MPIN ──────────────────────────────────────────────────
  async forgotMpin(dto: ForgotMpinDto) {
    const user = await this.findUserByIdentifier(getIdentifier(dto));

    if (!user) {
      return { message: 'If this email exists, a reset token has been sent.' };
    }

    const resetToken = uuidv4();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        deviceDetails: {
          ...((user.deviceDetails as object) || {}),
          mpinResetToken: resetToken,
          mpinResetExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      },
    });

    return {
      message: 'MPIN reset token generated',
      data: { resetToken },
    };
  }

  // ─── RESET MPIN ───────────────────────────────────────────────────
  async resetMpin(dto: ResetMpinDto) {
    const user = await this.findUserByIdentifier(getIdentifier(dto));

    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const deviceDetails = user.deviceDetails as any;
    const storedToken = deviceDetails?.mpinResetToken;
    const expiry = deviceDetails?.mpinResetExpiry;

    if (!storedToken || storedToken !== dto.token) {
      throw new BadRequestException('Invalid reset token');
    }

    if (new Date() > new Date(expiry)) {
      throw new BadRequestException('Reset token expired');
    }

    if (dto.newMpin !== dto.confirmMpin) {
      throw new BadRequestException('MPINs do not match');
    }

    const hashedMpin = await BcryptUtil.hashMpin(dto.newMpin);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mpin: hashedMpin,
        deviceDetails: {
          ...((deviceDetails as object) || {}),
          mpinResetToken: null,
          mpinResetExpiry: null,
        },
      },
    });

    return { message: 'MPIN reset successfully' };
  }

  // ─── RESET MPIN WITH PASSWORD ─────────────────────────────────────
  async resetMpinWithPassword(dto: ResetMpinWithPasswordDto) {
    const user = await this.requireUserByIdentifier(getIdentifier(dto));

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Account is not active');
    }

    const isPasswordValid = await BcryptUtil.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (dto.newMpin !== dto.confirmMpin) {
      throw new BadRequestException('MPINs do not match');
    }

    const hashedMpin = await BcryptUtil.hashMpin(dto.newMpin);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mpin: hashedMpin },
    });

    return { message: 'MPIN reset successfully. You can now login with your new MPIN.' };
  }

  // ─── SECURITY QUESTION LOOKUP ─────────────────────────────────────
  getSecurityQuestions() {
    return { data: SECURITY_QUESTIONS };
  }

  async getSecurityQuestion(identifier: string) {
    const user = await this.findUserByIdentifier(identifier);

    if (!user || user.deletedAt || !user.securityQuestion || !user.securityAnswer) {
      throw new NotFoundException('No security question found for this account');
    }

    const question =
      getSecurityQuestionLabel(user.securityQuestion) || user.securityQuestion;

    return {
      message: 'Answer your security question to reset password and MPIN',
      data: {
        email: user.email,
        question,
      },
    };
  }

  // ─── RESET WITH SECURITY QUESTION ─────────────────────────────────
  async resetWithSecurityQuestion(dto: ResetWithSecurityQuestionDto) {
    const user = await this.requireUserByIdentifier(getIdentifier(dto));

    if (!user || user.deletedAt || !user.securityAnswer) {
      throw new UnauthorizedException('Invalid security answer');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Account is not active');
    }

    const isAnswerValid = await BcryptUtil.compare(
      normalizeSecurityAnswer(dto.securityAnswer),
      user.securityAnswer,
    );

    if (!isAnswerValid) {
      throw new UnauthorizedException('Invalid security answer');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (dto.newMpin !== dto.confirmMpin) {
      throw new BadRequestException('MPINs do not match');
    }

    const hashedPassword = await BcryptUtil.hash(dto.newPassword);
    const hashedMpin = await BcryptUtil.hashMpin(dto.newMpin);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mpin: hashedMpin,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    return {
      message: 'Password and MPIN reset successfully. Sign in with your new MPIN.',
    };
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await BcryptUtil.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const hashedPassword = await BcryptUtil.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── CHANGE MPIN ──────────────────────────────────────────────────
  async changeMpin(userId: string, dto: ChangeMpinDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.mpin) {
      throw new BadRequestException('MPIN not set up');
    }

    const isCurrentMpinValid = await BcryptUtil.compareMpin(
      dto.currentMpin,
      user.mpin,
    );

    if (!isCurrentMpinValid) {
      throw new UnauthorizedException('Current MPIN is incorrect');
    }

    if (dto.newMpin !== dto.confirmMpin) {
      throw new BadRequestException('New MPINs do not match');
    }

    const hashedMpin = await BcryptUtil.hashMpin(dto.newMpin);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mpin: hashedMpin },
    });

    return { message: 'MPIN changed successfully' };
  }

  // ─── GET ME ───────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        mpin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { mpin, ...safeUser } = user;
    return { data: { ...safeUser, hasMpin: Boolean(mpin) } };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────
  private async findUserByIdentifier(raw: string) {
    const identifier = (raw || '').trim();
    if (!identifier) {
      return null;
    }

    if (isEmailIdentifier(identifier)) {
      return this.prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
      });
    }

    const phone = normalizePhone(identifier);
    if (phone.length < 10) {
      return null;
    }

    const last10 = phone.slice(-10);
    const spaced = `${last10.slice(0, 5)} ${last10.slice(5)}`;

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { phone: last10 },
          { phone: `+${phone}` },
          { phone: `+91${last10}` },
          { phone: `91${last10}` },
          { phone: `+91 ${spaced}` },
          { phone: { endsWith: last10 } },
          { phone: { contains: last10 } },
          { phone: { contains: spaced } },
        ],
      },
    });
  }

  private async requireUserByIdentifier(raw: string) {
    const identifier = (raw || '').trim();
    if (!identifier) {
      throw new BadRequestException('Email or mobile number is required');
    }

    const user = await this.findUserByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status?: string;
    mpin?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      hasMpin: Boolean(user.mpin),
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn'),
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: refreshExpiresIn,
    };
  }
}
