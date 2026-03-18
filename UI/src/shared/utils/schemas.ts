import { z } from 'zod';

/* ─── EVENT SCHEMA ─── */
export const eventSchema = z.object({
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens only'),
  title: z.string()
    .min(3, 'Title is required (min 3 chars)')
    .max(120, 'Title too long'),
  tag: z.string().min(1, 'Tag is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  venue: z.string().min(3, 'Venue is required'),
  desc: z.string().max(2000, 'Description too long').optional().default(''),
  bgImg: z.string()
    .refine(val => val === '' || val.startsWith('/') || val.startsWith('http') || val.startsWith('blob:'),
      'Must be a URL, path starting with /, or uploaded file')
    .optional().default(''),
  categories: z.any().optional(),
  deliverables: z.string().nullable().optional().default(''),
  registrationOpen: z.boolean().optional().default(true),
  registrationStart: z.any().optional(),
  registrationEnd: z.any().optional(),
  rules: z.string().max(2000, 'Rules too long').optional().default(''),
  prizes_desc: z.string().max(2000, 'Prize details too long').optional().default(''),
  contact_email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
  contact_phone: z.string().max(20, 'Phone too long').optional().default(''),
  isDraft: z.boolean().optional().default(false),
  latLng: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
export type EventFormData = z.infer<typeof eventSchema>;

/* ─── COUPON SCHEMA ─── */
export const couponSchema = z.object({
  code: z.string()
    .min(3, 'Code min 3 characters')
    .max(20, 'Code too long')
    .regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only'),
  discountPercent: z.number()
    .min(1, 'Minimum 1%')
    .max(100, 'Maximum 100%'),
  maxUses: z.number()
    .min(-1, 'Use -1 for unlimited')
    .max(1000000, 'Too many uses'),
  expiryDate: z.string()
    .min(1, 'Expiry date required'),
  active: z.boolean().optional().default(true),
  eventId: z.string().default('ALL'),
});
export type CouponFormData = z.infer<typeof couponSchema>;

/* ─── CONTENT SCHEMA ─── */
export const contentSchema = z.object({
  type: z.enum(['image', 'logo', 'sponsor', 'content'], {
    errorMap: () => ({ message: 'Select a valid type' }),
  }),
  title: z.string().min(2, 'Title required (min 2 chars)').max(80, 'Title too long'),
  imageUrl: z.string().max(500, 'URL too long').optional().default(''),
  description: z.string().max(500, 'Description too long').optional().default(''),
  order: z.number().min(0).max(999).optional().default(1),
  active: z.boolean().optional().default(true),
});
export type ContentFormData = z.infer<typeof contentSchema>;

/* ─── LEADERBOARD SCHEMA ─── */
const podiumTimeSchema = z.string()
  .optional()
  .nullable()
  .or(z.literal(''))
  .refine(val => !val || /^\d{1,2}:\d{2}:\d{2}$/.test(val), 'Format: HH:MM:SS');

export const leaderboardEntrySchema = z.object({
  first_name: z.string().min(1, 'Winner name required'),
  first_time: podiumTimeSchema,
  second_name: z.string().min(1, 'Runner-up name required'),
  second_time: podiumTimeSchema,
  third_name: z.string().min(1, 'Third place name required'),
  third_time: podiumTimeSchema,
});
export type LeaderboardFormData = z.infer<typeof leaderboardEntrySchema>;

/* ─── LOGIN SCHEMA ─── */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

/* ─── Helper: convert Zod error to AntD field errors ─── */
export function zodToFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  error.errors.forEach((err) => {
    const key = err.path.join('.');
    if (key && !result[key]) result[key] = err.message;
  });
  return result;
}
