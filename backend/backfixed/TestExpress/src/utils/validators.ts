import { z } from 'zod';

export const registerSchema = z
  .object({
    login: z.string().min(4).max(50),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/\d/, 'Password must contain digit'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const accountSchema = z.object({
  name: z.string().min(1),
  balance: z.number().default(0),
  currency: z.string().default('RUB'),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
});

export const transactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().optional().nullable(),
  transactionDate: z.string(),
});

export const familySchema = z.object({
  name: z.string().min(2),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'adult', 'child']).default('adult'),
});

export const loanSchema = z.object({
  name: z.string().min(1),
  principal: z.number().positive(),
  annualRate: z.number().nonnegative(),
  termMonths: z.number().int().positive(),
  startDate: z.string(),
});