import multer from "multer";
import path from "path";
import { RESUME_DIR } from "../utils/storagePaths.js";

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, RESUME_DIR),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname}`),
});

export const uploadResume = multer({ storage });
