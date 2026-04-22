import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const createReportSchema = z.object({
  ad_id: z.string().uuid(),
  reason: z.string().min(3).max(120),
  details: z.string().max(1000).optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('ad_reports')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to load reports' }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load reports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const body = createReportSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: ad, error: adErr } = await supabaseAdmin
      .from('ads')
      .select('id,title,user_id,status')
      .eq('id', body.ad_id)
      .maybeSingle();

    if (adErr || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    if ((ad.user_id as string) === user.id) {
      return NextResponse.json({ error: 'You cannot report your own ad' }, { status: 422 });
    }

    const { data: existing } = await supabaseAdmin
      .from('ad_reports')
      .select('id')
      .eq('ad_id', body.ad_id)
      .eq('reporter_id', user.id)
      .in('status', ['open', 'under_review'])
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ error: 'You already reported this ad' }, { status: 409 });
    }

    const created = await supabaseAdmin
      .from('ad_reports')
      .insert({
        ad_id: body.ad_id,
        reporter_id: user.id,
        seller_id: ad.user_id as string,
        reason: body.reason,
        details: body.details || null,
      })
      .select('*')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json({ error: created.error?.message || 'Failed to report ad' }, { status: 500 });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      title: 'Report submitted',
      body: `Your complaint for "${ad.title}" was submitted to moderation.`,
      type: 'success',
      ad_id: body.ad_id,
    });

    return NextResponse.json(created.data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : 'Failed to report ad';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
