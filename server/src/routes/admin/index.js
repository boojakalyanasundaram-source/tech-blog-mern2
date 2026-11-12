import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import Category from '../../models/Category.js';
import Tag from '../../models/Tag.js';
import Author from '../../models/Author.js';
import { crudRouter } from './crud.js';
import postsRouter from './posts.js';
import usersRouter from './users.js';
import uploadRouter from './upload.js';
import statsRouter from './stats.js';

const router = Router();
router.use(authenticate);

router.use('/stats', statsRouter);
router.use('/posts', postsRouter);
router.use('/upload', uploadRouter);
router.use('/users', requireRole('admin'), usersRouter);

router.use(
  '/categories',
  crudRouter(Category, { label: 'Category', fields: ['name', 'description', 'order'], sort: { order: 1, name: 1 }, usageField: 'category' })
);
router.use(
  '/tags',
  crudRouter(Tag, { label: 'Tag', fields: ['name'], sort: { name: 1 }, usageField: 'tags', onDelete: 'pull' })
);
router.use(
  '/authors',
  crudRouter(Author, {
    label: 'Author',
    fields: ['name', 'bio', 'avatar', 'email', 'website', 'twitter', 'linkedin'],
    sort: { name: 1 },
    usageField: 'author',
  })
);

export default router;
