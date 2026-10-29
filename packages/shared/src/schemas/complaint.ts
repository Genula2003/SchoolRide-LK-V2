import { z } from 'zod';
import { ComplaintCategory, ComplaintStatus } from '../constants/enums';

export const createComplaintSchema = z.object({
  bookingId: z.string().optional(),
  targetUserId: z.string().optional(),
  category: z.nativeEnum(ComplaintCategory),
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().trim().min(20, 'Please describe the incident in detail (min 20 characters)').max(2000),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const resolveComplaintSchema = z.object({
  status: z.nativeEnum(ComplaintStatus),
  adminNotes: z.string().trim().min(5, 'Administrative notes are required').max(1000),
});

export type ResolveComplaintInput = z.infer<typeof resolveComplaintSchema>;
