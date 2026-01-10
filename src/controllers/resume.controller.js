import fs from "fs";
import path from "path";
import { AI_RESUME_DIR } from "../utils/storagePaths.js";
import { extractTextFromFile } from "../utils/resumeParser.js";
import { enhanceResumeWithAI } from "../services/openai.service.js";
import { generatePDFBuffer } from "../utils/pdfGenerator.js"; // your util

export const enhanceResume = async (req, res) => {
  try {
    if (!req.user.entitlements.resumeEnhance) {
      return res.status(403).json({
        success: false,
        message: "Upgrade to use Resume Enhance"
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const extractedText = await extractTextFromFile(file);
    if (!extractedText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract resume text"
      });
    }

    const { enhancedText } = await enhanceResumeWithAI(extractedText);

    // ✅ CREATE PDF
    const pdfBuffer = await generatePDFBuffer(enhancedText);

    // ✅ SAVE TO RENDER DISK
    const filename = `ai_resume_${req.user.id}_${Date.now()}.pdf`;
    const filePath = path.join(AI_RESUME_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    res.json({
      success: true,
      enhancedText,
      filename
    });
  } catch (err) {
    console.error("Resume enhancement error:", err);
    res.status(500).json({
      success: false,
      message: "Resume enhancement failed"
    });
  }
};
