import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createPromotionSchema = z.object({
  ad_id: z.string().uuid(),
  promotion_type: z.enum(['boost', 'urgent', 'top_search']),
});

const promotionConfig = {
  boost: { rankBoost: 60, amount: 25 },
  urgent: { rankBoost: 35, amount: 15 },
  top_search: { rankBoost: 90, amount: 40 },
} as const;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('ad_promotions')
      .select('*, ad:ads(id,title,slug,status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load promotions' }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load promotions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (user.role === 'client' && user.account_type === 'buyer') {
    return NextResponse.json({ error: 'Only seller accounts can promote ads' }, { status: 403 });
  }

  try {
    const body = createPromotionSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: ad, error: adErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,user_id,rank_score,is_featured')
      .eq('id', body.ad_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (adErr || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('ad_promotions')
      .select('id')
      .eq('ad_id', body.ad_id)
      .eq('promotion_type', body.promotion_type)
      .eq('status', 'active')
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ error: 'Promotion already active for this ad' }, { status: 409 });
    }

    const config = promotionConfig[body.promotion_type];
    const endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const created = await supabaseAdmin
      .from('ad_promotions')
      .insert({
        ad_id: body.ad_id,
        user_id: user.id,
        promotion_type: body.promotion_type,
        boost_amount: config.amount,
        ends_at: endsAt,
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message || 'Failed to create promotion' }, { status: 500 });
    }

    await supabaseAdmin
      .from('ads')
      .update({
        rank_score: Number(ad.rank_score || 0) + config.rankBoost,
        is_featured: body.promotion_type === 'top_search' ? true : ad.is_featured,
      })
      .eq('id', body.ad_id);

    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      title: 'Promotion activated',
      body: `${body.promotion_type.replace('_', ' ')} is now active for "${ad.title}".`,
      type: 'success',
      ad_id: body.ad_id,
    });

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create promotion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
