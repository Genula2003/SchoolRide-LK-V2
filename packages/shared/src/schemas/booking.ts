import { z } from 'zod';
import { BookingStatus } from '../constants/enums';

export const createBookingRequestSchema = z.object({
  driverProfileId: z.string().min(1, 'Please select a driver'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  childId: z.string().min(1, 'Please select a child'),
  pickupAddress: z.string().trim().min(5, 'Pickup address is required'),
  pickupLatitude: z.number().min(5.0).max(10.0),
  pickupLongitude: z.number().min(79.0).max(82.0),
  dropoffAddress: z.string().trim().min(5, 'Dropoff address is required'),
  dropoffLatitude: z.number().min(5.0).max(10.0),
  dropoffLongitude: z.number().min(79.0).max(82.0),
  pickupTimeMorning: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid morning pickup time required (HH:MM)'),
  dropoffTimeAfternoon: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid afternoon dropoff time required (HH:MM)'),
  startDate: z.string().min(8, 'Start date is required'),
  monthlyFeeMinorUnits: z.number().int().min(100000, 'Minimum monthly fee is 100000 minor units (Rs. 1,000)'),
  notes: z.string().max(500).optional(),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>;

export const updateBookingStatusSchema = z.object({
  targetStatus: z.nativeEnum(BookingStatus),
  reason: z.string().max(300).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
