const router = require('express').Router();
const { publishScheduledAds, expireAds, healthCheck } = require('../services/cron.service');
// Middleware to verify Vercel Cron Secret
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
  }
  next();
};

// ── Admin Endpoints ──────────────────────────────────────────
// (MongoDB stats and info routes removed)

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
