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
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  createBookingRequestSchema,
  updateBookingStatusSchema,
} from '@schoolride/shared';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = createBookingRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.bookingsService.createBooking(userId, parseResult.data);
  }

  @Get()
  async listMyBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingsService.listMyBookings(user);
  }

  @Get(':id')
  async getBookingDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.getBookingDetails(user, bookingId);
  }

  @Patch(':id/status')
  async updateBookingStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') bookingId: string,
    @Body() body: any,
  ) {
    const parseResult = updateBookingStatusSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.bookingsService.updateBookingStatus(user, bookingId, parseResult.data);
  }
}
