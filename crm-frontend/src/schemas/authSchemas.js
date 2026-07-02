import { z } from 'zod'

// Password validation regex patterns
const passwordPatterns = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
}

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

// Register schema
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Password strength calculator
export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  const checks = {
    length: password.length >= 8,
    uppercase: passwordPatterns.uppercase.test(password),
    lowercase: passwordPatterns.lowercase.test(password),
    number: passwordPatterns.number.test(password),
    special: passwordPatterns.special.test(password),
  }

  // Calculate score
  if (checks.length) score += 20
  if (checks.uppercase) score += 20
  if (checks.lowercase) score += 20
  if (checks.number) score += 20
  if (checks.special) score += 20

  // Determine label and color
  let label = ''
  let color = ''

  if (score <= 40) {
    label = 'Weak'
    color = 'red'
  } else if (score <= 60) {
    label = 'Fair'
    color = 'orange'
  } else if (score <= 80) {
    label = 'Good'
    color = 'yellow'
  } else {
    label = 'Strong'
    color = 'green'
  }

  return { score, label, color, checks }
}
