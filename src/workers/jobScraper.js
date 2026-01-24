import cron from 'node-cron';
import {
  scrapeJobs,
  scrapeInternshalaJobs,
  scrapeLinkedInJobs,
  scrapeDarwinboxJobs,
  scrapeFreshteamJobs,
  scrapeSmartRecruitersJobs,
  scrapeWorkdayJobs,
  scrapeWellfoundJobs,
  scrapeLeverJobs,
  expireStaleJobs,
} from '../services/jobScraperService.js';
import { scrapeCareerPages } from "../services/careerScraper.js";

const shouldRunLinkedIn = () => {
  const day = new Date().getDay(); // 0 = Sunday
  return day === 0;
};

export const startJobScraperWorker = () => {
  if (process.env.SCRAPER_ENABLED !== 'true') return;

  // 🔹 Startup scrape (NO LinkedIn here)
  scrapeJobs();
  scrapeInternshalaJobs();
  scrapeCareerPages();
  scrapeDarwinboxJobs();
  scrapeFreshteamJobs();
  scrapeSmartRecruitersJobs();
  scrapeWorkdayJobs();
  scrapeLeverJobs();
  scrapeWellfoundJobs();
  expireStaleJobs();

  // ⏰ Hourly cron
  cron.schedule('0 * * * *', async () => {
    await scrapeJobs();
    await scrapeInternshalaJobs();
    await scrapeCareerPages();
    await scrapeDarwinboxJobs();
    await scrapeFreshteamJobs();
    await scrapeSmartRecruitersJobs();
    await scrapeWorkdayJobs();
    await scrapeLeverJobs();
    await scrapeWellfoundJobs();
    await expireStaleJobs();

    // ✅ LinkedIn ONLY once per week
    if (shouldRunLinkedIn()) {
      console.log('🟦 Weekly LinkedIn scrape running');
      await scrapeLinkedInJobs();
    }
  });

  console.log('✅ Job scraper worker started');
};
