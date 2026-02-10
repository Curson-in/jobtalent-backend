import pool from '../config/database.js';
import { sendCandidateInvite } from '../services/email/invite.service.js';

/**
 * Get Dashboard Usage Stats
 */
export const getPlanUsage = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM company_usage WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Usage Fetch Error:", err);
    res.status(500).json({ message: "Error fetching plan usage" });
  }
};


/**
 * Search Candidates
 * Searches by name, headline and skills
 */
export const searchCandidates = async (req, res) => {
  const userId = req.user.id;
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.json({ candidates: [], masked: false });
  }

  try {
    // 1️⃣ Get usage
    const usageRes = await pool.query(
      `SELECT searches_used_count, current_plan 
       FROM company_usage 
       WHERE user_id = $1`,
      [userId]
    );

    const usage = usageRes.rows[0] || {
       searches_used_count: 0,
       current_plan: "free_trial",
    };

    // 2️⃣ Plan limits
    let limit = 5;
    if (usage.current_plan === "starter") limit = 10;
    if (usage.current_plan === "growth") limit = 30;
    if (usage.current_plan === "pro") limit = 100;

    const isLimitReached = usage.searches_used_count >= limit;

    // 3️⃣ Candidate search
    const sql = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        p.desired_role,
        p.experience,
        p.profile_picture_url,
        p.resume_file,
        COALESCE(
          ARRAY_AGG(ts.skill) FILTER (WHERE ts.skill IS NOT NULL),
          '{}'
        ) AS skills,
        
        -- 🔥 CHECK IF ALREADY INVITED
        EXISTS(
          SELECT 1 FROM messages m 
          WHERE m.receiver_id = u.id AND m.sender_id = $1 AND m.is_invite = true
        ) as has_invited

      FROM users u
      JOIN profiles p ON u.id = p.user_id
      LEFT JOIN talent_skills ts ON ts.user_id = u.id
      WHERE u.role = 'talent'
      AND (
        u.first_name ILIKE $2 OR
        u.last_name ILIKE $2 OR
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $2 OR
        p.desired_role ILIKE $2 OR
        ts.skill ILIKE $2
      )
      GROUP BY u.id, p.id
      LIMIT 20
    `;

    // Note: $1 is userId, $2 is the search query
    const candidates = await pool.query(sql, [userId, `%${query}%`]);

    // 4️⃣ Mask Data if limit reached
    const mappedCandidates = candidates.rows.map(c => {
        if (isLimitReached) {
            return { ...c, resume_file: null, last_name: c.last_name[0] + '.' }; // Hide resume & name
        }
        return c;
    });

    // 5️⃣ Increment usage only if allowed
    if (!isLimitReached && candidates.rows.length > 0) {
      await pool.query(
        `INSERT INTO company_usage (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      await pool.query(
        `UPDATE company_usage SET searches_used_count = searches_used_count + 1 WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({
      candidates: mappedCandidates,
      masked: isLimitReached,
    });

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};


/**
 * Save Candidate Profile
 */
export const saveCandidate = async (req, res) => {
  const userId = req.user.id;
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ message: "Candidate ID required" });
  }

  try {
    await pool.query(
      `INSERT INTO saved_candidates (employer_id, candidate_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, candidateId]
    );

    await pool.query(
      `UPDATE company_usage
       SET profiles_saved_count = profiles_saved_count + 1
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ message: "Candidate saved" });

  } catch (err) {
    console.error("Save Candidate Error:", err);
    res.status(400).json({
      message: "Could not save candidate",
    });
  }
};

/**
 * Get Saved Candidates (Shortlist)
 */
export const getSavedCandidates = async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await pool.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, 
               p.desired_role, p.experience, p.resume_file, p.profile_picture_url,
               COALESCE(ARRAY_AGG(ts.skill) FILTER (WHERE ts.skill IS NOT NULL), '{}') AS skills,
               
               -- 🔥 CHECK INVITE STATUS
               EXISTS(
                 SELECT 1 FROM messages m 
                 WHERE m.receiver_id = u.id AND m.sender_id = $1 AND m.is_invite = true
               ) as has_invited

        FROM saved_candidates sc
        JOIN users u ON sc.candidate_id = u.id
        JOIN profiles p ON u.id = p.user_id
        LEFT JOIN talent_skills ts ON ts.user_id = u.id
        WHERE sc.employer_id = $1
        GROUP BY u.id, p.id, sc.created_at
        ORDER BY sc.created_at DESC
      `, [userId]);
  
      res.json({ candidates: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch saved candidates' });
    }
};

/**
 * Invite Candidate (Send Email + Check Quota)
 */
export const inviteCandidate = async (req, res) => {
  const userId = req.user.id;
  const { candidateId } = req.body;

  try {
    // 1️⃣ Get Plan & Usage
    const usageRes = await pool.query(`SELECT invites_used_count, current_plan FROM company_usage WHERE user_id = $1`, [userId]);
    const usage = usageRes.rows[0] || { invites_used_count: 0, current_plan: 'free_trial' };

    // 2️⃣ Check Limits
    let limit = 5; // Free default
    if (usage.current_plan === 'starter') limit = 5;
    if (usage.current_plan === 'growth') limit = 15;
    if (usage.current_plan === 'pro') limit = 60;

    if (usage.invites_used_count >= limit) {
      return res.status(403).json({ error: 'LIMIT_REACHED', message: "Invite limit reached. Please upgrade." });
    }

    // 3️⃣ Get Candidate, Company & Employer Info
    // 🔥 Added: Fetch the employer's email to set as Reply-To
    const candidateRes = await pool.query(`SELECT email, first_name FROM users WHERE id = $1`, [candidateId]);
    const companyRes = await pool.query(`SELECT name FROM companies WHERE user_id = $1`, [userId]);
    const employerRes = await pool.query(`SELECT email FROM users WHERE id = $1`, [userId]); // Query current user email
    
    if (!candidateRes.rows.length) return res.status(404).json({ message: "Candidate not found" });
    
    const candidate = candidateRes.rows[0];
    const companyName = companyRes.rows[0]?.name || "A Company";
    const employerEmail = employerRes.rows[0]?.email; // Store the email

    if (!employerEmail) return res.status(500).json({ message: "Employer email not found" });

    // 4️⃣ Send Email (Pass employerEmail as the 4th argument)
    const emailSent = await sendCandidateInvite(
        candidate.email, 
        candidate.first_name, 
        companyName, 
        employerEmail // 👈 Passing the recruiter email here
    );

    if (!emailSent) {
        throw new Error("Email service failed");
    }

    // 5️⃣ Log Message & Update Quota
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text, is_invite, created_at) VALUES ($1, $2, $3, true, NOW())`,
      [userId, candidateId, `You have been invited to apply at ${companyName}`]
    );

    await pool.query(
      `UPDATE company_usage SET invites_used_count = invites_used_count + 1 WHERE user_id = $1`,
      [userId]
    );

    res.json({ message: "Invitation sent successfully!" });

  } catch (err) {
    console.error("Invite Error:", err);
    res.status(500).json({ message: "Failed to send invitation" });
  }
};