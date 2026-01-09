import pool from "../config/database.js";




export const toggleAutoRenew = async (req, res) => {
  try {
    const userId = req.user.id;
    const { auto_renew } = req.body;

    await pool.query(
      `
      UPDATE subscriptions
      SET auto_renew = $1
      WHERE user_id = $2
      `,
      [auto_renew, userId]
    );

    res.json({ message: "Auto-renew updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update auto-renew" });
  }
};