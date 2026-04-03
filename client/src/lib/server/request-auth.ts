import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/server/auth';

export function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

export function getAuthenticatedUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
