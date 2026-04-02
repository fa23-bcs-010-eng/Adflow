import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueToken } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabase';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'moderator', 'admin', 'super_admin']).optional().default('client'),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message || 'Failed to validate email' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(body.password, 12);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        full_name: body.full_name,
        email: body.email,
        password_hash,
        role: body.role,
      })
      .select('id, email, full_name, role')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: error?.message || 'Failed to create user' }, { status: 500 });
    }

    if (body.role === 'client') {
      await supabaseAdmin.from('seller_profiles').insert({ user_id: user.id });
    }

    return NextResponse.json(
      {
        user,
        token: issueToken(user),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
