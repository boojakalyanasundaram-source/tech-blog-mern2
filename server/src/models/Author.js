import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true },
    bio: { type: String, default: '', maxlength: 500 },
    avatar: { type: String, default: '' },
    email: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    twitter: { type: String, default: '', trim: true },
    linkedin: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Author', authorSchema);
