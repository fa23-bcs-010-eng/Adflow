import jwt from 'jsonwebtoken';

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export function issueToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
