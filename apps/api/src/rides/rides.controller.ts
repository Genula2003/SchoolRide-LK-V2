import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  startRideSessionSchema,
  broadcastLocationSchema,
  updatePassengerStatusSchema,
} from '@schoolride/shared';

@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('start')
  async startRide(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = startRideSessionSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.ridesService.startRideSession(userId, parseResult.data);
  }

  @Get('active')
  async getActiveRide(@CurrentUser() user: AuthenticatedUser) {
    return this.ridesService.getActiveRideForUser(user);
  }

  @Get(':id')
  async getRideById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') rideId: string,
  ) {
    return this.ridesService.getRideById(user, rideId);
  }

  @Post(':id/location')
  async recordLocation(
    @CurrentUser('id') userId: string,
    @Param('id') rideId: string,
    @Body() body: any,
  ) {
    const parseResult = broadcastLocationSchema.safeParse({
      ...body,
      rideSessionId: rideId,
    });
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.ridesService.recordLocationUpdate(userId, parseResult.data);
  }

  @Patch(':id/passenger-status')
  async updatePassengerStatus(
    @CurrentUser('id') userId: string,
    @Param('id') rideId: string,
    @Body() body: any,
  ) {
    const parseResult = updatePassengerStatusSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.ridesService.updatePassengerStatus(userId, rideId, parseResult.data);
  }

  @Post(':id/complete')
  async completeRide(
    @CurrentUser('id') userId: string,
    @Param('id') rideId: string,
  ) {
    return this.ridesService.completeRideSession(userId, rideId);
  }
}
