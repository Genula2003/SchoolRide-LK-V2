import { z } from 'zod';
import { UserRole } from '../constants/enums';
import { isValidSriLankanPhone } from '../utils/validation';

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerParentSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().refine(isValidSriLankanPhone, {
    message: 'Please provide a valid Sri Lankan phone number (e.g., 0771234567 or +94771234567)',
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmPassword: z.string(),
  district: z.string().min(2, 'Please select your home district'),
  city: z.string().min(2, 'Please enter your city/town'),
  role: z.literal(UserRole.PARENT).default(UserRole.PARENT),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterParentInput = z.infer<typeof registerParentSchema>;

export const registerDriverSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().refine(isValidSriLankanPhone, {
    message: 'Please provide a valid Sri Lankan phone number (e.g., 0771234567 or +94771234567)',
  }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmPassword: z.string(),
  district: z.string().min(2, 'Please select your operating district'),
  role: z.literal(UserRole.DRIVER).default(UserRole.DRIVER),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid or expired reset token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
