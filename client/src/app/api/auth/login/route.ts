import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueToken } from '@/lib/server/auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = loginSchema.parse(await request.json());

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, password_hash, is_active')
      .eq('email', body.email)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.is_active === false) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    return NextResponse.json({
      user: safeUser,
      token: issueToken(safeUser),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
