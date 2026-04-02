const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { publishScheduledAds, expireAds, healthCheck } = require('../services/cron.service');

const isAdmin = [auth, requireRole('admin', 'super_admin')];

// Manually trigger cron jobs (admin/dev use)
router.post('/publish-scheduled', ...isAdmin, async (req, res, next) => {
  try {
    const result = await publishScheduledAds();
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/expire-ads', ...isAdmin, async (req, res, next) => {
  try {
    const result = await expireAds();
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/health-check', ...isAdmin, async (req, res, next) => {
  try {
    const result = await healthCheck();
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
