import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { DEMO_ADS } from '@/lib/demo-ads';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        ad_id: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        unit_price: z.number().nonnegative(),
      })
    )
    .min(1),
  note: z.string().max(300).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'admin', 'moderator', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const mode = request.nextUrl.searchParams.get('mode') || 'buying';

  try {
    if (mode === 'selling') {
      const { data: sellerItems, error } = await supabaseAdmin
        .from('order_items')
        .select(
          'id,quantity,unit_price,total_price,created_at,ad_title,ad_slug,order_id,seller_id,orders:orders(id,status,payment_status,buyer_id,created_at)'
        )
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to load selling orders' },
          { status: 500 }
        );
      }

      const buyerIds = Array.from(
        new Set(
          (sellerItems ?? [])
            .map((item) => (item as any)?.orders?.buyer_id)
            .filter(Boolean)
        )
      ) as string[];

      let buyerMap = new Map<string, { id: string; full_name: string | null; email: string | null }>();

      if (buyerIds.length > 0) {
        const { data: buyers } = await supabaseAdmin
          .from('users')
          .select('id,full_name,email')
          .in('id', buyerIds);

        buyerMap = new Map(
          (buyers ?? []).map((buyer) => [
            buyer.id as string,
            {
              id: buyer.id as string,
              full_name: (buyer.full_name as string) || null,
              email: (buyer.email as string) || null,
            },
          ])
        );
      }

      const enriched = (sellerItems ?? []).map((item: any) => ({
        ...item,
        buyer: item?.orders?.buyer_id ? buyerMap.get(item.orders.buyer_id) ?? null : null,
      }));

      return NextResponse.json(enriched);
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load buying orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load orders';
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
    const body = createOrderSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const adIds = body.items.map((item) => item.ad_id);
    const { data: dbAds, error: dbAdsErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,slug,price,user_id,status')
      .in('id', adIds);

    if (dbAdsErr) {
      return NextResponse.json({ error: dbAdsErr.message || 'Failed to load ads' }, { status: 500 });
    }

    const dbAdsMap = new Map((dbAds ?? []).map((ad) => [ad.id, ad]));
    const demoAdsMap = new Map(DEMO_ADS.map((ad) => [ad.id, ad]));

    const normalizedItems = body.items.map((item) => {
      const dbAd = dbAdsMap.get(item.ad_id);
      if (dbAd) {
        return {
          ad_id: dbAd.id as string,
          ad_title: dbAd.title as string,
          ad_slug: dbAd.slug as string,
          seller_id: (dbAd.user_id as string) || null,
          quantity: item.quantity,
          unit_price: Number(item.unit_price || dbAd.price || 0),
        };
      }

      const demoAd = demoAdsMap.get(item.ad_id);
      if (demoAd) {
        return {
          ad_id: null,
          ad_title: demoAd.title,
          ad_slug: demoAd.slug,
          seller_id: null,
          quantity: item.quantity,
          unit_price: Number(item.unit_price || demoAd.price || 0),
        };
      }

      throw new Error(`Ad not found: ${item.ad_id}`);
    });

    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const createdOrder = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        status: 'placed',
        payment_status: 'pending',
        note: body.note || null,
      })
      .select('*')
      .single();

    if (createdOrder.error || !createdOrder.data) {
      return NextResponse.json(
        {
          error:
            createdOrder.error?.message ||
            'Failed to create order. Ensure orders tables exist in Supabase schema.',
        },
        { status: 500 }
      );
    }

    const orderId = createdOrder.data.id as string;
    const orderItemsPayload = normalizedItems.map((item) => ({
      order_id: orderId,
      ad_id: item.ad_id,
      ad_title: item.ad_title,
      ad_slug: item.ad_slug,
      seller_id: item.seller_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const insertedItems = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsPayload)
      .select('*');

    if (insertedItems.error) {
      return NextResponse.json(
        { error: insertedItems.error.message || 'Failed to save order items' },
        { status: 500 }
      );
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      from_status: null,
      to_status: 'placed',
      changed_by: user.id,
      note: 'Order created by buyer',
    });

    const sellerIds = Array.from(
      new Set(orderItemsPayload.map((item) => item.seller_id).filter(Boolean))
    ) as string[];

    if (sellerIds.length > 0) {
      await supabaseAdmin.from('notifications').insert(
        sellerIds.map((sellerId) => ({
          user_id: sellerId,
          title: 'New order received',
          body: `A buyer placed order #${orderId.slice(0, 8)} for your ad listing.`,
          type: 'info',
        }))
      );
    }

    const purchaseEvents = orderItemsPayload
      .filter((item) => item.ad_id && item.seller_id)
      .map((item) => ({
        ad_id: item.ad_id,
        user_id: user.id,
        seller_id: item.seller_id,
        event_type: 'purchase',
        meta: {
          order_id: orderId,
          quantity: item.quantity,
          total_price: item.total_price,
        },
      }));

    if (purchaseEvents.length > 0) {
      await supabaseAdmin.from('ad_analytics_events').insert(purchaseEvents);
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      title: 'Order placed successfully',
      body: `Your order #${orderId.slice(0, 8)} has been placed.`,
      type: 'success',
    });

    return NextResponse.json(
      {
        order: createdOrder.data,
        items: insertedItems.data ?? [],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 422 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
