import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const sellerId = user.id;

    const { data: ads, error: adsErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,status,view_count,rank_score,is_featured,published_at,created_at')
      .eq('user_id', sellerId)
      .order('created_at', { ascending: false });

    if (adsErr) {
      return NextResponse.json({ error: adsErr.message || 'Failed to load ads analytics' }, { status: 500 });
    }

    const adIds = (ads ?? []).map((ad) => ad.id);
    const { data: events } = adIds.length
      ? await supabaseAdmin
          .from('ad_analytics_events')
          .select('ad_id,event_type,created_at')
          .eq('seller_id', sellerId)
          .in('ad_id', adIds)
      : { data: [] as any[] };

    const { data: orders } = adIds.length
      ? await supabaseAdmin
          .from('order_items')
          .select('ad_id,total_price,quantity,created_at,orders:orders(status)')
          .eq('seller_id', sellerId)
          .in('ad_id', adIds)
      : { data: [] as any[] };

    const eventCounts = {
      views: 0,
      chats: 0,
      cart_adds: 0,
      purchases: 0,
    };

    const eventMap = new Map<string, { chats: number; cart_adds: number; purchases: number }>();
    (events ?? []).forEach((event: any) => {
      const item = eventMap.get(event.ad_id) || { chats: 0, cart_adds: 0, purchases: 0 };
      if (event.event_type === 'chat') {
        item.chats += 1;
        eventCounts.chats += 1;
      }
      if (event.event_type === 'cart_add') {
        item.cart_adds += 1;
        eventCounts.cart_adds += 1;
      }
      if (event.event_type === 'purchase') {
        item.purchases += 1;
        eventCounts.purchases += 1;
      }
      eventMap.set(event.ad_id, item);
    });

    const salesMap = new Map<string, { revenue: number; orders: number }>();
    let revenue = 0;
    (orders ?? []).forEach((item: any) => {
      const current = salesMap.get(item.ad_id) || { revenue: 0, orders: 0 };
      current.revenue += Number(item.total_price || 0);
      current.orders += 1;
      salesMap.set(item.ad_id, current);
      revenue += Number(item.total_price || 0);
    });

    const listingMetrics = (ads ?? []).map((ad: any) => {
      const perAdEvents = eventMap.get(ad.id) || { chats: 0, cart_adds: 0, purchases: 0 };
      const perAdSales = salesMap.get(ad.id) || { revenue: 0, orders: 0 };
      eventCounts.views += Number(ad.view_count || 0);
      return {
        ...ad,
        analytics: {
          views: Number(ad.view_count || 0),
          chats: perAdEvents.chats,
          cart_adds: perAdEvents.cart_adds,
          purchases: perAdEvents.purchases || perAdSales.orders,
          revenue: perAdSales.revenue,
          conversion_rate:
            Number(ad.view_count || 0) > 0
              ? Number((((perAdEvents.purchases || perAdSales.orders) / Number(ad.view_count || 0)) * 100).toFixed(1))
              : 0,
        },
      };
    });

    const { data: reviews } = await supabaseAdmin
      .from('seller_reviews')
      .select('rating')
      .eq('seller_id', sellerId)
      .eq('status', 'published');

    const averageRating = reviews?.length
      ? Number((reviews.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / reviews.length).toFixed(1))
      : 0;

    return NextResponse.json({
      summary: {
        total_ads: ads?.length || 0,
        published_ads: ads?.filter((ad) => ad.status === 'published').length || 0,
        total_views: eventCounts.views,
        total_chats: eventCounts.chats,
        total_cart_adds: eventCounts.cart_adds,
        total_purchases: eventCounts.purchases || orders?.length || 0,
        total_revenue: revenue,
        average_rating: averageRating,
        total_reviews: reviews?.length || 0,
      },
      listings: listingMetrics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load analytics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
