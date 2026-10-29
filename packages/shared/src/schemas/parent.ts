import { z } from 'zod';
import { isValidSriLankanPhone } from '../utils/validation';

export const updateParentProfileSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().refine(isValidSriLankanPhone, {
    message: 'Please provide a valid Sri Lankan phone number',
  }),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  city: z.string().trim().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  emergencyContactName: z.string().trim().min(3, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().refine(isValidSriLankanPhone, {
    message: 'Please provide a valid Sri Lankan emergency contact number',
  }),
});

export type UpdateParentProfileInput = z.infer<typeof updateParentProfileSchema>;

export const createChildSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(8, 'Date of birth is required'),
  schoolId: z.string().min(1, 'Please select a school'),
  grade: z.string().min(1, 'Grade/Standard is required (e.g., Grade 6)'),
  pickupAddress: z.string().trim().min(5, 'Pickup address is required'),
  pickupLatitude: z.number().min(5.0).max(10.0, 'Valid Sri Lankan latitude required'),
  pickupLongitude: z.number().min(79.0).max(82.0, 'Valid Sri Lankan longitude required'),
  dropoffAddress: z.string().trim().min(5, 'Dropoff address is required'),
  dropoffLatitude: z.number().min(5.0).max(10.0, 'Valid Sri Lankan latitude required'),
  dropoffLongitude: z.number().min(79.0).max(82.0, 'Valid Sri Lankan longitude required'),
  specialNotes: z.string().max(500).optional(),
});

export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.partial();
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
