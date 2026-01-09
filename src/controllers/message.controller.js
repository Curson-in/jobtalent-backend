import pool from "../config/database.js";

/**
 * Candidate sends ONE follow-up per job
 */




export const sendFollowUpMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { jobId, messageText } = req.body;

    const { followUpsPerMonth } = req.user.entitlements;

    // 🔒 PLAN CHECK
    if (followUpsPerMonth === 0) {
      return res.status(403).json({
        message: "Upgrade to send follow-up messages"
      });
    }

    // 🔢 MONTHLY LIMIT CHECK (if not unlimited)
    if (followUpsPerMonth !== Infinity) {
      const used = await pool.query(
        `
        SELECT COUNT(*)
        FROM messages
        WHERE sender_id = $1
          AND created_at >= date_trunc('month', NOW())
        `,
        [senderId]
      );

      if (Number(used.rows[0].count) >= followUpsPerMonth) {
        return res.status(403).json({
          message: "Follow-up limit reached for this plan"
        });
      }
    }

    if (!jobId || !messageText) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1️⃣ Ensure user applied
    const applicationCheck = await pool.query(
      `
      SELECT 1
      FROM applications
      WHERE user_id = $1 AND job_id = $2
      `,
      [senderId, jobId]
    );

    if (applicationCheck.rowCount === 0) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // 2️⃣ Prevent duplicate follow-ups
    const alreadySent = await pool.query(
      `
      SELECT id
      FROM messages
      WHERE sender_id = $1 AND job_id = $2
      `,
      [senderId, jobId]
    );

    if (alreadySent.rowCount > 0) {
      return res.status(409).json({
        message: "Follow-up already sent for this job"
      });
    }

    // 3️⃣ Job info
    const jobResult = await pool.query(
      `SELECT company_id FROM jobs WHERE id = $1`,
      [jobId]
    );

    const job = jobResult.rows[0];

    // 🔥 External job
    if (!job.company_id) {
      await pool.query(
        `
        INSERT INTO messages (sender_id, job_id, message_text, is_external)
        VALUES ($1, $2, $3, true)
        `,
        [senderId, jobId, messageText]
      );
    } else {
      // 🔥 Manual job
      const employerResult = await pool.query(
        `
        SELECT user_id
        FROM companies
        WHERE id = $1
        `,
        [job.company_id]
      );

      const receiverId = employerResult.rows[0].user_id;

      await pool.query(
        `
        INSERT INTO messages (sender_id, receiver_id, job_id, message_text)
        VALUES ($1, $2, $3, $4)
        `,
        [senderId, receiverId, jobId, messageText]
      );
    }

    await pool.query(
      `
      UPDATE applications
      SET followup_sent = true, followup_sent_at = NOW()
      WHERE user_id = $1 AND job_id = $2
      `,
      [senderId, jobId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




/**
 * Employer fetches follow-ups for a job
 */
export const getFollowUpsForJob = async (req, res) => {
  const employerId = req.user.id;
  const { jobId } = req.params;

  const result = await pool.query(
    `
    SELECT
      m.id,
      m.message_text,
      m.created_at,
      m.sender_id,
      u.first_name,
      u.last_name,
      u.email
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.job_id = $1
      AND m.receiver_id = $2
    ORDER BY m.created_at DESC
    `,
    [jobId, employerId]
  );

  res.json({ messages: result.rows });
};
