import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeaderOrCookie(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required. Missing token.');
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-schoolride-lk-min-32-chars-long!';
      const payload = jwt.verify(token, secret) as {
        sub: string;
        email: string;
        role: string;
      };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User account no longer exists.');
      }

      if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
        throw new ForbiddenException('Your account is currently suspended or deactivated. Contact support.');
      }

      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  private extractTokenFromHeaderOrCookie(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }
    return null;
  }
}
