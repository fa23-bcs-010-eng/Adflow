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
    await supabaseAdmin.from('ad_analytics_events').insert({
      ad_id: ad.id as string,
      user_id: null,
      seller_id: ad.user_id as string,
      event_type: 'view',
      meta: { source: 'ad-detail' },
    });

    await supabaseAdmin
      .from('ads')
      .update({ view_count: Number(ad.view_count || 0) + 1 })
      .eq('id', ad.id);

    const { data: owner } = await supabaseAdmin
      .from('users')
      .select('full_name,email,created_at')
      .eq('id', ad.user_id)
      .maybeSingle();
    const { data: sellerProfile } = await supabaseAdmin
      .from('seller_profiles')
      .select('business_name,phone,whatsapp,is_verified')
      .eq('user_id', ad.user_id)
      .maybeSingle();
    const { count: publishedAdsCount } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ad.user_id)
      .eq('status', 'published');

    return NextResponse.json({
      ...ad,
      view_count: Number(ad.view_count || 0) + 1,
      seller: owner
        ? {
            full_name: owner.full_name,
            email: owner.email,
            member_since: owner.created_at,
            business_name: sellerProfile?.business_name || null,
            phone: sellerProfile?.phone || null,
            whatsapp: sellerProfile?.whatsapp || null,
            is_verified: Boolean(sellerProfile?.is_verified),
            published_ads_count: publishedAdsCount || 0,
          }
        : null,
      contact_email: ad.contact_email || owner?.email || null,
      contact_phone: ad.contact_phone || sellerProfile?.phone || null,
      contact_whatsapp: ad.contact_whatsapp || sellerProfile?.whatsapp || null,
    });
  }

  const demo = DEMO_ADS.find((item) => item.slug === slug);
  if (demo) {
    return NextResponse.json(demo);
  }

  return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
}
