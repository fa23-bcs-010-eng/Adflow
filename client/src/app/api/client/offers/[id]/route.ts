import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const offerActionSchema = z.object({
  action: z.enum(['accept', 'reject', 'counter', 'withdraw']),
  counter_price: z.number().positive().optional(),
  seller_note: z.string().max(500).optional(),
});

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  try {
    const body = offerActionSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: offer, error: offerErr } = await supabaseAdmin
      .from('offers')
      .select('id,ad_id,buyer_id,seller_id,status,offered_price')
      .eq('id', id)
      .maybeSingle();

    if (offerErr || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    if (body.action === 'withdraw') {
      if (offer.buyer_id !== user.id) {
        return NextResponse.json({ error: 'Only buyer can withdraw offer' }, { status: 403 });
      }
      const withdrawn = await supabaseAdmin
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', id)
        .select('*')
        .single();
      if (withdrawn.error || !withdrawn.data) {
        return NextResponse.json({ error: withdrawn.error?.message || 'Failed to withdraw offer' }, { status: 500 });
      }
      return NextResponse.json(withdrawn.data);
    }

    if (offer.seller_id !== user.id) {
      return NextResponse.json({ error: 'Only seller can update this offer' }, { status: 403 });
    }

    let patch: Record<string, any> = {};
    if (body.action === 'accept') {
      patch = { status: 'accepted', seller_note: body.seller_note || null };
    } else if (body.action === 'reject') {
      patch = { status: 'rejected', seller_note: body.seller_note || null };
    } else {
      if (!body.counter_price) {
        return NextResponse.json({ error: 'counter_price is required for counter action' }, { status: 422 });
      }
      patch = {
        status: 'countered',
        counter_price: body.counter_price,
        seller_note: body.seller_note || null,
      };
    }

    const updated = await supabaseAdmin
      .from('offers')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json({ error: updated.error?.message || 'Failed to update offer' }, { status: 500 });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: offer.buyer_id as string,
      title: 'Your offer was updated',
      body:
        body.action === 'counter'
          ? 'Seller sent a counter offer.'
          : body.action === 'accept'
          ? 'Seller accepted your offer.'
          : 'Seller rejected your offer.',
      type: body.action === 'accept' ? 'success' : body.action === 'counter' ? 'info' : 'warning',
      ad_id: offer.ad_id as string,
    });

    return NextResponse.json(updated.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update offer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
