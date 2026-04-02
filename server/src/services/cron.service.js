const supabase = require('../config/supabase');
const { computeRankScore } = require('./ad.service');

// ── Publish Scheduled Ads ─────────────────────────────────────
const publishScheduledAds = async () => {
  const now = new Date().toISOString();

  const { data: ads, error } = await supabase
    .from('ads')
    .select('*, package:packages(*), user:users!ads_user_id_fkey(seller_profiles(is_verified))')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (error) throw error;
  if (!ads || ads.length === 0) return { published: 0 };

  let published = 0;
  for (const ad of ads) {
    const rankScore = computeRankScore({
      is_featured: ad.is_featured,
      package_weight: ad.package?.weight || 1,
      published_at: now,
      admin_boost: ad.admin_boost || 0,
      is_verified_seller: ad.user?.seller_profiles?.[0]?.is_verified || false,
    });

    await supabase.from('ads').update({
      status: 'published',
      published_at: now,
      rank_score: rankScore,
    }).eq('id', ad.id);

    await supabase.from('ad_status_history').insert({
      ad_id: ad.id, from_status: 'scheduled', to_status: 'published', changed_by: null, note: 'Auto-published by scheduler',
    });

    await supabase.from('notifications').insert({
      user_id: ad.user_id,
      title: 'Your Ad is Now Live! 🎉',
      body: `"${ad.title}" has been automatically published.`,
      type: 'success',
      ad_id: ad.id,
    });

    published++;
  }

  await supabase.from('system_health_logs').insert({
    job_name: 'publish_scheduled', status: 'success', message: `Published ${published} scheduled ads`, ads_affected: published,
  });

  return { published };
};

// ── Expire Ads ────────────────────────────────────────────────
const expireAds = async () => {
  const now = new Date().toISOString();

  const { data: ads, error } = await supabase
    .from('ads')
    .select('id, user_id, title')
    .eq('status', 'published')
    .lte('expires_at', now);

  if (error) throw error;
  if (!ads || ads.length === 0) return { expired: 0 };

  const ids = ads.map(a => a.id);
  await supabase.from('ads').update({ status: 'expired' }).in('id', ids);

  const notifs = ads.map(ad => ({
    user_id: ad.user_id,
    title: 'Ad Expired',
    body: `Your ad "${ad.title}" has expired. Renew it to keep it visible.`,
    type: 'warning',
    ad_id: ad.id,
  }));
  await supabase.from('notifications').insert(notifs);

  await supabase.from('system_health_logs').insert({
    job_name: 'expire_ads', status: 'success', message: `Expired ${ids.length} ads`, ads_affected: ids.length,
  });

  return { expired: ids.length };
};

// ── Health Check ──────────────────────────────────────────────
const healthCheck = async () => {
  const { count } = await supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published');
  await supabase.from('system_health_logs').insert({
    job_name: 'health_check', status: 'success', message: `${count} active published ads`, ads_affected: count,
  });
  return { active_ads: count };
};

module.exports = { publishScheduledAds, expireAds, healthCheck };
