import express from "express";
import {
  createSubscription,
  dodoWebhook,
  paymentSuccess
} from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../config/database.js"; // ✅ REQUIRED

const router = express.Router();

// ===============================
// REAL PAYMENT ROUTES
// ===============================
router.post("/create-subscription", authMiddleware, createSubscription);

router.get("/payment/success", paymentSuccess);

router.post(
  "/payments/webhook/dodo",
  express.raw({ type: "application/json" }),
  dodoWebhook
);


// ===============================
// 🔥 DEV ONLY — FORCE PREMIUM
// ===============================
router.post("/dev/force-premium", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  await pool.query(
    `
    INSERT INTO subscriptions (
      user_id, plan, status, start_date, end_date, auto_renew
    )
    VALUES (
      $1, 'half_year_99', 'active',
      NOW(), NOW() + INTERVAL '180 days', true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan = 'half_year_99',
      status = 'active',
      start_date = NOW(),
      end_date = NOW() + INTERVAL '180 days',
      auto_renew = true
    `,
    [userId]
  );

  return res.json({ ok: true });
});

export default router;