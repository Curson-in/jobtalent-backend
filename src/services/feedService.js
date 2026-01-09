import pool from '../config/database.js';

export const getJobs = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    jobType,
    location,
    datePosted
  } = req.query;

  const values = [];
  let where = `WHERE status = 'active'`;

  if (search) {
    values.push(`%${search}%`);
    where += `
      AND (
        title ILIKE $${values.length}
        OR company_name ILIKE $${values.length}
        OR location ILIKE $${values.length}
      )
    `;
  }

  if (jobType) {
    values.push(jobType);
    where += ` AND job_type = ANY($${values.length})`;
  }

  if (location) {
    where += ` AND location ILIKE '%${location}%'`;
  }

  if (datePosted) {
    const map = { '24h': '1 day', '7d': '7 days', '30d': '30 days' };
    if (map[datePosted]) {
      where += ` AND created_at >= NOW() - INTERVAL '${map[datePosted]}'`;
    }
  }

  values.push(limit);
  values.push((page - 1) * limit);

  const sql = `
    SELECT *
    FROM jobs
    ${where}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
  `;

  const result = await query(sql, values);
  res.json({ jobs: result.rows });
};





export const getRecommendedJobs = async (userId) => {
  try {
    const profileResult = await pool.query(
      'SELECT skills, city FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return [];
    }

    const { skills = [], city } = profileResult.rows[0];

    // Fallback feed if no skills
    if (!skills.length) {
      return getFeedJobs();
    }

    const sql = `
      SELECT DISTINCT j.*
      FROM jobs j
      LEFT JOIN job_skills js ON js.job_id = j.id
      WHERE j.status = 'active'
        AND (
          js.skill = ANY($1)
          OR j.location ILIKE $2
        )
      ORDER BY j.created_at DESC
      LIMIT 50
    `;

    const result = await query(sql, [
      skills,
      city ? `%${city}%` : '%'
    ]);

    return result.rows;
  } catch (error) {
    console.error('Recommendation error:', error);
    throw error;
  }
};

