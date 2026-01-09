import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { PLAN_ENTITLEMENTS } from "../config/planEntitlements.js";

/* =========================
   REQUIRED AUTH
========================= */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // 1️⃣ Fetch user
    const userResult = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // 2️⃣ Fetch ACTIVE subscription
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

    // 3️⃣ Attach entitlements
    req.user = {
      ...user,
      subscriptionPlan: plan,
      entitlements: PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   ROLE GUARD
========================= */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

/* =========================
   OPTIONAL AUTH
   (used by jobs list, dashboard, etc.)
========================= */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const token = authHeader.split(" ")[1];
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
  } catch (err) {
    // silent by design
  }

  next();
};
