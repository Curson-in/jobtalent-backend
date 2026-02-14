import pool from '../config/database.js';
import { JOB_SOURCES } from '../config/constants.js';
import { getFeedJobs as fetchFeedJobs } from '../services/jobRepository.js';
import { calculateJobMatch } from '../services/jobMatchService.js';

/* =========================
   JOB TYPE NORMALIZATION
========================= */
const JOB_TYPE_MAP = {
  'full-time': ['regular', 'full time', 'permanent', 'full-time'],
  'internship': ['intern', 'internship'],
  'contract': ['contract'],
  'part-time': ['part time', 'part-time']
};

export const createJob = async (req, res, next) => {
  const client = await pool.connect(); // 🔥 Use Client for Transaction
  
  try {
    const { title, description, location, salary, skills, jobType } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN'); // Start Transaction

    // 1️⃣ Check Company Profile
    const companyResult = await client.query(
      'SELECT id FROM companies WHERE user_id = $1',
      [userId]
    );

    if (companyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Company profile not set up' });
    }
    const companyId = companyResult.rows[0].id;

    // 2️⃣ Check Plan Limits (Gatekeeper)
    const usageRes = await client.query(
      `SELECT jobs_posted_count, current_plan FROM company_usage WHERE user_id = $1`, 
      [userId]
    );
    const usage = usageRes.rows[0] || { jobs_posted_count: 0, current_plan: 'free_trial' };

    // Define Limits
    let limit = 0; // Free Trial
    if (usage.current_plan === 'starter') limit = 3;
    if (usage.current_plan === 'growth') limit = 10;
    if (usage.current_plan === 'pro') limit = 9999; // Unlimited

    if (usage.jobs_posted_count >= limit) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        message: `Job posting limit reached (${usage.jobs_posted_count}/${limit}). Please upgrade your plan.` 
      });
    }

    // 3️⃣ Insert Job
    const result = await client.query(
      `
      INSERT INTO jobs (
        company_id, title, description, location, salary, job_type, source, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
      `,
      [
        companyId, title, description, location, salary, jobType,
        JOB_SOURCES.DIRECT, 'active'
      ]
    );

    const jobId = result.rows[0].id;

    // 4️⃣ Insert Skills
    if (skills?.length) {
      for (const skill of skills) {
        await client.query(
          'INSERT INTO job_skills (job_id, skill) VALUES ($1, $2)',
          [jobId, skill]
        );
      }
    }

    // 5️⃣ Increment Usage Count
    await client.query(
      `INSERT INTO company_usage (user_id, jobs_posted_count) 
       VALUES ($1, 1) 
       ON CONFLICT (user_id) 
       DO UPDATE SET jobs_posted_count = company_usage.jobs_posted_count + 1`,
      [userId]
    );

    await client.query('COMMIT'); // Commit Transaction

    res.status(201).json({ job: result.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback on error
    next(err);
  } finally {
    client.release(); // Release client back to pool
  }
};

export const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, salary, jobType, skills } = req.body;
  const userId = req.user.id; 

  const client = await pool.connect(); // Use a client for transaction

  try {
    await client.query('BEGIN');

    // 1. Verify Ownership (Security Check)
    const check = await client.query(
      `SELECT j.id 
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: "Not authorized to edit this job" });
    }

    // 2. Update Basic Info
    const result = await client.query(
      `UPDATE jobs 
       SET title = $1, description = $2, location = $3, salary = $4, job_type = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, location, salary, jobType, id]
    );

    // 3. Update Skills (Delete Old -> Insert New)
    if (skills && Array.isArray(skills)) {
      // First, remove existing skills for this job
      await client.query('DELETE FROM job_skills WHERE job_id = $1', [id]);
      
      // Then, insert the new set of skills
      for (const skill of skills) {
        await client.query(
          'INSERT INTO job_skills (job_id, skill) VALUES ($1, $2)',
          [id, skill.trim()] // Ensure we trim whitespace
        );
      }
    }

    await client.query('COMMIT');

    // Return the updated job with the new skills attached
    const updatedJob = result.rows[0];
    updatedJob.skills = skills; 

    res.status(200).json({ message: "Job updated successfully", job: updatedJob });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error updating job" });
  } finally {
    client.release();
  }
};

