import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { COOKIE_NAME, authenticate, cookieOptions, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Try again in 15 minutes' },
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase().trim();
    const password = String(req.body.password || '');
    if (!email || !password) throw new HttpError(400, 'Enter your email and password');

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.active || !(await user.checkPassword(password))) {
      throw new HttpError(401, 'Email or password is incorrect');
    }
    res.cookie(COOKIE_NAME, signToken(user._id), cookieOptions());
    res.json({ user });
  })
);

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

export default router;
