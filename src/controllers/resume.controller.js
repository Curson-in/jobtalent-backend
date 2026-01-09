import { extractTextFromFile } from "../utils/resumeParser.js";
import { enhanceResumeWithAI } from "../services/openai.service.js";

export const enhanceResume = async (req, res) => {
  try {
    // 🔒 PLAN CHECK
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

    res.json({
      success: true,
      enhancedText
    });
  } catch (err) {
    console.error("Resume enhancement error:", err);
    res.status(500).json({
      success: false,
      message: "Resume enhancement failed"
    });
  }
};

