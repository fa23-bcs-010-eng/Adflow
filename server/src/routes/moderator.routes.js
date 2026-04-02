const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const adService = require('../services/ad.service');
const { reviewAdSchema } = require('../validators/schemas');

const isModerator = [auth, requireRole('moderator', 'admin', 'super_admin')];

// GET /api/moderator/review-queue
router.get('/review-queue', ...isModerator, async (req, res, next) => {
  try {
    const queue = await adService.getReviewQueue();
    res.json(queue);
  } catch (err) { next(err); }
});

// PATCH /api/moderator/ads/:id/review
router.patch('/ads/:id/review', ...isModerator, async (req, res, next) => {
  try {
    const body = reviewAdSchema.parse(req.body);
    const ad = await adService.reviewAd(req.user.id, req.params.id, body);
    res.json(ad);
  } catch (err) { next(err); }
});

module.exports = router;
