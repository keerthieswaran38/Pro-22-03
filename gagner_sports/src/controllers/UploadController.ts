import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gagner_sports',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  } as any,
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export const uploadMedia = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  res.json({ success: true, url: (req.file as any).path });
};

export const uploadMiddleware = upload.single('image');
