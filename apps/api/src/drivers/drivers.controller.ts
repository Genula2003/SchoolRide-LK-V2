import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  UserRole,
  updateDriverProfileSchema,
  createVehicleSchema,
  updateCoverageSchema,
  driverSearchFilterSchema,
} from '@schoolride/shared';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /**
   * Public driver discovery endpoint
   */
  @Get()
  async searchDrivers(@Query() query: any) {
    const parseResult = driverSearchFilterSchema.safeParse(query);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.driversService.searchDrivers(parseResult.data);
  }

  /**
   * Public driver profile view
   */
  @Get(':id/public')
  async getPublicDriverProfile(@Param('id') driverId: string) {
    return this.driversService.getPublicDriverProfile(driverId);
  }

  /**
   * Authenticated driver endpoints
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.driversService.getMyDriverProfile(userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = updateDriverProfileSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.driversService.updateDriverProfile(userId, parseResult.data);
  }

  @Post('me/vehicles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async addVehicle(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = createVehicleSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.driversService.addVehicle(userId, parseResult.data);
  }

  @Patch('me/coverage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async updateCoverage(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = updateCoverageSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.driversService.updateCoverage(userId, parseResult.data);
  }

  @Post('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @Body() body: { documentType: any; fileKey: string; fileName: string; fileSize: number; mimeType: string },
  ) {
    if (!body.documentType || !body.fileKey) {
      throw new BadRequestException('Document type and fileKey are required.');
    }
    return this.driversService.uploadDriverDocument(userId, body.documentType, {
      fileKey: body.fileKey,
      fileName: body.fileName || 'document.pdf',
      fileSize: body.fileSize || 1024,
      mimeType: body.mimeType || 'application/pdf',
    });
  }
}
