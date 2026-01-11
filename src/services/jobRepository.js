import pool from '../config/database.js';

let cache = {
  data: null,
  lastFetch: 0
};

const CACHE_TTL = 30 * 1000; // 30 seconds


/* =========================
   UPSERT AGGREGATED JOB
========================= */
export const upsertAggregatedJob = async (job) => {
  const sql = `
    INSERT INTO jobs (
      title,
      description,
      location,
      job_type,
      source,
      source_job_id,
      company_name,
      company_website,
      external_url,
      status,
      created_at,
      updated_at
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,'active',NOW(),NOW()
    )
    ON CONFLICT (source_job_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      location = EXCLUDED.location,
      job_type = EXCLUDED.job_type,
      company_name = EXCLUDED.company_name,
      company_website = EXCLUDED.company_website,
      external_url = EXCLUDED.external_url,
      updated_at = NOW();
  `;

  const values = [
    job.title,
    job.description,
    job.location,
    job.job_type,
    job.source,
    job.source_job_id,
    job.company_name,
    job.company_website,
    job.external_url,
  ];

  await pool.query(sql, values);
};

/* =========================
   FEED QUERY (UNIQUE COMPANY)
========================= */
export const getFeedJobs = async () => {
  const now = Date.now();

  // ✅ return from cache
  if (cache.data && now - cache.lastFetch < CACHE_TTL) {
    return cache.data;
  }

  const sql = `
    SELECT *
    FROM (
      SELECT
        j.*,
        ROW_NUMBER() OVER (
          PARTITION BY company_name
          ORDER BY created_at DESC
        ) AS rn
      FROM jobs j
      WHERE j.status = 'active'
    ) ranked
    WHERE rn = 1
    ORDER BY
      CASE
        WHEN location ILIKE '%pune%' THEN 1
        WHEN location ILIKE '%india%' THEN 1
        WHEN location ILIKE '%bangalore%' THEN 1
        WHEN location ILIKE '%bengaluru%' THEN 1
        WHEN location ILIKE '%hyderabad%' THEN 1
        WHEN location ILIKE '%chennai%' THEN 1
        WHEN location ILIKE '%remote%' THEN 2
        ELSE 3
      END,
      created_at DESC
    LIMIT 50;
  `;

  const result = await pool.query(sql);

  // ✅ store in cache
  cache = {
    data: result.rows,
    lastFetch: now
  };

  return result.rows;
};
