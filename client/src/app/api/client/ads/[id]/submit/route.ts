import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/request-auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { autoModerationDecision, suggestPriceRange } from '@/lib/server/marketplace-intelligence';

export const dynamic = 'force-dynamic';

function readSlug(value: { slug?: string } | { slug?: string }[] | null | undefined) {
  if (!value) return '';
  if (Array.isArray(value)) return value[0]?.slug || '';
  return value.slug || '';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!['client', 'super_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();
  const found = await supabaseAdmin
    .from('ads')
    .select('id, status, title, description, price, media:ad_media(id), category:categories(slug), city:cities(slug)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (found.error || !found.data) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }

  const moderation = autoModerationDecision({
    title: found.data.title,
    description: found.data.description,
    price: Number(found.data.price || 0),
    category: readSlug(found.data.category),
    city: readSlug(found.data.city),
    mediaCount: Array.isArray(found.data.media) ? found.data.media.length : 0,
  });
  const pricing = suggestPriceRange({
    title: found.data.title,
    description: found.data.description,
    price: Number(found.data.price || 0),
    category: readSlug(found.data.category),
    city: readSlug(found.data.city),
    mediaCount: Array.isArray(found.data.media) ? found.data.media.length : 0,
  });

  await supabaseAdmin.from('ad_ai_assessments').insert({
    ad_id: id,
    user_id: user.id,
    suggested_price_min: pricing.suggested_price_min,
    suggested_price_max: pricing.suggested_price_max,
    suggested_price: pricing.suggested_price,
    quality_score: moderation.quality_score,
    risk_score: moderation.risk_score,
    moderation_decision: moderation.moderation_decision,
    reasoning: moderation.reasoning,
  });

  const nextStatus =
    moderation.moderation_decision === 'approve'
      ? 'published'
      : moderation.moderation_decision === 'review'
      ? 'under_review'
      : 'submitted';

  const updated = await supabaseAdmin
    .from('ads')
    .update({
      status: nextStatus,
      is_featured: moderation.moderation_decision === 'approve',
      published_at: moderation.moderation_decision === 'approve' ? new Date().toISOString() : null,
      expires_at: moderation.moderation_decision === 'approve' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() : null,
      rank_score: moderation.moderation_decision === 'approve' ? 100 : 35,
      moderator_note: moderation.moderation_decision === 'approve' ? null : moderation.reasoning,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updated.error || !updated.data) {
    return NextResponse.json({ error: updated.error?.message || 'Failed to submit ad' }, { status: 500 });
  }

  return NextResponse.json({
    ...updated.data,
    ai_assessment: {
      quality_score: moderation.quality_score,
      risk_score: moderation.risk_score,
      moderation_decision: moderation.moderation_decision,
      suggested_price: pricing.suggested_price,
      suggested_price_min: pricing.suggested_price_min,
      suggested_price_max: pricing.suggested_price_max,
      reasoning: moderation.reasoning,
    },
  });
}
