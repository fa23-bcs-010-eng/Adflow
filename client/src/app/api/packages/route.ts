import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
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
