import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createReviewSchema = z.object({
  order_id: z.string().uuid(),
  ad_id: z.string().uuid().optional(),
  seller_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(1000).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const adId = request.nextUrl.searchParams.get('ad_id');
    const sellerId = request.nextUrl.searchParams.get('seller_id');

    let query = supabaseAdmin
      .from('seller_reviews')
      .select('id,order_id,ad_id,reviewer_id,seller_id,rating,title,body,status,created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50);

    if (adId) query = query.eq('ad_id', adId);
    if (sellerId) query = query.eq('seller_id', sellerId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load reviews' }, { status: 500 });
    }

    const reviewerIds = Array.from(new Set((data ?? []).map((r) => r.reviewer_id).filter(Boolean)));
    const { data: reviewers } = reviewerIds.length
      ? await supabaseAdmin.from('users').select('id,full_name').in('id', reviewerIds)
      : { data: [] as any[] };
    const reviewerMap = new Map((reviewers ?? []).map((u) => [u.id, u]));

    const ratings = (data ?? []).map((r) => Number(r.rating || 0));
    const average_rating = ratings.length
      ? Number((ratings.reduce((sum, item) => sum + item, 0) / ratings.length).toFixed(1))
      : 0;

    return NextResponse.json({
      average_rating,
      total_reviews: ratings.length,
      reviews: (data ?? []).map((review) => ({
        ...review,
        reviewer: reviewerMap.get(review.reviewer_id) || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const body = createReviewSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id,buyer_id,status')
      .eq('id', body.order_id)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (String(order.status) !== 'delivered') {
      return NextResponse.json({ error: 'Reviews are allowed after delivery only' }, { status: 422 });
    }

    const { data: existingReview } = await supabaseAdmin
      .from('seller_reviews')
      .select('id')
      .eq('order_id', body.order_id)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    if (existingReview?.id) {
      return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 409 });
    }

    const created = await supabaseAdmin
      .from('seller_reviews')
      .insert({
        order_id: body.order_id,
        ad_id: body.ad_id || null,
        reviewer_id: user.id,
        seller_id: body.seller_id,
        rating: body.rating,
        title: body.title || null,
        body: body.body || null,
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message || 'Failed to create review' }, { status: 500 });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: body.seller_id,
      title: 'New seller review received',
      body: `A buyer rated your service ${body.rating}/5.`,
      type: 'success',
      ad_id: body.ad_id || null,
    });

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to create review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
