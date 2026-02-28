export const requirePremium = async (req, res, next) => {
  const result = await pool.query(
    `
    SELECT 1 FROM subscriptions
    WHERE user_id = $1
      AND status = 'active'
      AND end_date > NOW()
    `,
    [req.user.id]
  );

  if (!result.rows.length) {
    router.post("/jobs", requireAuth, createJob);
  }

  next();
};
