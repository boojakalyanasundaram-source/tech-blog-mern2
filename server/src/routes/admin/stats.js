import { Router } from 'express';
import Post from '../../models/Post.js';
import Category from '../../models/Category.js';
import Tag from '../../models/Tag.js';
import Author from '../../models/Author.js';
import { isStaff } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/httpError.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const scope = isStaff(req.user) ? {} : { createdBy: req.user._id };
    const [grouped, views, categories, tags, authors, recent, top] = await Promise.all([
      Post.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Post.aggregate([{ $match: scope }, { $group: { _id: null, views: { $sum: '$views' } } }]),
      Category.countDocuments(),
      Tag.countDocuments(),
      Author.countDocuments(),
      Post.find(scope).select('title status updatedAt slug').sort({ updatedAt: -1 }).limit(6).lean(),
      Post.find({ ...scope, status: 'published' }).select('title slug views').sort({ views: -1 }).limit(5).lean(),
    ]);
    const posts = { draft: 0, scheduled: 0, published: 0 };
    grouped.forEach((g) => { posts[g._id] = g.count; });
    res.json({ posts, views: views[0]?.views || 0, categories, tags, authors, recent, top });
  })
);

export default router;
