import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';

export const COOKIE_NAME = 'token';

export const cookieOptions = () => ({
  httpOnly: true,
  // Cross-origin Vercel (frontend) + Render (API) deployments need SameSite=None over HTTPS.
  sameSite: env.cookieSecure ? 'none' : 'lax',
  secure: env.cookieSecure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

export const signToken = (userId) => jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = req.cookies?.[COOKIE_NAME] || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) throw new HttpError(401, 'Please sign in to continue');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new HttpError(401, 'This account is no longer active');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to do this'));
  }
  return next();
};

export const isStaff = (user) => ['editor', 'admin'].includes(user.role);
