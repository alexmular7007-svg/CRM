import { z } from 'zod'

export const createLeadMagnetSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name must be less than 255 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable()
    .default(''),
  active: z.boolean().optional().default(true),
})

export const updateLeadMagnetSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Campaign name must be less than 255 characters')
    .optional(),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  active: z.boolean().optional(),
})

export const toggleStatusSchema = z.object({
  active: z.boolean(),
})

export const publicFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  email: z.string()
    .email('Invalid email address'),
  phone: z.string()
    .optional()
    .nullable(),
  company: z.string()
    .max(255, 'Company must be less than 255 characters')
    .optional()
    .nullable(),
})
