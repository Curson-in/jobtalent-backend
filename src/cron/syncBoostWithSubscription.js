import pool from "../config/database.js";

export const syncBoostWithSubscription = async () => {
  try {
    await pool.query(`
      UPDATE profile_boosts pb
      SET is_boosted = false
      FROM subscriptions s
      WHERE pb.user_id = s.user_id
        AND (s.status != 'active' OR s.end_date < NOW())
    `);

    console.log("🔄 Boosts synced with subscription status");
  } catch (err) {
    console.error("❌ Boost sync failed", err);
  }
};