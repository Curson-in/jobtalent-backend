import pool from '../config/database.js';


/* =========================
   TALENT PROFILE (GET)
========================= */
export const getTalentProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    /* PROFILE */
    const profileRes = await pool.query(
      `
      SELECT
        p.*,
        json_build_object(
          'first_name', u.first_name,
          'last_name', u.last_name
        ) AS user
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1
      `,
      [userId]
    );

    if (!profileRes.rows.length) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = profileRes.rows[0];

    /* SUBSCRIPTION */
    const subRes = await pool.query(
      `
      SELECT plan, status, start_date, end_date, auto_renew
      FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND (end_date IS NULL OR end_date > NOW())
      LIMIT 1
      `,
      [userId]
    );

    profile.subscription = subRes.rows[0] || {
      plan: 'free',
      status: 'inactive'
    };

    /* BOOST */
    const boostRes = await pool.query(
      `
      SELECT expires_at
      FROM profile_boosts
      WHERE user_id = $1
        AND is_boosted = true
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
      `,
      [userId]
    );

    profile.is_boosted = !!boostRes.rows.length;
    profile.boost_expires_at = boostRes.rows[0]?.expires_at || null;

    /* SKILLS */
    const skillsRes = await pool.query(
      `SELECT skill FROM talent_skills WHERE user_id = $1`,
      [userId]
    );

    profile.skills = skillsRes.rows.map(r => r.skill);
    profile.resume = profile.resume_url;

    return res.json({ profile });
  } catch (err) {
    next(err);
  }
};


/* =========================
   TALENT PROFILE (UPDATE)
========================= */
/* =========================
   TALENT PROFILE (UPDATE)
========================= */
export const updateTalentProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
  desired_role,
  city,
  experience,
  education,
  summary,
  projects,
  experience_details,
  skills,
  linkedin_url,
  github_url,
  portfolio_url
} = req.body;


   await pool.query(
  `
  UPDATE profiles SET
    desired_role = $1,
    city = $2,
    experience = $3,
    education = $4,
    summary = $5,
    projects = $6,
    experience_details = $7,
    linkedin_url = $8,
    github_url = $9,
    portfolio_url = $10,
    updated_at = NOW()
  WHERE user_id = $11
  `,
  [
    desired_role,
    city,
    experience,
    education,
    summary,
    projects,
    experience_details,
    linkedin_url,
    github_url,
    portfolio_url,
    userId
  ]
);


    if (skills && Array.isArray(skills)) {
      await query('DELETE FROM talent_skills WHERE user_id = $1', [userId]);

      for (const skill of skills) {
        if (!skill) continue;
        await pool.query(
          'INSERT INTO talent_skills (user_id, skill, verified) VALUES ($1, $2, false)',
          [userId, skill]
        );
      }
    }

    const updatedProfile = await pool.query(
  `
  SELECT 
  p.*,
  s.status AS subscription_status,
  s.end_date AS subscription_end
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.user_id
WHERE p.user_id = $1;
  `,
  [userId]
);

const profile = updatedProfile.rows[0];

if (
  profile.subscription_status !== "active" ||
  !profile.boost_expires_at ||
  new Date(profile.boost_expires_at) < new Date()
) {
  profile.is_boosted = false;
  profile.boost_expires_at = null;
}

res.json({ profile });

  } catch (err) {
    console.error('❌ updateTalentProfile failed:', err);
    next(err);
  }
};

/* =========================
   TALENT PROFILE (CREATE / ONBOARD)
========================= */
export const createTalentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      city = null,
      desired_role = null,
      experience = null,
      education = null,
      summary = null,
      projects = null,
      experience_details = null,
      skills = []
    } = req.body;

    const resumeUrl = req.file?.path || null;

    const profileResult = await pool.query(
      `
      INSERT INTO profiles (
        user_id,
        profile_type,
        city,
        desired_role,
        experience,
        education,
        summary,
        projects,
        experience_details,
        resume_url,
        updated_at
      )
      VALUES ($1, 'talent', $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        city = EXCLUDED.city,
        desired_role = EXCLUDED.desired_role,
        experience = EXCLUDED.experience,
        education = EXCLUDED.education,
        summary = EXCLUDED.summary,
        projects = EXCLUDED.projects,
        experience_details = EXCLUDED.experience_details,
        resume_url = COALESCE(EXCLUDED.resume_url, profiles.resume_url),
        updated_at = NOW()
      RETURNING *;
      `,
      [
        userId,
        city,
        desired_role,
        experience,
        education,
        summary,
        projects,
        experience_details,
        resumeUrl
      ]
    );

    // Insert skills
    if (Array.isArray(skills) && skills.length) {
      await query('DELETE FROM talent_skills WHERE user_id = $1', [userId]);

      for (const skill of skills) {
        await pool.query(
          'INSERT INTO talent_skills (user_id, skill, verified) VALUES ($1, $2, false)',
          [userId, skill]
        );
      }
    }

    await pool.query(
      'UPDATE users SET is_onboarded = TRUE WHERE id = $1',
      [userId]
    );

    res.status(200).json({
      profile: {
        ...profileResult.rows[0],
        resume: profileResult.rows[0].resume_url
      }
    });
  } catch (error) {
    console.error('❌ Talent onboarding failed:', error);
    res.status(500).json({ message: 'Failed to complete onboarding' });
  }
};

/* =========================
   UPLOAD PROFILE PHOTO
========================= */
export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const photoUrl = req.file?.path;

    if (!photoUrl) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    await pool.query(
      'UPDATE profiles SET profile_picture_url = $1, updated_at = NOW() WHERE user_id = $2',
      [photoUrl, userId]
    );

    res.json({
      message: 'Profile photo updated',
      profile_picture_url: photoUrl
    });
  } catch (error) {
    console.error('❌ Photo upload failed:', error);
    res.status(500).json({ message: 'Photo upload failed' });
  }
};

/* =========================
   UPLOAD RESUME
========================= */
export const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeUrl = req.file?.path;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'No resume uploaded' });
    }

    const result = await pool.query(
      `
      UPDATE profiles
      SET resume_url = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING resume_url
      `,
      [resumeUrl, userId]
    );

    res.json({
      resume: result.rows[0].resume_url
    });
  } catch (error) {
    console.error('❌ Resume upload failed:', error);
    res.status(500).json({ message: 'Resume upload failed' });
  }
};



export const getCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      name,
      website,
      description,
      industry,
      size,
      location,
      logo_url // 🔥 ADD THIS
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO companies (
        user_id,
        name,
        website,
        description,
        industry,
        company_size,
        location,
        logo_url,
        verified,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,NOW())
      RETURNING *
      `,
      [
        userId,
        name,
        website,
        description || null,
        industry || null,
        size || null,
        location || null,
        logo_url || null
      ]
    );

    res.status(201).json({
      message: 'Company profile created',
      company: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};


export const updateCompanyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, website, description, industry, size, location } = req.body;
    
    const result = await pool.query(
      'UPDATE companies SET name = $1, website = $2, description = $3, industry = $4, company_size = $5, location = $6, updated_at = NOW() WHERE user_id = $7 RETURNING *',
      [name, website, description, industry, size, location, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Company updated successfully',
      company: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};


export const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;

    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'company-logos',
        transformation: [{ width: 300, height: 300, crop: 'limit' }]
      }
    );

    const logoUrl = uploadResult.secure_url;

    await pool.query(
      `UPDATE companies SET logo_url = $1 WHERE user_id = $2`,
      [logoUrl, userId]
    );

    res.json({ url: logoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Logo upload failed' });
  }
};

