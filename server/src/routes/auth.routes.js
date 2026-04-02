const router = require('express').Router();
const { registerSchema, loginSchema } = require('../validators/schemas');
const authService = require('../services/auth.service');

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (err) { next(err); }
});
router.post('/demo', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['client', 'moderator', 'admin', 'super_admin'].includes(role)) {
      throw { status: 400, message: 'Invalid role' };
    }
    const result = await authService.demoLogin(role);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
