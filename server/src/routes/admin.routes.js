const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const adService = require('../services/ad.service');
const paymentService = require('../services/payment.service');
const { verifyPaymentSchema } = require('../validators/schemas');
const supabase = require('../config/supabase');

const isAdmin = [auth, requireRole('admin', 'super_admin')];

// GET /api/admin/payment-queue
router.get('/payment-queue', ...isAdmin, async (req, res, next) => {
  try {
    const queue = await paymentService.getPaymentQueue();
    res.json(queue);
  } catch (err) { next(err); }
});

// PATCH /api/admin/payments/:id/verify
router.patch('/payments/:id/verify', ...isAdmin, async (req, res, next) => {
  try {
    const body = verifyPaymentSchema.parse(req.body);
    const result = await paymentService.verifyPayment(req.user.id, req.params.id, body);
    res.json(result);
  } catch (err) { next(err); }
});

// PATCH /api/admin/ads/:id/publish
router.patch('/ads/:id/publish', ...isAdmin, async (req, res, next) => {
  try {
    const ad = await adService.publishAd(req.user.id, req.params.id, req.body);
    res.json(ad);
  } catch (err) { next(err); }
});

// PATCH /api/admin/ads/:id/feature – Toggle featured + boost
router.patch('/ads/:id/feature', ...isAdmin, async (req, res, next) => {
  try {
    const { is_featured, admin_boost } = req.body;
    const { data, error } = await supabase
      .from('ads')
      .update({ is_featured: !!is_featured, admin_boost: admin_boost || 0 })
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/admin/analytics
router.get('/analytics', ...isAdmin, async (req, res, next) => {
  try {
    const [
      { count: totalAds },
      { count: publishedAds },
      { count: pendingReview },
      { count: pendingPayment },
      { data: revenueData },
      { data: byCategory },
      { data: cronLogs },
    ] = await Promise.all([
      supabase.from('ads').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('payments').select('amount').eq('status', 'verified'),
      supabase.from('ads').select('category:categories(name), count:id.count()').eq('status', 'published').not('category_id', 'is', null),
      supabase.from('system_health_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const revenue = revenueData?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

    res.json({
      total_ads: totalAds,
      published_ads: publishedAds,
      pending_review: pendingReview,
      pending_payment: pendingPayment,
      total_revenue: revenue,
      cron_logs: cronLogs,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/users – User management
router.get('/users', ...isAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', [auth, requireRole('super_admin')], async (req, res, next) => {
  try {
    const { role } = req.body;
    const { data, error } = await supabase.from('users').update({ role }).eq('id', req.params.id).select('id, email, role').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
