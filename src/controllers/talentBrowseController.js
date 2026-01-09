import pool from "../config/database.js";

export const getTalentProfilesForEmployer = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.user_id,
        p.desired_role,
        p.city,
        p.experience,
        p.education,
        p.summary,
        p.profile_picture_url,
        p.is_boosted,
        p.expires_at AS boost_expires_at
        u.first_name,
        u.last_name
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN subscriptions s ON s.user_id = p.user_id
      WHERE p.profile_type = 'talent'
      ORDER BY
        CASE
          WHEN p.is_boosted = TRUE
            AND p.boost_expires_at > NOW()
            AND s.status = 'active'
            AND s.end_date > NOW()
          THEN 0
          ELSE 1
        END,
        p.updated_at DESC
    `);

    res.json({ talents: result.rows });
  } catch (err) {
    console.error("❌ Failed to load talent profiles", err);
    res.status(500).json({ message: "Failed to load talent profiles" });
  }
};