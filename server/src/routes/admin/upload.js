import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { uploadsDir } from '../../config/paths.js';
import { HttpError, asyncHandler } from '../../utils/httpError.js';

const router = Router();
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(new HttpError(400, 'Upload a JPG, PNG, WebP, GIF or AVIF image'));
    return cb(null, true);
  },
});

// Images are resized (max 1600px wide) and converted to WebP, plus a 640px thumbnail for listings.
router.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose an image to upload');

    const now = new Date();
    const folder = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const dir = path.join(uploadsDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const id = crypto.randomBytes(8).toString('hex');
    const web = (file) => `/uploads/${folder.split(path.sep).join('/')}/${file}`;

    // animated GIFs are stored untouched so the animation survives
    if (req.file.mimetype === 'image/gif') {
      await fs.writeFile(path.join(dir, `${id}.gif`), req.file.buffer);
      return res.status(201).json({ url: web(`${id}.gif`), thumbUrl: web(`${id}.gif`) });
    }

    const image = sharp(req.file.buffer, { failOn: 'none' }).rotate();
    const info = await image.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, `${id}.webp`));
    await image.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 75 }).toFile(path.join(dir, `${id}-640.webp`));

    res.status(201).json({ url: web(`${id}.webp`), thumbUrl: web(`${id}-640.webp`), width: info.width, height: info.height });
  })
);

export default router;
