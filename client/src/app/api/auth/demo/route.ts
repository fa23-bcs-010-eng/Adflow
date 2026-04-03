import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueToken } from '@/lib/server/auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const demoSchema = z.object({
  role: z.enum(['client', 'moderator', 'admin', 'super_admin']),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { role } = demoSchema.parse(await request.json());
    const email = `${role}_demo@adflow.com`;

    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load demo user' }, { status: 500 });
    }

    if (!user) {
      const password_hash = await bcrypt.hash('demo123', 12);
      const created = await supabaseAdmin
        .from('users')
        .insert({ full_name: `Demo ${role.toUpperCase()}`, email, password_hash, role })
        .select('id, email, full_name, role')
        .single();

      if (created.error || !created.data) {
        return NextResponse.json({ error: created.error?.message || 'Failed to create demo user' }, { status: 500 });
      }

      user = created.data;
      if (role === 'client') {
        await supabaseAdmin.from('seller_profiles').insert({ user_id: user.id });
      }
    }

    return NextResponse.json({ user, token: issueToken(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Demo login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
