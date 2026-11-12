import { Router } from 'express';
import User, { ROLES } from '../../models/User.js';
import Post from '../../models/Post.js';
import { HttpError, asyncHandler } from '../../utils/httpError.js';

const router = Router();
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPassword(pw) {
  if (String(pw).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await User.find().sort({ createdAt: 1 }));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password, role = 'author' } = req.body;
    if (!name || !email || !password) throw new HttpError(400, 'Name, email and password are required');
    if (!emailRx.test(email)) throw new HttpError(400, 'Enter a valid email address');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
    checkPassword(password);
    const user = await User.create({ name, email, role, passwordHash: await User.hashPassword(password) });
    res.status(201).json(user);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    const isSelf = String(user._id) === String(req.user._id);
    const { name, email, password, role, active } = req.body;

    if (isSelf && ((role && role !== user.role) || active === false)) {
      throw new HttpError(400, 'You cannot change your own role or deactivate yourself');
    }
    if (name) user.name = name;
    if (email) {
      if (!emailRx.test(email)) throw new HttpError(400, 'Enter a valid email address');
      user.email = email;
    }
    if (role) {
      if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
      user.role = role;
    }
    if (typeof active === 'boolean') user.active = active;
    if (password) {
      checkPassword(password);
      user.passwordHash = await User.hashPassword(password);
    }
    await user.save();
    res.json(user);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) throw new HttpError(400, 'You cannot delete your own account');
    const owns = await Post.countDocuments({ createdBy: req.params.id });
    if (owns) throw new HttpError(409, `This user created ${owns} article(s). Deactivate the account instead`);
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ ok: true });
  })
);

export default router;
