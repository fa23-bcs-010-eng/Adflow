import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { riskBand } from '@/lib/server/marketplace-intelligence';

const actionSchema = z.object({
  action: z.enum(['view', 'release', 'dispute']),
  note: z.string().max(500).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .eq('order_id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    return NextResponse.json({ ...data, risk_band: riskBand(Number(data.risk_score || 0)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load escrow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  try {
    const body = actionSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id,buyer_id,status')
      .eq('id', id)
      .maybeSingle();
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: escrow, error: escrowErr } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .eq('order_id', id)
      .maybeSingle();
    if (escrowErr || !escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (body.action === 'release') {
      if (order.buyer_id !== user.id && !['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Only buyer or admin can release escrow' }, { status: 403 });
      }
      if (String(order.status) !== 'delivered') {
        return NextResponse.json({ error: 'Escrow can be released after delivery only' }, { status: 422 });
      }

      const updated = await supabaseAdmin
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: user.id,
          notes: body.note || escrow.notes || null,
        })
        .eq('order_id', id)
        .select('*')
        .single();

      if (updated.error || !updated.data) {
        return NextResponse.json({ error: updated.error?.message || 'Failed to release escrow' }, { status: 500 });
      }

      return NextResponse.json(updated.data);
    }

    if (body.action === 'dispute') {
      const updated = await supabaseAdmin
        .from('escrow_transactions')
        .update({
          status: 'disputed',
          notes: body.note || escrow.notes || null,
        })
        .eq('order_id', id)
        .select('*')
        .single();
      if (updated.error || !updated.data) {
        return NextResponse.json({ error: updated.error?.message || 'Failed to mark escrow disputed' }, { status: 500 });
      }
      return NextResponse.json(updated.data);
    }

    return NextResponse.json(escrow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update escrow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
