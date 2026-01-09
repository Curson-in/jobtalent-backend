import { GREENHOUSE_COMPANIES } from '../config/greenhouse.js';
import { JOB_SOURCES } from '../config/constants.js';
import { fetchGreenhouseJobs } from './greenhouseService.js';
import { normalizeGreenhouseJob } from './jobNormalizer.js';
import { upsertAggregatedJob } from './jobRepository.js';
import pool from '../config/database.js';
import { LEVER_COMPANIES } from '../config/lever.js';
import { fetchLeverJobs } from './leverService.js';
import { normalizeLeverJob } from './leverNormalizer.js';
import { fetchGreenhouseJobDetail } from './greenhouseService.js';


export const scrapeJobs = async () => {
  console.log('🔄 Greenhouse scraping started');

  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const jobs = await fetchGreenhouseJobs(company.boardToken);

      const limitedJobs = jobs.slice(0, 10);

      for (const ghJob of limitedJobs) {
        const exists = await pool.query(
          `SELECT id FROM jobs WHERE apply_url = $1`,
          [ghJob.absolute_url]
        );

        if (exists.rows.length > 0) continue;

        const detail = await fetchGreenhouseJobDetail(
          company.boardToken,
          ghJob.id
        );

        const job = normalizeGreenhouseJob(
          {
            ...ghJob,
            content: detail.content,
            absolute_url: detail.absolute_url,
          },
          company
        );

        await upsertAggregatedJob(job);
      }

      console.log(` ${company.name}: ${limitedJobs.length} jobs`);
    } catch (err) {
      console.error(` ${company.name}`, err.message);
    }
  }
};


export const scrapeLeverJobs = async () => {
  console.log('🔄 Lever scraping started');

  for (const company of LEVER_COMPANIES) {
    try {
      const jobs = await fetchLeverJobs(company.slug);

      for (const job of jobs) {
        const normalized = normalizeLeverJob(job, company);
        await upsertAggregatedJob(normalized);
      }

      console.log(`✅ ${company.name}: ${jobs.length} jobs`);
    } catch (err) {
      console.error(`❌ ${company.name}`, err.message);
    }
  }
};

export const expireStaleJobs = async () => {
  await pool.query(
    `
    UPDATE jobs
    SET status = 'inactive'
    WHERE source = $1
      AND updated_at < NOW() - INTERVAL '7 days'
    `,
    [JOB_SOURCES.AGGREGATED]
  );
};
