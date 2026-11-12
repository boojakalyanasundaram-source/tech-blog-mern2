import { Router } from 'express';
import Post from '../../models/Post.js';
import { requireRole } from '../../middleware/auth.js';
import { HttpError, asyncHandler } from '../../utils/httpError.js';
import { uniqueSlug } from '../../utils/text.js';

/**
 * Builds list/create/update/delete routes for a simple taxonomy model.
 * - fields:     body fields that may be written
 * - sort:       list ordering
 * - usageField: the Post field that references this model (category | tags | author)
 * - onDelete:   "block" refuses to delete items that are in use, "pull" removes them from posts
 */
export function crudRouter(Model, { label, fields, sort, usageField, onDelete = 'block' }) {
  const router = Router();
  const staffOnly = requireRole('editor', 'admin');

  const pick = (body) => {
    const data = {};
    fields.forEach((f) => {
      if (body[f] !== undefined) data[f] = typeof body[f] === 'string' ? body[f].trim() : body[f];
    });
    return data;
  };

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const [items, counts] = await Promise.all([
        Model.find().sort(sort).lean(),
        Post.aggregate([{ $unwind: `$${usageField}` }, { $group: { _id: `$${usageField}`, count: { $sum: 1 } } }]),
      ]);
      const map = new Map(counts.map((c) => [String(c._id), c.count]));
      res.json(items.map((i) => ({ ...i, postCount: map.get(String(i._id)) || 0 })));
    })
  );

  router.post(
    '/',
    staffOnly,
    asyncHandler(async (req, res) => {
      const data = pick(req.body);
      if (!data.name) throw new HttpError(400, `${label} name is required`);
      data.slug = await uniqueSlug(Model, req.body.slug || data.name);
      res.status(201).json(await Model.create(data));
    })
  );

  router.put(
    '/:id',
    staffOnly,
    asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw new HttpError(404, `${label} not found`);
      const data = pick(req.body);
      if (data.name === '') throw new HttpError(400, `${label} name is required`);
      if (req.body.slug) data.slug = await uniqueSlug(Model, req.body.slug, doc._id);
      doc.set(data);
      await doc.save();
      res.json(doc);
    })
  );

  router.delete(
    '/:id',
    staffOnly,
    asyncHandler(async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw new HttpError(404, `${label} not found`);
      const inUse = await Post.countDocuments({ [usageField]: doc._id });
      if (inUse && onDelete === 'block') {
        throw new HttpError(409, `${inUse} article(s) use this ${label.toLowerCase()}. Reassign them first`);
      }
      if (inUse && onDelete === 'pull') await Post.updateMany({ [usageField]: doc._id }, { $pull: { [usageField]: doc._id } });
      await doc.deleteOne();
      res.json({ ok: true });
    })
  );

  return router;
}
