const { z } = require('zod');

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'moderator', 'admin', 'super_admin']).optional().default('client'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
});

const createAdSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category_id: z.string().uuid().optional(),
  city_id: z.string().uuid().optional(),
  package_id: z.string().uuid().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_whatsapp: z.string().optional(),
  media: z.array(z.object({
    media_url: z.string().url('Must be a valid URL'),
    media_type: z.enum(['image', 'video', 'youtube']).default('image'),
  })).max(10).optional(),
});

const reviewAdSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().optional(),
});

const submitPaymentSchema = z.object({
  ad_id: z.string().uuid(),
  package_id: z.string().uuid(),
  amount: z.number().positive(),
  proof_url: z.string().url('Payment proof must be a valid URL'),
  payment_method: z.string().optional(),
  reference_no: z.string().optional(),
  sender_name: z.string().min(2).optional(),
  sender_bank_name: z.string().min(2).optional(),
  sender_account_number: z.string().min(4).optional(),
  sender_iban: z.string().min(10).optional(),
});

const verifyPaymentSchema = z.object({
  action: z.enum(['verify', 'reject']),
  rejection_note: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createAdSchema,
  reviewAdSchema,
  submitPaymentSchema,
  verifyPaymentSchema,
};
