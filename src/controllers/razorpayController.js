import Razorpay from "razorpay";
import crypto from "crypto";
import pool from "../config/database.js";

const PLAN_AMOUNT = {
  // Talent Plans
  monthly_99: 99,
  quarterly_149: 149,
  yearly_399: 399,

  // Employer Plans
  monthly_499: 499,    // Starter
  quarterly_1399: 1399, // Growth
  yearly_4999: 4999    // Pro
};

const EMPLOYER_PLAN_MAP = {
  monthly_499: 'starter',
  quarterly_1399: 'growth',
  yearly_4999: 'pro'
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* =========================
   CREATE ORDER
========================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }

    const { plan } = req.body;
    const userId = req.user.id;

    if (!PLAN_AMOUNT[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = PLAN_AMOUNT[plan];

    // Create a record in 'payments' table
    const { rows } = await pool.query(
      `INSERT INTO payments (user_id, plan, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, plan, amount]
    );

    const paymentId = rows[0].id;

    // Call Razorpay API
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `rcpt_${paymentId}`
    });

    // Update DB with Razorpay Order ID
    await pool.query(
      `UPDATE payments SET razorpay_order_id=$1 WHERE id=$2`,
      [order.id, paymentId]
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ message: "Razorpay order failed" });
  }
};

/* =========================
   VERIFY PAYMENT
========================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // 1. Update Payment Status to Success
    const { rows } = await pool.query(
      `UPDATE payments
       SET razorpay_payment_id=$1, status='success', verified_at=NOW()
       WHERE razorpay_order_id=$2
       RETURNING user_id, plan`,
      [razorpay_payment_id, razorpay_order_id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const { user_id, plan } = rows[0];

    // 🔥 2. Check if this is an Employer Plan or Talent Plan
    if (EMPLOYER_PLAN_MAP[plan]) {
        // === EMPLOYER LOGIC ===
        const internalPlanName = EMPLOYER_PLAN_MAP[plan];
        
        // Duration Mapping for Employers
        const empDurationMap = {
            monthly_499: "1 month",
            quarterly_1399: "3 months",
            yearly_4999: "1 year"
        };

        // Update 'company_usage' table
        // We RESET counters (jobs, invites, searches) because they paid for a refill
        await pool.query(
            `
            INSERT INTO company_usage 
            (user_id, current_plan, jobs_posted_count, invites_used_count, searches_used_count, profiles_saved_count, plan_start_date, plan_end_date)
            VALUES ($1, $2, 0, 0, 0, 0, NOW(), NOW() + $3::interval)
            ON CONFLICT (user_id)
            DO UPDATE SET
                current_plan = EXCLUDED.current_plan,
                jobs_posted_count = 0,      -- Reset usage
                invites_used_count = 0,     -- Reset usage
                searches_used_count = 0,    -- Reset usage
                profiles_saved_count = 0,   -- Reset usage
                plan_start_date = NOW(),
                plan_end_date = NOW() + $3::interval
            `,
            [user_id, internalPlanName, empDurationMap[plan]]
        );

    } else {
        // === TALENT LOGIC (Existing) ===
        const durationMap = {
            monthly_99: "1 month",
            quarterly_149: "4 months",
            yearly_399: "1 year"
        };

        await pool.query(
            `
            INSERT INTO subscriptions (user_id, plan, status, start_date, end_date)
            VALUES ($1,$2,'active',NOW(),NOW()+$3::interval)
            ON CONFLICT (user_id)
            DO UPDATE SET
                plan=EXCLUDED.plan,
                status='active',
                start_date=NOW(),
                end_date=EXCLUDED.end_date
            `,
            [user_id, plan, durationMap[plan]]
        );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ success: false });
  }
};