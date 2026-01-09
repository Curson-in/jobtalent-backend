import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'jobtalent/resumes',
    resource_type: 'raw', // IMPORTANT for PDFs
    allowed_formats: ['pdf'],
    public_id: (req, file) =>
      `resume_${req.user.id}_${Date.now()}`,
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
