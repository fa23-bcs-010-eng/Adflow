import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const trackSchema = z.object({
  event_type: z.enum(['view', 'chat', 'cart_add', 'purchase']),
  meta: z.record(z.any()).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = getAuthenticatedUser(request);

  try {
    const body = trackSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: ad, error: adErr } = await supabaseAdmin
      .from('ads')
      .select('id,user_id,view_count')
      .eq('id', id)
      .maybeSingle();

    if (adErr || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    await supabaseAdmin.from('ad_analytics_events').insert({
      ad_id: id,
      user_id: user?.id || null,
      seller_id: ad.user_id as string,
      event_type: body.event_type,
      meta: body.meta || null,
    });

    if (body.event_type === 'view') {
      await supabaseAdmin
        .from('ads')
        .update({ view_count: Number(ad.view_count || 0) + 1 })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to track event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
