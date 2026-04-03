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

type TokenPayload = {
  id: string;
  email: string;
  role: string;
};

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  const decoded = jwt.verify(token, secret);
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token');
  }

  const payload = decoded as Partial<TokenPayload>;
  if (!payload.id || !payload.email || !payload.role) {
    throw new Error('Invalid token payload');
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };
}
