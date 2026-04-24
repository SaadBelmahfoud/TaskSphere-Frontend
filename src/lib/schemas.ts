import { z } from 'zod';

// ===== Login validation schema =====
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

// ===== Registration validation schema =====
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters'),
    firstName: z
      .string()
      .min(1, 'First name is required'),
    lastName: z
      .string()
      .min(1, 'Last name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        'Password must contain at least one letter and one number'
      ),
    confirmPassword: z
      .string()
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ===== Task creation validation schema =====
export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters'),
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
});

// ===== Task update validation schema =====
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
});

// ===== Inferred types from schemas =====
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
