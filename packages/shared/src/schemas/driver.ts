import { z } from 'zod';
import { VehicleType } from '../constants/enums';
import { isValidSriLankanNIC, isValidSriLankanPhone, isValidSriLankanPlate } from '../utils/validation';

export const updateDriverProfileSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().refine(isValidSriLankanPhone, {
    message: 'Please provide a valid Sri Lankan phone number',
  }),
  nicNumber: z.string().refine(isValidSriLankanNIC, {
    message: 'Please provide a valid Sri Lankan NIC (e.g. 851234567V or 198512345678)',
  }),
  licenseNumber: z.string().trim().min(5, 'Valid Driving License Number required'),
  experienceYears: z.number().int().min(1, 'Minimum 1 year driving experience required').max(50),
  bio: z.string().trim().min(20, 'Please write at least a brief 20-character description of your service').max(1000),
  district: z.string().min(2, 'District is required'),
  city: z.string().min(2, 'City/Operating Town is required'),
});

export type UpdateDriverProfileInput = z.infer<typeof updateDriverProfileSchema>;

export const createVehicleSchema = z.object({
  vehicleType: z.nativeEnum(VehicleType),
  make: z.string().trim().min(2, 'Make is required (e.g., Toyota, Nissan)'),
  model: z.string().trim().min(2, 'Model is required (e.g., HiAce, Caravan)'),
  year: z.number().int().min(2000, 'Vehicle must be year 2000 or newer').max(new Date().getFullYear() + 1),
  licensePlate: z.string().refine(isValidSriLankanPlate, {
    message: 'Please provide a valid Sri Lankan registration plate (e.g., WP NA-4521)',
  }),
  capacity: z.number().int().min(3, 'Minimum passenger capacity is 3').max(45),
  isAirConditioned: z.boolean().default(false),
  hasEmergencyExit: z.boolean().default(true),
  hasFireExtinguisher: z.boolean().default(true),
  hasFirstAidKit: z.boolean().default(true),
  insuranceExpiry: z.string().min(8, 'Insurance expiry date is required'),
  revenueLicenseExpiry: z.string().min(8, 'Revenue license expiry date is required'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateCoverageSchema = z.object({
  schoolIds: z.array(z.string()).min(1, 'Please select at least one school you provide transport for'),
  serviceDistricts: z.array(z.string()).min(1, 'Please select at least one district'),
  operatingAreas: z.array(z.string()).min(1, 'Please specify neighborhoods or cities covered (e.g., Nugegoda, Maharagama)'),
  monthlyRatePerChild: z.number().int().min(100000, 'Minimum monthly fee must be Rs. 1,000 (100,000 minor units)'),
});

export type UpdateCoverageInput = z.infer<typeof updateCoverageSchema>;

export const driverSearchFilterSchema = z.object({
  district: z.string().optional(),
  schoolId: z.string().optional(),
  city: z.string().optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type DriverSearchFilterInput = z.infer<typeof driverSearchFilterSchema>;
