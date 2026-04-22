import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  note: z.string().max(500).optional(),
});

const transitions: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const body = updateStatusSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id,buyer_id,status')
      .eq('id', id)
      .maybeSingle();
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: sellerItem } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('order_id', id)
      .eq('seller_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!sellerItem) {
      return NextResponse.json({ error: 'Only seller can update order status' }, { status: 403 });
    }

    const currentStatus = String(order.status);
    if (currentStatus === body.status) {
      return NextResponse.json(order);
    }

    if (!transitions[currentStatus]?.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentStatus} to ${body.status}` },
        { status: 422 }
      );
    }

    const updated = await supabaseAdmin
      .from('orders')
      .update({ status: body.status })
      .eq('id', id)
      .select('*')
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json(
        { error: updated.error?.message || 'Failed to update order status' },
        { status: 500 }
      );
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: id,
      from_status: currentStatus,
      to_status: body.status,
      changed_by: user.id,
      note: body.note || null,
    });

    await supabaseAdmin.from('notifications').insert({
      user_id: order.buyer_id as string,
      title: 'Order status updated',
      body: `Your order #${id.slice(0, 8)} is now ${body.status}.`,
      type: body.status === 'delivered' ? 'success' : 'info',
    });

    return NextResponse.json(updated.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to update order status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
