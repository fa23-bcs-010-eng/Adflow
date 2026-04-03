import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  const found = await supabaseAdmin
    .from('ads')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (found.error || !found.data) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }

  const updated = await supabaseAdmin
    .from('ads')
    .update({ status: 'submitted' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updated.error || !updated.data) {
    return NextResponse.json({ error: updated.error?.message || 'Failed to submit ad' }, { status: 500 });
  }

  return NextResponse.json(updated.data);
}
