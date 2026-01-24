import cron from 'node-cron';
import { scrapeJobs,scrapeInternshalaJobs, scrapeLinkedInJobs, scrapeDarwinboxJobs,scrapeFreshteamJobs, scrapeSmartRecruitersJobs, scrapeWorkdayJobs, scrapeWellfoundJobs, scrapeLeverJobs, expireStaleJobs, } from '../services/jobScraperService.js';
import { scrapeCareerPages } from "../services/careerScraper.js";

const shouldRunLinkedIn = () => {
  const day = new Date().getDay(); // 0 = Sunday
  return day === 0; // once per week
};


export const startJobScraperWorker = () => {
  if (process.env.SCRAPER_ENABLED === 'true') {

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

    // ✅ LinkedIn ONLY if allowed
    if (shouldRunLinkedIn()) {
      scrapeLinkedInJobs();
    }

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

      // ✅ LinkedIn once per week
      if (shouldRunLinkedIn()) {
        await scrapeLinkedInJobs();
      }

    });

    console.log('✅ Job scraper worker started');
  }
};

