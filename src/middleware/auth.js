import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { PLAN_ENTITLEMENTS } from "../config/planEntitlements.js";

/* =========================
   REQUIRED AUTH
========================= */
export const authMiddleware = async (req, res, next) => {
  try {
    // ✅ READ TOKEN FROM COOKIE
    const token =
      req.cookies?.token ||
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const userResult = await pool.query(
      `SELECT * FROM users WHERE id=$1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const subResult = await pool.query(
      `
      SELECT plan FROM subscriptions
      WHERE user_id=$1
        AND status='active'
        AND end_date > NOW()
      ORDER BY end_date DESC
      LIMIT 1
      `,
      [userId]
    );

    const plan = subResult.rows[0]?.plan || "free";

    req.user = {
      ...userResult.rows[0],
      subscriptionPlan: plan,
      entitlements: PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   ROLE GUARD
========================= */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

/* =========================
   OPTIONAL AUTH
========================= */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId) return next();

    const userResult = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) return next();

    const user = userResult.rows[0];

    const subResult = await pool.query(
      `
      SELECT plan
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND end_date > NOW()
      ORDER BY end_date DESC
      LIMIT 1
      `,
      [userId]
    );

    const plan = subResult.rows[0]?.plan || "free";

    req.user = {
      ...user,
      subscriptionPlan: plan,
      entitlements: PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free
    };
  } catch {
    // silent by design
  }

  next();
};
