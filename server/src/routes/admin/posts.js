import { Router } from 'express';
import Post, { STATUSES } from '../../models/Post.js';
import { isStaff, requireRole } from '../../middleware/auth.js';
import { HttpError, asyncHandler } from '../../utils/httpError.js';
import { sanitizeContent } from '../../utils/sanitize.js';
import { escapeRegex, readingTime, stripHtml, uniqueSlug } from '../../utils/text.js';

const router = Router();
const staffOnly = requireRole('editor', 'admin');

const listPopulate = [
  { path: 'category', select: 'name slug' },
  { path: 'author', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

function assertCanEdit(user, post) {
  if (isStaff(user)) return;
  const own = String(post.createdBy?._id || post.createdBy) === String(user._id);
  if (!own) throw new HttpError(403, 'You can only edit your own articles');
  if (post.status !== 'draft') throw new HttpError(403, 'Only editors can change published or scheduled articles');
}

function assertReadyToPublish(data) {
  if (!data.category) throw new HttpError(400, 'Choose a category before publishing');
  if (!data.author) throw new HttpError(400, 'Choose an author before publishing');
  if (!data.contentText) throw new HttpError(400, 'Add some article content before publishing');
}

async function buildPostData(body, user, existing) {
  const title = String(body.title || '').trim();
  if (!title) throw new HttpError(400, 'Title is required');

  const staff = isStaff(user);
  const status = staff ? body.status || existing?.status || 'draft' : 'draft';
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

  const content = sanitizeContent(body.content || '');
  const contentText = stripHtml(content);

  const data = {
    title,
    content,
    contentText,
    excerpt: String(body.excerpt || '').trim().slice(0, 300) || contentText.slice(0, 180).trim(),
    featuredImage: String(body.featuredImage || ''),
    featuredImageAlt: String(body.featuredImageAlt || '').slice(0, 200),
    category: body.category || null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    author: body.author || null,
    seoTitle: String(body.seoTitle || '').trim().slice(0, 70),
    metaDescription: String(body.metaDescription || '').trim().slice(0, 170),
    readingTime: readingTime(contentText),
    status,
    slug: await uniqueSlug(Post, body.slug || title, existing?._id),
  };
  if (staff && typeof body.isFeatured === 'boolean') data.isFeatured = body.isFeatured;

  if (status !== 'draft') assertReadyToPublish(data);

  if (status === 'scheduled') {
    const when = new Date(body.publishedAt);
    if (Number.isNaN(when.getTime()) || when <= new Date()) {
      throw new HttpError(400, 'Pick a future date and time to schedule this article');
    }
    data.publishedAt = when;
  } else if (status === 'published') {
    const given = body.publishedAt ? new Date(body.publishedAt) : null;
    if (given && !Number.isNaN(given.getTime()) && given <= new Date()) data.publishedAt = given;
    else data.publishedAt = existing?.status === 'published' ? existing.publishedAt : new Date();
  }
  return data;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 50);
    const base = isStaff(req.user) ? {} : { createdBy: req.user._id };
    const filter = { ...base };
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (q) filter.title = new RegExp(escapeRegex(q), 'i');

    const [items, total, grouped] = await Promise.all([
      Post.find(filter)
        .select('-content -contentText')
        .populate(listPopulate)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
      Post.aggregate([{ $match: base }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    const counts = { draft: 0, scheduled: 0, published: 0 };
    grouped.forEach((g) => { counts[g._id] = g.count; });
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), counts });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).select('-contentText').lean();
    if (!post) throw new HttpError(404, 'Article not found');
    if (!isStaff(req.user) && String(post.createdBy) !== String(req.user._id)) {
      throw new HttpError(403, 'You can only open your own articles');
    }
    res.json(post);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await buildPostData(req.body, req.user, null);
    const post = await Post.create({ ...data, createdBy: req.user._id });
    res.status(201).json(post);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await Post.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Article not found');
    assertCanEdit(req.user, existing);
    const data = await buildPostData(req.body, req.user, existing);
    existing.set(data);
    await existing.save();
    res.json(existing);
  })
);

// Quick publish / unpublish / schedule from the posts table
router.patch(
  '/:id/status',
  staffOnly,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, 'Article not found');
    const { status, publishedAt } = req.body;
    if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');

    if (status !== 'draft') assertReadyToPublish({ category: post.category, author: post.author, contentText: post.contentText });
    if (status === 'scheduled') {
      const when = new Date(publishedAt);
      if (Number.isNaN(when.getTime()) || when <= new Date()) throw new HttpError(400, 'Pick a future date and time');
      post.publishedAt = when;
    }
    if (status === 'published' && post.status !== 'published') post.publishedAt = new Date();
    post.status = status;
    await post.save();
    res.json(post);
  })
);

router.patch(
  '/:id/feature',
  staffOnly,
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndUpdate(req.params.id, { isFeatured: !!req.body.isFeatured }, { new: true });
    if (!post) throw new HttpError(404, 'Article not found');
    res.json(post);
  })
);

router.delete(
  '/:id',
  staffOnly,
  asyncHandler(async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) throw new HttpError(404, 'Article not found');
    res.json({ ok: true });
  })
);

export default router;
