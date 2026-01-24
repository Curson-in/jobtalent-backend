import crypto from "crypto";
import axios from "axios";
import pool from "../config/database.js";

const PLAN_AMOUNT = {
  monthly_99: 99,
  quarterly_149: 149,
  yearly_399: 399
};

export const createCashfreeOrder = async (req, res) => {
  try {
    // ✅ HARD GUARD (THIS FIXES YOUR ERROR)
    if (!req.user) {
      return res.status(401).json({ message: "Login required to pay" });
    }

    const userId = req.user.id;
    const { plan } = req.body;

    if (!PLAN_AMOUNT[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = PLAN_AMOUNT[plan];

    const { rows } = await pool.query(
      `INSERT INTO payments (user_id, plan, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [userId, plan]
    );

    const paymentId = rows[0].id;
    const orderId = `cf_order_${paymentId}`;

    await pool.query(
      `UPDATE payments SET order_id=$1 WHERE id=$2`,
      [orderId, paymentId]
    );

    const response = await axios.post(
      `${process.env.CASHFREE_BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),
          customer_email: req.user.email,
          customer_phone: req.user.phone || "9999999999"
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}/payment/success?order_id=${orderId}`
        }
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      paymentSessionId: response.data.payment_session_id
    });
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err);
    res.status(500).json({ message: "Cashfree order failed" });
  }
};


export const verifyCashfreePayment = async (req, res) => {
  try {
    const { order_id } = req.query;

    const response = await axios.get(
      `${process.env.CASHFREE_BASE_URL}/orders/${order_id}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
          "x-api-version": "2023-08-01"
        }
      }
    );

    if (response.data.order_status !== "PAID") {
      return res.status(400).json({ success: false });
    }

    const paymentId = order_id.split("_")[2];

    const { rows } = await pool.query(
      `SELECT user_id, plan FROM payments WHERE id=$1`,
      [paymentId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false });
    }

    const { user_id, plan } = rows[0];

    // ✅ mark payment success
    await pool.query(
      `UPDATE payments SET status='success', verified_at=NOW() WHERE id=$1`,
      [paymentId]
    );

    // ✅ activate subscription
    const durationMap = {
      monthly_99: "1 month",
      quarterly_149: "4 months",
      yearly_399: "1 year"
    };

    await pool.query(
      `
      INSERT INTO subscriptions (user_id, plan, status, start_date, end_date)
      VALUES ($1, $2, 'active', NOW(), NOW() + $3::interval)
      ON CONFLICT (user_id)
      DO UPDATE SET
        plan=EXCLUDED.plan,
        status='active',
        start_date=NOW(),
        end_date=EXCLUDED.end_date
      `,
      [user_id, plan, durationMap[plan]]
    );

    // ✅ RETURN JSON (NO REDIRECT)
    return res.json({ success: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

