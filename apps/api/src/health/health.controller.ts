import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'schoolride-lk-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Colombo',
    };
  }

  @Get('db')
  async getDbHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        message: err.message,
      });
    }
  }
}
