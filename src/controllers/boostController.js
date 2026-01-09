import pool from "../config/database.js";

export const activateBoost = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Check active subscription
    const { rows } = await pool.query(
      `
      SELECT plan FROM subscriptions
      WHERE user_id = $1 AND status = 'active'
      `,
      [userId]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "No active subscription" });
    }

    const planUsed = rows[0].plan;

    // 2️⃣ UPSERT boost (SAFE)
    await pool.query(
      `
      INSERT INTO profile_boosts (user_id, is_boosted, plan_used, started_at)
      VALUES ($1, true, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        is_boosted = true,
        plan_used = EXCLUDED.plan_used,
        started_at = NOW()
      `,
      [userId, planUsed]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("BOOST ACTIVATE ERROR:", err);
    return res.status(500).json({ message: "Boost activation failed" });
  }
};
