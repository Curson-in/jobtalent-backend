import { enhanceResumeWithAI } from "../services/openai.service.js";
import pool from "../config/database.js";

export const resumeEnhance = async (req, res) => {
  const userId = req.user.id;
  const { resumeText, targetRole, experienceLevel } = req.body;

  if (!resumeText || !targetRole) {
    return res.status(400).json({ message: "Missing data" });
  }

  // check usage
  const { rows } = await pool.query(
    `SELECT usage_count FROM resume_ai_usage WHERE user_id=$1`,
    [userId]
  );

  const usage = rows[0]?.usage_count || 0;

  if (usage >= 5) {
    return res.status(403).json({
      message: "AI resume limit reached",
    });
  }

  const aiResult = await enhanceResumeWithAI({
    resumeText,
    targetRole,
    experienceLevel,
  });

  // update usage
  await pool.query(
    `
    INSERT INTO resume_ai_usage (user_id, usage_count)
    VALUES ($1, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET usage_count = resume_ai_usage.usage_count + 1
    `,
    [userId]
  );

  res.json({ result: aiResult });
};
