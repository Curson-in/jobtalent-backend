import fs from "fs";
import path from "path";
import { RESUME_DIR } from "../utils/storagePaths.js";
import { AI_RESUME_DIR } from "../utils/storagePaths.js";


export const serveResume = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(RESUME_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Resume not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  fs.createReadStream(filePath).pipe(res);
};

export const serveAIResume = (req, res) => {
  const filePath = path.join(AI_RESUME_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${req.params.filename}"`
  );

  fs.createReadStream(filePath).pipe(res);
};
