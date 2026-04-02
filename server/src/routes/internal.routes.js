const router = require('express').Router();
const { publishScheduledAds, expireAds, healthCheck } = require('../services/cron.service');
const { getDatabaseStats, getMongoInfo } = require('../config/database');

// Middleware to verify Vercel Cron Secret
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
  }
  next();
};

// ── Database Admin Endpoints ─────────────────────────────────
router.get('/db/stats', async (req, res, next) => {
  try {
    const stats = await getDatabaseStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

router.get('/db/info', async (req, res, next) => {
  try {
    const info = await getMongoInfo();
    res.json({ success: true, data: info });
  } catch (err) { next(err); }
});

// Vercel Cron endpoints (Protected by CRON_SECRET)
router.get('/cron/publish-scheduled', verifyCronSecret, async (req, res, next) => {
  try {
    const result = await publishScheduledAds();
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/cron/expire-ads', verifyCronSecret, async (req, res, next) => {
  try {
    const result = await expireAds();
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/health', async (req, res) => {
  try {
    const result = await healthCheck();
    res.json({ status: 'ok', ...result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
