import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['moderator', 'admin', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { count: total, error: totalErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true });
    if (totalErr) throw new Error(totalErr.message || 'Failed to count total ads');

    const { count: live, error: liveErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gt('expires_at', nowIso);
    if (liveErr) throw new Error(liveErr.message || 'Failed to count live ads');

    const { count: featuredLive, error: featuredErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_featured', true)
      .gt('expires_at', nowIso);
    if (featuredErr) throw new Error(featuredErr.message || 'Failed to count featured ads');

    const { count: draft, error: draftErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft');
    if (draftErr) throw new Error(draftErr.message || 'Failed to count draft ads');

    const { count: pendingReview, error: pendingErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review']);
    if (pendingErr) throw new Error(pendingErr.message || 'Failed to count pending ads');

    const { count: expired, error: expiredErr } = await supabaseAdmin
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'expired');
    if (expiredErr) throw new Error(expiredErr.message || 'Failed to count expired ads');

    return NextResponse.json({
      total_ads: total ?? 0,
      live_ads: live ?? 0,
      not_live_ads: Math.max((total ?? 0) - (live ?? 0), 0),
      featured_live_ads: featuredLive ?? 0,
      draft_ads: draft ?? 0,
      pending_review_ads: pendingReview ?? 0,
      expired_ads: expired ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load ads summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
