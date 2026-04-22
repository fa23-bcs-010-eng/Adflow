import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createOfferSchema = z.object({
  ad_id: z.string().min(1),
  offered_price: z.number().positive(),
  note: z.string().max(500).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const mode = request.nextUrl.searchParams.get('mode') || 'sent';
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const base = supabaseAdmin
      .from('offers')
      .select('id,ad_id,buyer_id,seller_id,offered_price,counter_price,status,note,seller_note,created_at,updated_at');

    const query = mode === 'received' ? base.eq('seller_id', user.id) : base.eq('buyer_id', user.id);
    const { data: offers, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load offers' }, { status: 500 });
    }

    const adIds = Array.from(new Set((offers ?? []).map((item) => item.ad_id).filter(Boolean)));
    const { data: ads } = adIds.length
      ? await supabaseAdmin.from('ads').select('id,title,slug,price').in('id', adIds)
      : { data: [] as any[] };
    const adMap = new Map((ads ?? []).map((ad) => [ad.id, ad]));

    const userIds = Array.from(
      new Set((offers ?? []).flatMap((item) => [item.buyer_id, item.seller_id]).filter(Boolean))
    );
    const { data: users } = userIds.length
      ? await supabaseAdmin.from('users').select('id,full_name,email').in('id', userIds)
      : { data: [] as any[] };
    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    return NextResponse.json(
      (offers ?? []).map((offer) => ({
        ...offer,
        ad: adMap.get(offer.ad_id) || null,
        buyer: userMap.get(offer.buyer_id) || null,
        seller: userMap.get(offer.seller_id) || null,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load offers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = createOfferSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: ad, error: adErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,user_id,status,price')
      .eq('id', body.ad_id)
      .eq('status', 'published')
      .maybeSingle();

    if (adErr || !ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    if ((ad.user_id as string) === user.id) {
      return NextResponse.json({ error: 'You cannot make offer on your own ad' }, { status: 422 });
    }

    const created = await supabaseAdmin
      .from('offers')
      .insert({
        ad_id: ad.id as string,
        buyer_id: user.id,
        seller_id: ad.user_id as string,
        offered_price: body.offered_price,
        note: body.note || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message || 'Failed to create offer' }, { status: 500 });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: ad.user_id as string,
      title: 'New offer received',
      body: `You received a new offer on "${ad.title}"`,
      type: 'info',
      ad_id: ad.id as string,
    });

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create offer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
