import { CAREER_PAGES } from "../config/careerPages.js";
import { fetchCareerPageJobs } from "./careerCrawlerService.js";
import { normalizeCareerJob } from "./careerNormalizer.js";
import { upsertAggregatedJob } from "./jobRepository.js";

export const scrapeCareerPages = async () => {
  console.log("🔄 Career Page crawling started");

  for (const company of CAREER_PAGES) {
    try {
      const jobs = await fetchCareerPageJobs(company);
      const limited = jobs.slice(0, 20);

      for (const job of limited) {
        const normalized = normalizeCareerJob(job, company);
        await upsertAggregatedJob(normalized);
      }

      console.log(`✅ Career ${company.name}: ${limited.length} jobs`);
    } catch (err) {
      console.error(`❌ Career ${company.name}`, err.message);
    }
  }
};
