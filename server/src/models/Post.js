import mongoose from 'mongoose';

export const STATUSES = ['draft', 'scheduled', 'published'];

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '', maxlength: 300 },
    content: { type: String, default: '' },
    contentText: { type: String, default: '' }, // plain text copy used for search and reading time
    featuredImage: { type: String, default: '' },
    featuredImageAlt: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    publishedAt: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    readingTime: { type: Number, default: 1 },
    seoTitle: { type: String, default: '', maxlength: 70 },
    metaDescription: { type: String, default: '', maxlength: 170 },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1 });
postSchema.index({ isFeatured: 1, status: 1 });
postSchema.index({ views: -1 });

export default mongoose.model('Post', postSchema);
