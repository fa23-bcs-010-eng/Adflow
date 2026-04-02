const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const adService = require('../services/ad.service');
const paymentService = require('../services/payment.service');
const { createAdSchema, submitPaymentSchema } = require('../validators/schemas');
const supabase = require('../config/supabase');

const isClient = [auth, requireRole('client', 'super_admin')];

// GET /api/client/ads – My ads
router.get('/ads', auth, async (req, res, next) => {
  try {
    const ads = await adService.getClientAds(req.user.id);
    res.json(ads);
  } catch (err) { next(err); }
});

// POST /api/client/ads – Create draft
router.post('/ads', ...isClient, async (req, res, next) => {
  try {
    const body = createAdSchema.parse(req.body);
    const ad = await adService.createAd(req.user.id, body);
    res.status(201).json(ad);
  } catch (err) { next(err); }
});

// PATCH /api/client/ads/:id – Update draft
router.patch('/ads/:id', ...isClient, async (req, res, next) => {
  try {
    const ad = await adService.updateAd(req.user.id, req.params.id, req.body);
    res.json(ad);
  } catch (err) { next(err); }
});

// POST /api/client/ads/:id/submit – Submit for review
router.post('/ads/:id/submit', ...isClient, async (req, res, next) => {
  try {
    const ad = await adService.submitAd(req.user.id, req.params.id);
    res.json(ad);
  } catch (err) { next(err); }
});

// POST /api/client/payments – Submit payment proof
router.post('/payments', ...isClient, async (req, res, next) => {
  try {
    const body = submitPaymentSchema.parse(req.body);
    const payment = await paymentService.submitPayment(req.user.id, body);
    res.status(201).json(payment);
  } catch (err) { next(err); }
});

// GET /api/client/notifications – User notifications
router.get('/notifications', auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /api/client/notifications/:id/read
router.patch('/notifications/:id/read', auth, async (req, res, next) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/client/dashboard – Get own listings and statuses
router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const ads = await adService.getClientAds(req.user.id);
    const payments = await paymentService.getClientPayments(req.user.id);
    res.json({ ads, payments });
  } catch (err) { next(err); }
});

module.exports = router;
