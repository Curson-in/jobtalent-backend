import pool from '../config/database.js';

export const saveEmployerProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    website,
    description,
    industry,
    company_size,
    location,
    logo_url
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO companies (user_id, name, website, description, industry, company_size, location, logo_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (user_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        website = EXCLUDED.website,
        description = EXCLUDED.description,
        industry = EXCLUDED.industry,
        company_size = EXCLUDED.company_size,
        location = EXCLUDED.location,
        logo_url = EXCLUDED.logo_url,
        updated_at = NOW()
      RETURNING *;
      `,
      [
        userId,
        name,
        website,
        description,
        industry,
        company_size,
        location,
        logo_url
      ]
    );

    res.json({
      data: result.rows[0]   // 🔥 THIS IS CRITICAL
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save employer profile' });
  }
};

export const getEmployerProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM companies WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ data: null });
    }

    res.json({
      data: result.rows[0]   // 🔥 THIS IS WHAT FRONTEND NEEDS
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employer profile' });
  }
};

// employerController.js (or similar)
export const updateEmployerProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    website,
    industry,
    company_size,
    location,
    description,
    logo_url // 🔥 REQUIRED
  } = req.body;

  const result = await pool.query(
    `
    UPDATE companies
    SET
      name = $1,
      website = $2,
      industry = $3,
      company_size = $4,
      location = $5,
      description = $6,
      logo_url = $7,
      updated_at = NOW()
    WHERE user_id = $8
    RETURNING *
    `,
    [
      name,
      website,
      industry,
      company_size,
      location,
      description || null,
      logo_url || null,
      userId
    ]
  );

  res.json(result.rows[0]);
};

