import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import {
  LoginInput,
  RegisterParentInput,
  RegisterDriverInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UserRole,
  AccountStatus,
  VerificationStatus,
  NotificationType,
} from '@schoolride/shared';

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-schoolride-lk-min-32-chars-long!';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-schoolride-lk-min-32-chars-long!';

  constructor(private readonly prisma: PrismaService) {}

  async registerParent(input: RegisterParentInput) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (existingPhone) {
      throw new ConflictException('An account with this mobile phone number already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: UserRole.PARENT,
        status: AccountStatus.ACTIVE,
        district: input.district,
        city: input.city,
        parentProfile: {
          create: {
            city: input.city,
            district: input.district,
          },
        },
        notifications: {
          create: {
            title: 'Welcome to SchoolRide LK!',
            message: 'Your parent account has been successfully created. You can now add children and search for verified school van operators.',
            type: NotificationType.SYSTEM,
          },
        },
      },
      include: {
        parentProfile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async registerDriver(input: RegisterDriverInput) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (existingPhone) {
      throw new ConflictException('An account with this mobile phone number already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create unique temporary placeholder for NIC and license to be updated in onboarding
    const tempNic = `PENDING_${Date.now()}`;
    const tempLicense = `PENDING_${Date.now()}`;

    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: UserRole.DRIVER,
        status: AccountStatus.PENDING_VERIFICATION,
        district: input.district,
        driverProfile: {
          create: {
            nicNumber: tempNic,
            licenseNumber: tempLicense,
            verificationStatus: VerificationStatus.PENDING,
          },
        },
        notifications: {
          create: {
            title: 'Driver Registration Received',
            message: 'Please complete your profile, upload your driving license and vehicle registration documents to submit for verification.',
            type: NotificationType.VERIFICATION_SUBMITTED,
          },
        },
      },
      include: {
        driverProfile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        parentProfile: true,
        driverProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DEACTIVATED) {
      throw new UnauthorizedException('Your account has been suspended or deactivated. Please contact support.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshTokenStr: string, ipAddress?: string, userAgent?: string) {
    if (!refreshTokenStr) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    try {
      const payload = jwt.verify(refreshTokenStr, this.refreshSecret) as { sub: string; jti: string };
      const tokenHash = this.hashToken(refreshTokenStr);

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken || storedToken.revokedAt || new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token is invalid or has been revoked.');
      }

      // Revoke the old token (rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status === AccountStatus.SUSPENDED) {
        throw new UnauthorizedException('User account no longer valid.');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);

      return tokens;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  async logout(refreshTokenStr?: string) {
    if (refreshTokenStr) {
      const tokenHash = this.hashToken(refreshTokenStr);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true, message: 'Logged out successfully.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        parentProfile: {
          include: {
            children: {
              where: { isActive: true },
              include: { school: true },
            },
          },
        },
        driverProfile: {
          include: {
            vehicles: true,
            documents: true,
            serviceAreas: true,
            schoolCoverages: {
              include: { school: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.sanitizeUser(user);
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // To prevent email enumeration, return success even if user not found
    if (!user) {
      return { success: true, message: 'If an account matches this email, a reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(resetToken),
        expiresAt: resetExpiry,
        userAgent: 'password_reset_token',
      },
    });

    // In a production environment with email configured, email delivery adapter dispatches here.
    return {
      success: true,
      message: 'If an account matches this email, a reset link has been dispatched.',
      debugToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = this.hashToken(input.token);
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true, message: 'Password has been updated. You may now log in.' };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password does not match.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const accessToken = jwt.sign(
      { sub: userId, email, role },
      this.accessSecret,
      { expiresIn: '15m' },
    );

    const refreshTokenJti = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { sub: userId, jti: refreshTokenJti },
      this.refreshSecret,
      { expiresIn: '7d' },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
