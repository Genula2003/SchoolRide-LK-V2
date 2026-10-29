import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewInput, BookingStatus } from '@schoolride/shared';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, input: CreateReviewInput) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId },
    });
    if (!parent) {
      throw new ForbiddenException('Only registered parents can submit reviews.');
    }

    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: input.bookingId },
      include: { driverProfile: true, review: true },
    });

    if (!booking || booking.parentId !== parent.id) {
      throw new ForbiddenException('Booking not found or not associated with your account.');
    }

    // Eligibility check: Booking must have reached COMPLETED status
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be submitted after the transportation service is completed.');
    }

    // Anti-duplicate check
    if (booking.review) {
      throw new BadRequestException('A review has already been submitted for this booking.');
    }

    // Create review and update driver rating transactionally
    const result = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId: booking.id,
          parentId: parent.id,
          driverProfileId: booking.driverProfileId,
          rating: input.rating,
          comment: input.comment,
          isPublic: true,
        },
      });

      // Recalculate driver rating
      const driverReviews = await tx.review.findMany({
        where: { driverProfileId: booking.driverProfileId },
        select: { rating: true },
      });

      const totalRating = driverReviews.reduce((sum, r) => sum + r.rating, 0);
      const count = driverReviews.length;
      const average = Math.round((totalRating / count) * 10) / 10;

      await tx.driverProfile.update({
        where: { id: booking.driverProfileId },
        data: {
          ratingAverage: average,
          ratingCount: count,
        },
      });

      return review;
    });

    return result;
  }

  async getDriverReviews(driverProfileId: string) {
    return this.prisma.review.findMany({
      where: {
        driverProfileId,
        isPublic: true,
      },
      include: {
        parent: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
