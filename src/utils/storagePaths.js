import path from "path";

export const DISK_ROOT =
  process.env.RENDER_DISK_PATH || path.join(process.cwd(), "uploads");

export const RESUME_DIR = path.join(DISK_ROOT, "resumes");
export const AI_RESUME_DIR = path.join(DISK_ROOT, "ai-resumes");
