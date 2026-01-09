import pool from "../config/database.js";

export const expireBoosts = async () => {
  try {
    await pool.query(`
      UPDATE profile_boosts
      SET is_boosted = false
      WHERE is_boosted = true
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    `);

    console.log("✅ Expired profile boosts cleaned");
  } catch (err) {
    console.error("❌ Boost expiry failed", err);
  }
};