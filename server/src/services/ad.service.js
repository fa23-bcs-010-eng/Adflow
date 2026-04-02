const supabase = require('../config/supabase');
const slugify = require('slugify');

// ── Ranking Score ─────────────────────────────────────────────
const computeRankScore = ({ is_featured, package_weight, published_at, admin_boost, is_verified_seller }) => {
  const featuredPoints = is_featured ? 50 : 0;
  const packagePoints = (package_weight || 1) * 10;

  // Freshness: max 30 pts, decays over 30 days
  let freshnessPoints = 0;
  if (published_at) {
    const daysSince = (Date.now() - new Date(published_at).getTime()) / (1000 * 60 * 60 * 24);
    freshnessPoints = Math.max(0, 30 - daysSince);
  }

  const boostPoints = parseFloat(admin_boost || 0);
  const verifiedPoints = is_verified_seller ? 10 : 0;

  return featuredPoints + packagePoints + freshnessPoints + boostPoints + verifiedPoints;
};

// ── Ad Status Transitions ─────────────────────────────────────
const VALID_TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['payment_pending', 'draft'],  // reject → back to draft
  payment_pending: ['payment_submitted'],
  payment_submitted: ['payment_verified', 'payment_pending'],  // reject proof
  payment_verified: ['scheduled', 'published'],
  scheduled: ['published'],
  published: ['expired'],
  expired: ['archived'],
  archived: [],
};

const assertTransition = (from, to) => {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw { status: 422, message: `Cannot transition from '${from}' to '${to}'` };
  }
};

const logStatusChange = async (ad_id, from_status, to_status, changed_by, note) => {
  await supabase.from('ad_status_history').insert({
    ad_id, from_status, to_status, changed_by, note,
  });
};

