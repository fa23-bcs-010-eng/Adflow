import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ads')
    .select('*, media:ad_media(*), category:categories(name,slug), city:cities(name,slug), package:packages(name,featured_scope)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .gt('expires_at', new Date().toISOString())
    .order('rank_score', { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to load featured ads' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