export const getFeedJobs = async (req, res, next) => {
  try {
    const jobs = await fetchFeedJobs();
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};

/* =========================
   JOB LIST + FILTERS
========================= */
/* =========================
   JOB LIST + FILTERS
========================= */
export const getJobs = async (req, res) => {
  const userId = req.user?.id || null;

  const {
    page = 1,
    limit = 20,
    search,
    jobType,
    location,
    datePosted
  } = req.query;

  const values = [];
  let where = `WHERE j.status = 'active'`;

  /* 🔍 SEARCH */
  if (search) {
    values.push(`%${search}%`);
    where += `
      AND (
        j.title ILIKE $${values.length} 
        OR j.company_name ILIKE $${values.length}
        OR j.location ILIKE $${values.length}
      )
    `;
  }

  /* ✅ JOB TYPE */
  const requestedTypes = Array.isArray(jobType)
    ? jobType
    : jobType ? [jobType] : [];

  if (requestedTypes.length) {
    const mappedTypes = requestedTypes.flatMap(t => JOB_TYPE_MAP[t] || []);
    if (mappedTypes.length) {
      values.push(mappedTypes.map(t => t.toLowerCase()));
      where += ` AND LOWER(j.job_type) = ANY($${values.length})`;
    }
  }

  /* ✅ LOCATION */
  const locations = Array.isArray(location)
    ? location
    : location ? [location] : [];

  if (locations.length) {
    const clauses = [];
    locations.forEach(loc => {
      if (loc === 'Remote') clauses.push(`j.location ILIKE '%remote%'`);
      if (loc === 'On-site') clauses.push(`j.location NOT ILIKE '%remote%'`);
      if (loc === 'Hybrid') clauses.push(`j.location ILIKE '%hybrid%'`);
    });
    if (clauses.length) {
      where += ` AND (${clauses.join(' OR ')})`;
    }
  }

  /* ✅ DATE POSTED */
  if (datePosted && datePosted !== 'all') {
    const map = { '24h': '1 day', '7d': '7 days', '30d': '30 days' };
    if (map[datePosted]) {
      where += ` AND j.created_at >= NOW() - INTERVAL '${map[datePosted]}'`;
    }
  }

  /* ✅ EXCLUDE APPLIED JOBS (PER USER ONLY) */
  if (userId) {
    values.push(userId);
    where += `
      AND NOT EXISTS (
        SELECT 1 
        FROM applications a 
        WHERE a.job_id = j.id 
        AND a.user_id = $${values.length}
      )
    `;
  }

  /* ✅ PAGINATION */
  values.push(limit);
  values.push((page - 1) * limit);

  const sql = `
  SELECT *
  FROM (
    SELECT 
      j.id,
      j.title, 
      j.description, 
      j.location, 
      j.salary, 
      j.job_type, 
      j.source,
      j.external_url, 
      j.status, 
      j.created_at, 
      COALESCE(j.company_name, c.name) AS company_name, 
      c.logo_url AS company_logo,
      ROW_NUMBER() OVER (
        PARTITION BY COALESCE(j.company_name, c.name) 
        ORDER BY j.created_at DESC
      ) AS company_rank
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    ${where}
  ) ranked
  ORDER BY 
    /* 🚀 PRIORITIZE INTERNSHIPS HERE */
    CASE 
      WHEN LOWER(ranked.job_type) = 'internship' THEN 0 
      WHEN ranked.title ILIKE '%intern%' THEN 0
      ELSE 1 
    END ASC,
    ranked.company_rank ASC, 
    ranked.created_at DESC
  LIMIT $${values.length - 1} 
  OFFSET $${values.length}
`;

  const result = await pool.query(sql, values);
  res.json({ jobs: result.rows });
};


export const getEmployerJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Get Company ID
    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE user_id = $1',
      [userId]
    );

    if (!companyResult.rows.length) {
      return res.json({ jobs: [] });
    }

    const companyId = companyResult.rows[0].id;

    // 2. Fetch Jobs WITH Skills using array_agg
    const jobsResult = await pool.query(
      `
      SELECT j.*, 
             COALESCE(
               (SELECT array_agg(skill) FROM job_skills WHERE job_id = j.id), 
               '{}'
             ) AS skills
      FROM jobs j
      WHERE j.company_id = $1
      AND j.status = 'active'
      ORDER BY j.created_at DESC
      `,
      [companyId]
    );

    res.json({ jobs: jobsResult.rows });
  } catch (err) {
    console.error("Error fetching employer jobs:", err);
    next(err);
  }
};


/* =========================
   JOB DETAIL
========================= */
export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT j.*, c.name AS company_name, c.logo_url, c.website
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const skills = await pool.query(
      'SELECT skill FROM job_skills WHERE job_id = $1',
      [id]
    );

    const job = result.rows[0];
    job.skills = skills.rows.map(r => r.skill);

    res.json({ job });
  } catch (err) {
    next(err);
  }
};

/* =========================
   DELETE JOB
========================= */
export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const check = await pool.query(
      `
      SELECT j.id
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1 AND c.user_id = $2
      `,
      [id, userId]
    );

    if (!check.rows.length) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query(
      `UPDATE jobs SET status = 'inactive' WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
};
/* =========================
   JOB MATCH SCORE (PREMIUM)
========================= */
export const getJobMatchScore = async (req, res) => {
  // 🔒 PLAN CHECK
  if (!req.user.entitlements.jobMatch) {
    return res.status(403).json({
      message: "Upgrade to unlock job match score"
    });
  }

  const userId = req.user.id;
  const { jobId } = req.params;

  const jobRes = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!jobRes.rows.length) {
    return res.status(404).json({ message: "Job not found" });
  }

  const jobSkillsRes = await pool.query(
    `SELECT skill FROM job_skills WHERE job_id = $1`,
    [jobId]
  );

  const profileRes = await pool.query(
    `SELECT * FROM profiles WHERE user_id = $1`,
    [userId]
  );

  const result = calculateJobMatch({
    job: jobRes.rows[0],
    jobSkills: jobSkillsRes.rows.map(r => r.skill),
    profile: profileRes.rows[0] || {}
  });

  res.json(result);
};
