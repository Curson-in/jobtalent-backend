import pool from "../config/database.js";

import { sendEmail } from '../services/email/email.service.js';

// Generate 6-digit random code
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOnboardingOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 1. Save to DB (Clear old OTPs for this email first)
    await pool.query('DELETE FROM verification_otps WHERE email = $1', [email]);
    await pool.query(
      'INSERT INTO verification_otps (email, otp_code, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // 2. Send Email
    await sendEmail({
      to: email,
      subject: 'Curson Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Verify your Company Email</h2>
          <p>Use the code below to verify your employer account:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOnboardingOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM verification_otps WHERE email = $1 AND otp_code = $2',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const record = result.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Optional: Delete OTP after successful use
    await pool.query('DELETE FROM verification_otps WHERE id = $1', [record.id]);

    res.json({ success: true, message: "Email verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
};