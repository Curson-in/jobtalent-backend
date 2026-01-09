import cron from 'node-cron';
import pool from '../config/database.js';

cron.schedule('0 2 * * *', async () => {
  const result = await pool.query(
    `
    SELECT id, plan
    FROM subscriptions
    WHERE auto_renew = true
      AND status = 'active'
      AND end_date <= NOW() + INTERVAL '3 days'
    `
  );

  for (const sub of result.rows) {
    let interval;

    if (sub.plan === 'talent_premium') {
      interval = "6 months";
    } else if (sub.plan === 'employer_pro') {
      interval = "1 year";
    } else {
      continue;
    }

    await pool.query(
      `
      UPDATE subscriptions
      SET
        start_date = end_date,
        end_date = end_date + INTERVAL '${interval}',
        status = 'active',
        updated_at = NOW()
      WHERE id = $1
      `,
      [sub.id]
    );
  }
});