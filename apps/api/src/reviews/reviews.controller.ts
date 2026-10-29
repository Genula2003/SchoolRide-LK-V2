import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { createReviewSchema } from '@schoolride/shared';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    const parseResult = createReviewSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0].message);
    }
    return this.reviewsService.createReview(userId, parseResult.data);
  }

  @Get('driver/:driverId')
  async getDriverReviews(@Param('driverId') driverId: string) {
    return this.reviewsService.getDriverReviews(driverId);
  }
}
