import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('weight');

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to load packages' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
