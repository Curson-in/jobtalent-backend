import pool from '../config/database.js';
import { APPLICATION_STATUS, JOB_SOURCES } from '../config/constants.js';
import axios from 'axios';


export const applyToJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    const jobResult = await pool.query(
      'SELECT * FROM jobs WHERE id = $1 AND source = $2',
      [jobId, JOB_SOURCES.DIRECT]
    );

    if (jobResult.rows.length === 0) {
      return res.status(400).json({ message: 'Cannot apply to this job' });
    }

    const existingResult = await pool.query(
      'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2',
      [userId, jobId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ message: 'Already applied to this job' });
    }

    const result = await pool.query(
      `
      INSERT INTO applications (user_id, job_id, status, source, created_at)
      VALUES ($1, $2, $3, 'direct', NOW())
      RETURNING *
      `,
      [userId, jobId, APPLICATION_STATUS.APPLIED]
    );

    res.status(201).json({
      message: 'Application submitted',
      application: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.job_id,               -- 🔥 REQUIRED
        a.status,
        a.created_at,
        j.title AS position,
        COALESCE(c.name, j.company_name) AS company
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      `,
      [userId]
    );

    res.json({ applications: result.rows });
  } catch (error) {
    next(error);
  }
};



export const getApplicationsForJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    // ✅ Authorization check
    const jobResult = await pool.query(
      `
      SELECT j.id
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1 AND c.user_id = $2
      `,
      [jobId, userId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ FETCH APPLICATIONS + RESUME
   const result = await pool.query(
  `
  SELECT 
    a.id,
    a.user_id,        -- 🔥 REQUIRED
    a.job_id,
    a.status,
    a.created_at,
    u.first_name,
    u.last_name,
    u.email,
    p.resume_file
  FROM applications a
  JOIN users u ON a.user_id = u.id
  LEFT JOIN profiles p 
    ON p.user_id = u.id 
   AND p.profile_type = 'talent'
  WHERE a.job_id = $1
  ORDER BY a.created_at DESC
  `,
  [jobId]
);


    res.json({ applications: result.rows });
  } catch (error) {
    next(error);
  }
};


export const updateApplicationStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { applicationId } = req.params;
    const { status } = req.body;

    const appResult = await pool.query(
      `
      SELECT a.*
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = $1 AND c.user_id = $2
      `,
      [applicationId, userId]
    );

    if (appResult.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `
      UPDATE applications
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, applicationId]
    );

    res.json({
      message: 'Application status updated',
      application: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// 🔥 NEW – aggregated job confirmation
export const confirmExternalApply = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.body;

    // prevent duplicates
    await pool.query(
      `
      INSERT INTO applications (user_id, job_id, status, created_at)
      VALUES ($1, $2, 'applied', NOW())
      ON CONFLICT DO NOTHING
      `,
      [userId, jobId]
    );

    res.json({ message: 'External application confirmed' });
  } catch (err) {
    next(err);
  }
};

