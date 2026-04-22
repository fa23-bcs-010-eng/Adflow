import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { estimateShipping } from '@/lib/server/marketplace-intelligence';

const createShipmentSchema = z.object({
  action: z.enum(['quote', 'create', 'advance']),
  destination_city: z.string().optional(),
  next_status: z.enum(['packed', 'in_transit', 'delivered', 'exception']).optional(),
});

function makeTrackingNumber(orderId: string) {
  return `ADL-${orderId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-5)}`;
}

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
    const { data: shipment } = await supabaseAdmin
      .from('logistics_shipments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(shipment || null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load shipment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id } = await context.params;
  try {
    const body = createShipmentSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id,buyer_id,status,items:order_items(ad_id,ad_title,seller_id,total_price)')
      .eq('id', id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const firstItem = order.items?.[0];
    if (!firstItem) {
      return NextResponse.json({ error: 'Order has no shippable items' }, { status: 422 });
    }

    const { data: ad } = firstItem.ad_id
      ? await supabaseAdmin.from('ads').select('id,city:cities(name),category:categories(slug),price,user_id').eq('id', firstItem.ad_id).maybeSingle()
      : { data: null as any };

    const quote = estimateShipping({
      price: Number(ad?.price || firstItem.total_price || 0),
      fromCity: ad?.city?.name || 'Origin',
      toCity: body.destination_city || 'Destination',
      category: ad?.category?.slug || null,
    });

    if (body.action === 'quote') {
      return NextResponse.json(quote);
    }

    const existing = await supabaseAdmin
      .from('logistics_shipments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (body.action === 'create') {
      if (String(firstItem.seller_id) !== user.id && !['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json({ error: 'Only seller or admin can create shipment' }, { status: 403 });
      }

      if (existing.data?.id) {
        return NextResponse.json(existing.data);
      }

      const created = await supabaseAdmin
        .from('logistics_shipments')
        .insert({
          order_id: id,
          ad_id: firstItem.ad_id,
          seller_id: firstItem.seller_id,
          buyer_id: order.buyer_id,
          provider: quote.provider,
          status: 'created',
          tracking_number: makeTrackingNumber(id),
          origin_city: ad?.city?.name || null,
          destination_city: body.destination_city || null,
          estimated_cost: quote.estimated_cost,
          estimated_delivery_days: quote.estimated_delivery_days,
          last_event: 'Shipment created',
        })
        .select('*')
        .single();

      if (created.error || !created.data) {
        return NextResponse.json({ error: created.error?.message || 'Failed to create shipment' }, { status: 500 });
      }
      return NextResponse.json(created.data, { status: 201 });
    }

    if (!existing.data?.id) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const updated = await supabaseAdmin
      .from('logistics_shipments')
      .update({
        status: body.next_status || existing.data.status,
        last_event: body.next_status ? `Shipment ${body.next_status}` : existing.data.last_event,
      })
      .eq('id', existing.data.id)
      .select('*')
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json({ error: updated.error?.message || 'Failed to update shipment' }, { status: 500 });
    }

    return NextResponse.json(updated.data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to process logistics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
