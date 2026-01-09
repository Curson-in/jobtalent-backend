

if (payload.type === "payment.succeeded") {
  const paymentId = Number(payload.data.metadata.paymentId);
  const plan = payload.data.metadata.plan;
  const duration = PLAN_DURATION[plan];

  if (!duration) {
    console.error("❌ Invalid plan from webhook:", plan);
    return res.status(400).json({ message: "Invalid plan" });
  }

  // 1️⃣ mark payment success
  await pool.query(
    `
    UPDATE payments
    SET status = 'success',
        verified_at = NOW()
    WHERE id = $1
    `,
    [paymentId]
  );

  // 2️⃣ activate subscription
  await pool.query(
    `
    INSERT INTO subscriptions (
      user_id, plan, status, start_date, end_date, auto_renew
    )
    SELECT
      user_id,
      $2,
      'active',
      NOW(),
      NOW() + $3::interval,
      true
    FROM payments
    WHERE id = $1
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan = EXCLUDED.plan,
      status = 'active',
      start_date = NOW(),
      end_date = EXCLUDED.end_date,
      auto_renew = true,
      updated_at = NOW()
    `,
    [paymentId, plan, duration]
  );

  // 3️⃣ AUTO-BOOST (ONLY FOR PAID PLANS)
// 3️⃣ auto boost
const boostDays = {
  monthly_99: 7,
  quarterly_149: 60,
  yearly_399: null
}[plan];

if (boostDays !== undefined) {
  await pool.query(
    `
    INSERT INTO profile_boosts (
      user_id, is_boosted, started_at, expires_at, plan_used
    )
    SELECT
      user_id,
      true,
      NOW(),
      ${boostDays === null ? "NULL" : "NOW() + INTERVAL '" + boostDays + " days'"},
      $2
    FROM payments
    WHERE id = $1
    ON CONFLICT (user_id)
    DO UPDATE SET
      is_boosted = true,
      started_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      plan_used = EXCLUDED.plan_used
    `,
    [paymentId, plan]
  );
}

}


