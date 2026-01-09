import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'jobtalent/profile_photos',
    resource_type: 'image', // 🔥 MUST BE image
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    public_id: (req) => `profile_${req.user.id}`
  },
});

const uploadPhoto = multer({ storage });

export default uploadPhoto;
