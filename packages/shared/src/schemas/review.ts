import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().trim().min(5, 'Review must be at least 5 characters').max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