// ── Create Ad ─────────────────────────────────────────────────
const createAd = async (user_id, body) => {
  const { title, media, ...rest } = body;

  const baseSlug = slugify(title, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now()}`;

  const { data: ad, error } = await supabase
    .from('ads')
    .insert({ user_id, title, slug, ...rest })
    .select('*')
    .single();

  if (error) throw error;

  // Insert media URLs
  if (media && media.length > 0) {
    const mediaRows = media.map((m, i) => ({
      ad_id: ad.id,
      media_url: m.media_url,
      media_type: m.media_type || 'image',
      display_order: i,
      is_primary: i === 0,
    }));
    await supabase.from('ad_media').insert(mediaRows);
  }

  await logStatusChange(ad.id, null, 'draft', user_id, 'Ad created');
  return ad;
};

// ── Update Ad (draft only) ────────────────────────────────────
const updateAd = async (user_id, ad_id, body) => {
  const { data: ad } = await supabase.from('ads').select('*').eq('id', ad_id).eq('user_id', user_id).maybeSingle();
  if (!ad) throw { status: 404, message: 'Ad not found' };
  if (!['draft', 'payment_pending'].includes(ad.status)) {
    throw { status: 422, message: 'Only draft or payment_pending ads can be edited' };
  }

  const { data: updated, error } = await supabase
    .from('ads')
    .update(body)
    .eq('id', ad_id)
    .select('*')
    .single();

  if (error) throw error;
  return updated;
};

// ── Submit Ad ─────────────────────────────────────────────────
const submitAd = async (user_id, ad_id) => {
  const { data: ad } = await supabase.from('ads').select('*').eq('id', ad_id).eq('user_id', user_id).maybeSingle();
  if (!ad) throw { status: 404, message: 'Ad not found' };
  assertTransition(ad.status, 'submitted');

  const { data: updated } = await supabase.from('ads').update({ status: 'submitted' }).eq('id', ad_id).select('*').single();
  await logStatusChange(ad_id, ad.status, 'submitted', user_id, null);

  // Notify moderators (simplified – just creates audit log)
  await supabase.from('audit_logs').insert({
    actor_id: user_id, action: 'ad_submitted', entity_type: 'ads', entity_id: ad_id,
  });

  return updated;
};

// ── Get Public Ads ────────────────────────────────────────────
const getPublicAds = async ({ category, city, search, page = 1, limit = 20 }) => {
  let query = supabase
    .from('ads')
    .select(`*, category:categories(name,slug), city:cities(name,slug), package:packages(name,weight), media:ad_media(*)`)
    .eq('status', 'published')
    .gt('expires_at', new Date().toISOString())
    .order('rank_score', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (category) query = query.eq('categories.slug', category);
  if (city) query = query.eq('cities.slug', city);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ── Get Ad by Slug ────────────────────────────────────────────
const getAdBySlug = async (slug) => {
  const { data: ad, error } = await supabase
    .from('ads')
    .select(`*, category:categories(*), city:cities(*), package:packages(*), media:ad_media(*), seller:users(full_name), payment:payments(status)`)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  if (!ad) throw { status: 404, message: 'Ad not found' };

  // Increment view count
  await supabase.from('ads').update({ view_count: ad.view_count + 1 }).eq('id', ad.id);

  return ad;
};

// ── Get Client Ads ────────────────────────────────────────────
const getClientAds = async (user_id) => {
  const { data, error } = await supabase
    .from('ads')
    .select(`*, media:ad_media(*), package:packages(name)`)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ── Moderator Review ──────────────────────────────────────────
const getReviewQueue = async () => {
  const { data, error } = await supabase
    .from('ads')
    .select(`*, user:users(full_name,email), media:ad_media(*), category:categories(name), city:cities(name), package:packages(name)`)
    .in('status', ['submitted', 'under_review'])
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

const reviewAd = async (moderator_id, ad_id, { action, note }) => {
  const { data: ad } = await supabase.from('ads').select('*').eq('id', ad_id).maybeSingle();
  if (!ad) throw { status: 404, message: 'Ad not found' };

  const newStatus = action === 'approve' ? 'payment_pending' : 'draft';
  assertTransition(ad.status === 'submitted' ? 'submitted' : 'under_review', newStatus === 'payment_pending' ? 'payment_pending' : 'draft');

  const { data: updated } = await supabase
    .from('ads')
    .update({ status: newStatus, moderator_note: note, reviewed_by: moderator_id, reviewed_at: new Date().toISOString() })
    .eq('id', ad_id)
    .select('*')
    .single();

  await logStatusChange(ad_id, ad.status, newStatus, moderator_id, note);

  // Notify client
  await supabase.from('notifications').insert({
    user_id: ad.user_id,
    title: action === 'approve' ? 'Ad Approved!' : 'Ad Needs Changes',
    body: action === 'approve'
      ? 'Your ad has been approved. Please complete your payment.'
      : `Your ad was returned for revision: ${note || 'Please check the guidelines.'}`,
    type: action === 'approve' ? 'success' : 'warning',
    ad_id,
  });

  return updated;
};

// ── Admin Publish ─────────────────────────────────────────────
const publishAd = async (admin_id, ad_id, { scheduled_at, feature } = {}) => {
  const { data: ad } = await supabase
    .from('ads')
    .select('*, package:packages(*), user:users!ads_user_id_fkey(full_name, seller_profiles(is_verified))')
    .eq('id', ad_id)
    .maybeSingle();

  if (!ad) throw { status: 404, message: 'Ad not found' };

  const pkg = ad.package;
  const durationDays = pkg?.duration_days || 7;
  const now = new Date();
  const publishDate = scheduled_at ? new Date(scheduled_at) : now;
  const expiresAt = new Date(publishDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const is_featured = feature !== undefined ? feature : pkg?.is_featured || false;

  const rankScore = computeRankScore({
    is_featured,
    package_weight: pkg?.weight || 1,
    published_at: publishDate.toISOString(),
    admin_boost: ad.admin_boost || 0,
    is_verified_seller: ad.user?.seller_profiles?.[0]?.is_verified || false,
  });

  const newStatus = scheduled_at && new Date(scheduled_at) > now ? 'scheduled' : 'published';

  const { data: updated } = await supabase
    .from('ads')
    .update({
      status: newStatus,
      is_featured,
      rank_score: rankScore,
      published_at: newStatus === 'published' ? publishDate.toISOString() : null,
      scheduled_at: newStatus === 'scheduled' ? publishDate.toISOString() : null,
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', ad_id)
    .select('*')
    .single();

  await logStatusChange(ad_id, ad.status, newStatus, admin_id, null);

  await supabase.from('notifications').insert({
    user_id: ad.user_id,
    title: 'Your Ad is Live! 🎉',
    body: `"${ad.title}" is now published and visible to buyers.`,
    type: 'success',
    ad_id,
  });

  return updated;
};

module.exports = {
  createAd, updateAd, submitAd,
  getPublicAds, getAdBySlug, getClientAds,
  getReviewQueue, reviewAd,
  publishAd, computeRankScore,
};
