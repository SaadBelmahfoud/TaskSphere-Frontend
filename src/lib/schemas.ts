import { z } from 'zod';

// ===== Schéma de validation pour la connexion =====
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est obligatoire")
    .email("Format d'email invalide"),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

// ===== Schéma de validation pour l'inscription =====
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
      .max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères"),
    firstName: z
      .string()
      .min(1, 'Le prénom est obligatoire'),
    lastName: z
      .string()
      .min(1, 'Le nom est obligatoire'),
    email: z
      .string()
      .min(1, "L'email est obligatoire")
      .email("Format d'email invalide"),
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une lettre et un chiffre'
      ),
    confirmPassword: z
      .string()
      .min(1, 'La confirmation du mot de passe est obligatoire'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// ===== Schéma de validation pour la création de tâche =====
export const taskCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
  description: z
    .string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
});

// ===== Schéma de validation pour la mise à jour de tâche =====
export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
});

// ===== Types inférés depuis les schémas =====
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
