import axios from "axios";
import pool from "../config/database.js";
import { PLAN_ENTITLEMENTS } from "../config/planEntitlements.js";

import { Webhook } from "svix";




const DODO_API_URL = process.env.DODO_API_URL; // https://test.dodopayments.com

/**
 * Frontend plan key -> Dodo Product ID
 * (USE REAL IDS FROM DODO DASHBOARD)
 */
const DODO_PRODUCTS = {
  monthly_99: "pdt_0NVuiQSDfGDczXmT9J3Bw",     // ₹49
  quarterly_149: "pdt_0NVuiYFtIVAk55fpQSVkM",    // ₹99
  yearly_399: "pdt_0NVuifC0ggXpb7mReG7s9"       // ₹299
};

/**
 * Subscription duration (days)
 */
const PLAN_DURATION = {
  monthly_99: "1 month",
  quarterly_149: "4 months",
  yearly_399: "1 year"
};


/**
 * CREATE CHECKOUT (called from PricingCard)
 */
export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan || !DODO_PRODUCTS[plan]) {
      return res.status(422).json({ message: "Invalid plan" });
    }

    // 1️⃣ create pending payment
    const { rows } = await pool.query(
      `
      INSERT INTO payments (user_id, plan, status, created_at)
      VALUES ($1, $2, 'pending', NOW())
      RETURNING id
      `,
      [userId, plan]
    );

    const paymentId = rows[0].id;

    // 2️⃣ create Dodo checkout
    const payload = {
      product_cart: [
        {
          product_id: DODO_PRODUCTS[plan],
          quantity: 1
        }
      ],
      currency: "INR",
      redirect_urls: {
        success_url: `${process.env.BACKEND_URL}/payment/success?paymentId=${paymentId}`,
cancel_url: `${process.env.FRONTEND_URL}/pricing`

      },
      metadata: {
        paymentId: String(paymentId),
        userId: String(userId),
        plan
      }
    };

    const response = await axios.post(
      `${DODO_API_URL}/checkouts`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.DODO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      checkoutUrl: response.data.checkout_url
    });
  } catch (err) {
    console.error("❌ DODO CHECKOUT ERROR:", err.response?.data || err.message);
    next(err);
  }
};





/**
 * DODO WEBHOOK
 * IMPORTANT: route must use express.raw()
 */

export const dodoWebhook = async (req, res) => {
  try {
    const payload = req.body.toString("utf8");
    const headers = req.headers;

    const wh = new Webhook(process.env.DODO_WEBHOOK_SECRET);

    let evt;
    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error("❌ Invalid webhook signature");
      return res.status(401).json({ message: "Invalid signature" });
    }

    if (evt.type !== "payment.succeeded") {
      return res.json({ ok: true });
    }

    const { paymentId, plan } = evt.data.metadata;

    // continue with DB logic (already correct)


    

    const durationMap = {
      monthly_99: "1 month",
      quarterly_149: "4 months",
      yearly_399: "1 year"
    };

    const duration = durationMap[plan];
    if (!duration) {
      console.error("Invalid plan:", plan);
      return res.status(400).json({ message: "Invalid plan" });
    }

    // 1️⃣ mark payment success
    await pool.query(
      `UPDATE payments SET status='success', verified_at=NOW() WHERE id=$1`,
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

    // 3️⃣ auto boost (ONLY HERE)
    if (plan !== "monthly_99") {
      await pool.query(
        `
        INSERT INTO profile_boosts (user_id, is_boosted, expires_at, plan_used)
        SELECT user_id, true, NULL, $2
        FROM payments WHERE id=$1
        ON CONFLICT (user_id)
        DO UPDATE SET
          is_boosted=true,
          expires_at=NULL,
          plan_used=EXCLUDED.plan_used
        `,
        [paymentId, plan]
      );
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ message: "Webhook failed" });
  }
};


// controllers/paymentController.js
export const paymentSuccess = async (req, res) => {
  const { paymentId } = req.query;

  const { rows } = await pool.query(
    `SELECT id, user_id, plan FROM payments WHERE id = $1`,
    [paymentId]
  );

  if (!rows.length) {
    return res.redirect(`${process.env.FRONTEND_URL}/talent/profile`);
  }

  const payment = rows[0];

  const PLAN_DURATION = {
    monthly_99: "1 month",
    quarterly_149: "4 months",
    yearly_399: "1 year"
  };

  // 1️⃣ Mark payment success (idempotent)
  await pool.query(
    `
    UPDATE payments
    SET status = 'success', verified_at = NOW()
    WHERE id = $1
    `,
    [paymentId]
  );

  // 2️⃣ FORCE subscription creation
  

  return res.redirect(`${process.env.FRONTEND_URL}/talent/profile`);
};
