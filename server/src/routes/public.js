import { Router } from 'express';
import Post from '../models/Post.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import { HttpError, asyncHandler } from '../utils/httpError.js';
import { addHeadingIds, escapeRegex } from '../utils/text.js';

const router = Router();

const live = () => ({ status: 'published', publishedAt: { $lte: new Date() } });
const cardSelect = '-content -contentText -createdBy';
const cardPopulate = [
  { path: 'category', select: 'name slug' },
  { path: 'author', select: 'name slug avatar' },
  { path: 'tags', select: 'name slug' },
];
const clamp = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
};

// Listing with category, tag, keyword search and pagination
router.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const page = clamp(req.query.page, 1, 10000, 1);
    const limit = clamp(req.query.limit, 1, 24, 10);
    const filter = live();

    if (req.query.category) {
      const category = await Category.findOne({ slug: String(req.query.category) });
      filter.category = category ? category._id : null;
    }
    if (req.query.tag) {
      const tag = await Tag.findOne({ slug: String(req.query.tag) });
      filter.tags = tag ? tag._id : null;
    }
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }, { contentText: rx }];
    }

    const [items, total] = await Promise.all([
      Post.find(filter)
        .select(cardSelect)
        .populate(cardPopulate)
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/posts/featured',
  asyncHandler(async (_req, res) => {
    const items = await Post.find({ ...live(), isFeatured: true })
      .select(cardSelect)
      .populate(cardPopulate)
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean();
    res.json(items);
  })
);

router.get(
  '/posts/trending',
  asyncHandler(async (_req, res) => {
    const items = await Post.find(live())
      .select(cardSelect)
      .populate(cardPopulate)
      .sort({ views: -1, publishedAt: -1 })
      .limit(5)
      .lean();
    res.json(items);
  })
);

router.get(
  '/posts/latest',
  asyncHandler(async (req, res) => {
    const limit = clamp(req.query.limit, 1, 24, 8);
    const filter = live();
    if (req.query.excludeFeatured === '1') filter.isFeatured = { $ne: true };
    const items = await Post.find(filter)
      .select(cardSelect)
      .populate(cardPopulate)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
    res.json(items);
  })
);

// Single article with table of contents, related posts and previous/next navigation
router.get(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    const post = await Post.findOne({ slug: req.params.slug, ...live() })
      .select('-contentText -createdBy')
      .populate('category', 'name slug')
      .populate('author')
      .populate('tags', 'name slug')
      .lean();
    if (!post) throw new HttpError(404, 'Article not found');

    const { html, toc } = addHeadingIds(post.content);
    delete post.content;

    const now = new Date();
    const tagIds = (post.tags || []).map((t) => t._id);
    const relatedFilter = {
      ...live(),
      _id: { $ne: post._id },
      $or: [{ category: post.category?._id || null }, { tags: { $in: tagIds } }],
    };

    const [related, prev, next] = await Promise.all([
      Post.find(relatedFilter).select(cardSelect).populate(cardPopulate).sort({ publishedAt: -1 }).limit(3).lean(),
      Post.findOne({ status: 'published', publishedAt: { $lt: post.publishedAt } })
        .select('title slug featuredImage')
        .sort({ publishedAt: -1 })
        .lean(),
      Post.findOne({ status: 'published', publishedAt: { $gt: post.publishedAt, $lte: now } })
        .select('title slug featuredImage')
        .sort({ publishedAt: 1 })
        .lean(),
    ]);

    // top up related posts with the latest articles if there are fewer than three
    if (related.length < 3) {
      const exclude = [post._id, ...related.map((r) => r._id)];
      const more = await Post.find({ ...live(), _id: { $nin: exclude } })
        .select(cardSelect)
        .populate(cardPopulate)
        .sort({ publishedAt: -1 })
        .limit(3 - related.length)
        .lean();
      related.push(...more);
    }

    Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec().catch(() => {});
    res.json({ post, html, toc, related, prev, next });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const [categories, counts] = await Promise.all([
      Category.find().sort({ order: 1, name: 1 }).lean(),
      Post.aggregate([{ $match: live() }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(categories.map((c) => ({ ...c, count: map.get(String(c._id)) || 0 })));
  })
);

router.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const counts = await Post.aggregate([
      { $match: live() },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    const tags = await Tag.find({ _id: { $in: counts.map((c) => c._id) } }).lean();
    const byId = new Map(tags.map((t) => [String(t._id), t]));
    res.json(counts.map((c) => ({ ...byId.get(String(c._id)), count: c.count })).filter((t) => t._id));
  })
);

export default router;
