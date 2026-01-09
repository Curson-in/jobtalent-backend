import cron from "node-cron";
import pool from "../config/database.js";

cron.schedule("0 9 * * *", async () => {
  await pool.query(`
    UPDATE subscriptions
    SET status = 'expiring'
    WHERE end_date <= NOW() + INTERVAL '3 days'
      AND status = 'active'
      AND auto_renew = false
  `);
});