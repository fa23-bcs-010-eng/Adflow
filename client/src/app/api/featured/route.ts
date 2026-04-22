import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { DEMO_ADS } from '@/lib/demo-ads';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
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

  if (data && data.length > 0) {
    return NextResponse.json(data);
  }

  return NextResponse.json(DEMO_ADS.filter((ad) => ad.is_featured).slice(0, 8));
}
