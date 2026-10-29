import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, AccountStatus } from '@schoolride/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  async getPlatformOverview() {
    return this.adminService.getPlatformOverview();
  }

  @Get('verifications')
  async getVerificationQueue() {
    return this.adminService.getDriverVerificationQueue();
  }

  @Patch('verifications/:driverId/approve')
  async approveDriver(
    @CurrentUser('id') adminId: string,
    @Param('driverId') driverId: string,
  ) {
    return this.adminService.approveDriver(adminId, driverId);
  }

  @Patch('verifications/:driverId/reject')
  async rejectDriver(
    @CurrentUser('id') adminId: string,
    @Param('driverId') driverId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectDriver(adminId, driverId, reason);
  }

  @Get('users')
  async listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('query') query?: string,
  ) {
    return this.adminService.listUsers(role, status, query);
  }

  @Patch('users/:userId/status')
  async updateUserStatus(
    @CurrentUser('id') adminId: string,
    @Param('userId') userId: string,
    @Body('status') status: AccountStatus,
    @Body('reason') reason?: string,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required.');
    }
    return this.adminService.updateUserStatus(adminId, userId, status, reason);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.adminService.getAuditLogs(parseInt(page, 10), parseInt(limit, 10));
  }
}
