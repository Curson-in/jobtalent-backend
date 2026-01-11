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
import { fetchWellfoundJobs } from "./wellfoundService.js";
import { normalizeWellfoundJob } from "./wellfoundNormalizer.js";
import { fetchSmartRecruitersJobs } from "./smartRecruitersService.js";
import { normalizeSmartRecruitersJob } from "./smartRecruitersNormalizer.js";
import { fetchWorkdayJobs } from "./workdayService.js";
import { normalizeWorkdayJob } from "./workdayNormalizer.js";
import { DARWINBOX_COMPANIES } from "../config/darwinbox.js";
import { fetchDarwinboxJobs } from "./darwinboxService.js";
import { normalizeDarwinboxJob } from "./darwinboxNormalizer.js";


import { FRESHTEAM_COMPANIES } from "../config/freshteam.js";
import { fetchFreshteamJobs } from "./freshteamService.js";
import { normalizeFreshteamJob } from "./freshteamNormalizer.js";


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

export const scrapeDarwinboxJobs = async () => {
  console.log("🔄 Darwinbox scraping started");

  for (const company of DARWINBOX_COMPANIES) {
    try {
      const jobs = await fetchDarwinboxJobs(company.api);
      const limited = jobs.slice(0, 20);

      for (const job of limited) {
        const normalized = normalizeDarwinboxJob(job, company);
        await upsertAggregatedJob(normalized);
      }

      console.log(`✅ Darwinbox ${company.name}: ${limited.length} jobs`);
    } catch (err) {
      console.error(`❌ Darwinbox ${company.name}`, err.message);
    }
  }
};

export const scrapeFreshteamJobs = async () => {
  console.log("🔄 Freshteam scraping started");

  for (const company of FRESHTEAM_COMPANIES) {
    try {
      const jobs = await fetchFreshteamJobs(company.slug);
      const limited = jobs.slice(0, 20);

      for (const job of limited) {
        const normalized = normalizeFreshteamJob(job, company);
        await upsertAggregatedJob(normalized);
      }

      console.log(`✅ Freshteam ${company.name}: ${limited.length} jobs`);
    } catch (err) {
      console.error(`❌ Freshteam ${company.name}`, err.message);
    }
  }
};

export const scrapeSmartRecruitersJobs = async () => {
  console.log("🔄 SmartRecruiters scraping started");

  const jobs = await fetchSmartRecruitersJobs();

  for (const job of jobs) {
    const normalized = normalizeSmartRecruitersJob(job);

    // India-first filtering
    if (
      normalized.country === "India" ||
      normalized.location?.toLowerCase().includes("india")
    ) {
      await upsertAggregatedJob(normalized);
    }
  }

  console.log(`✅ SmartRecruiters saved ${jobs.length} jobs`);
};

export const scrapeWorkdayJobs = async () => {
  console.log("🔄 Workday scraping started");

  const jobs = await fetchWorkdayJobs();

  for (const job of jobs) {
    const normalized = normalizeWorkdayJob(job);

    if (
      normalized.location?.toLowerCase().includes("india")
    ) {
      await upsertAggregatedJob(normalized);
    }
  }

  console.log(`✅ Workday saved ${jobs.length} jobs`);
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

export const scrapeWellfoundJobs = async () => {
  console.log("🔄 Wellfound scraping started");

  try {
    const jobs = await fetchWellfoundJobs();

    const limitedJobs = jobs.slice(0, 20); // keep it safe

    for (const job of limitedJobs) {
      const normalized = normalizeWellfoundJob(job);
      await upsertAggregatedJob(normalized);
    }

    console.log(`✅ Wellfound: ${limitedJobs.length} jobs`);
  } catch (err) {
    console.error("❌ Wellfound scrape failed:", err.message);
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
