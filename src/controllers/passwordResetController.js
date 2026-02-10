import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { sendPasswordOtp } from '../services/email/otp.email.js';

const OTP_EXPIRY_MINUTES = 10;

/* ===============================
   STEP 1 — SEND OTP
=============================== */
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (!user.rows.length) {
    return res.status(404).json({ message: 'Email not registered' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    `
    INSERT INTO password_otps (email, otp, expires_at)
    VALUES ($1, $2, $3)
    `,
    [email, otp, expiresAt]
  );

  await sendPasswordOtp({ email, otp });

  res.json({ message: 'OTP sent to email' });
};

/* ===============================
   STEP 2 — VERIFY OTP
=============================== */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const result = await pool.query(
    `
    SELECT * FROM password_otps
    WHERE email = $1
      AND otp = $2
      AND used = FALSE
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email, otp]
  );

  if (!result.rows.length) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  res.json({ message: 'OTP verified' });
};

/* ===============================
   STEP 3 — RESET PASSWORD
=============================== */
export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  const record = await pool.query(
    `
    SELECT * FROM password_otps
    WHERE email = $1
      AND otp = $2
      AND used = FALSE
      AND expires_at > NOW()
    `,
    [email, otp]
  );

  if (!record.rows.length) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2',
    [hashed, email]
  );

  await pool.query(
    'UPDATE password_otps SET used = TRUE WHERE id = $1',
    [record.rows[0].id]
  );

  res.json({ message: 'Password reset successful' });
};
