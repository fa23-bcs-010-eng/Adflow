import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { DEMO_ADS } from '@/lib/demo-ads';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: ad, error } = await supabaseAdmin
    .from('ads')
    .select('*, media:ad_media(*), category:categories(name,slug), city:cities(name,slug), package:packages(name,featured_scope)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to load ad details' }, { status: 500 });
  }

  if (ad) {
    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('full_name,email,created_at')
      .eq('id', ad.user_id)
      .maybeSingle();

    return NextResponse.json({
      ...ad,
      seller: owner
        ? {
            full_name: owner.full_name,
            email: owner.email,
            member_since: owner.created_at,
          }
        : null,
      contact_email: ad.contact_email || owner?.email || null,
    });
  }

  const demo = DEMO_ADS.find((item) => item.slug === slug);
  if (demo) {
    return NextResponse.json(demo);
  }

  return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
}
