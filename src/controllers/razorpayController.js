import Razorpay from "razorpay";
import crypto from "crypto";
import pool from "../config/database.js";

const PLAN_AMOUNT = {
  monthly_99: 99,
  quarterly_149: 149,
  yearly_399: 399
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

    const { rows } = await pool.query(
      `INSERT INTO payments (user_id, plan, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, plan, amount]
    );

    const paymentId = rows[0].id;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${paymentId}`
    });

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
    console.error(err);
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
      return res.status(400).json({ success: false });
    }

    const { rows } = await pool.query(
      `UPDATE payments
       SET razorpay_payment_id=$1, status='success', verified_at=NOW()
       WHERE razorpay_order_id=$2
       RETURNING user_id, plan`,
      [razorpay_payment_id, razorpay_order_id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false });
    }

    const { user_id, plan } = rows[0];

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

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
