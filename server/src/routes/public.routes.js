const router = require('express').Router();
const supabase = require('../config/supabase');
const adService = require('../services/ad.service');

// GET /api/ads – Public listing with filters
router.get('/ads', async (req, res, next) => {
  try {
    const { category, city, search, page, limit } = req.query;
    const ads = await adService.getPublicAds({ category, city, search, page: +page || 1, limit: +limit || 20 });
    res.json(ads);
  } catch (err) { next(err); }
});

// GET /api/ads/:slug – Public ad detail
router.get('/ads/:slug', async (req, res, next) => {
  try {
    const ad = await adService.getAdBySlug(req.params.slug);
    res.json(ad);
  } catch (err) { next(err); }
});

// GET /api/packages – All active packages
router.get('/packages', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('packages').select('*').eq('is_active', true).order('weight');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/categories – All active categories
router.get('/categories', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/cities – All active cities
router.get('/cities', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('cities').select('*').eq('is_active', true);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/featured – Homepage featured ads
router.get('/featured', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(`*, media:ad_media(*), category:categories(name,slug), city:cities(name,slug), package:packages(name,featured_scope)`)
      .eq('status', 'published')
      .eq('is_featured', true)
      .gt('expires_at', new Date().toISOString())
      .order('rank_score', { ascending: false })
      .limit(8);
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
