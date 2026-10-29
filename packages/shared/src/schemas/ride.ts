import { z } from 'zod';
import { PassengerPickupStatus } from '../constants/enums';

export const startRideSessionSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  routeName: z.string().trim().min(3, 'Route name is required (e.g., Morning Colombo 7 Route)'),
  bookingIds: z.array(z.string()).min(1, 'At least one active booking is required for this ride'),
  initialLatitude: z.number().min(5.0).max(10.0),
  initialLongitude: z.number().min(79.0).max(82.0),
});

export type StartRideSessionInput = z.infer<typeof startRideSessionSchema>;

export const broadcastLocationSchema = z.object({
  rideSessionId: z.string().min(1),
  latitude: z.number().min(5.0).max(10.0),
  longitude: z.number().min(79.0).max(82.0),
  speed: z.number().min(0).max(160).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().optional(),
});

export type BroadcastLocationInput = z.infer<typeof broadcastLocationSchema>;

export const updatePassengerStatusSchema = z.object({
  rideSessionPassengerId: z.string().min(1),
  pickupStatus: z.nativeEnum(PassengerPickupStatus),
  notes: z.string().max(200).optional(),
});

export type UpdatePassengerStatusInput = z.infer<typeof updatePassengerStatusSchema>;
