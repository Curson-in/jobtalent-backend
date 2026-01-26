import cron from 'node-cron';
import {
  scrapeJobs,
  scrapeAshbyJobs,
 
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
  // IST = UTC + 5:30
  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const day = istTime.getDay(); // 0 = Sunday (IST)
  return day === 0;
};


export const startJobScraperWorker = () => {
  if (process.env.SCRAPER_ENABLED !== 'true') return;

  // 🔹 Startup scrape (NO LinkedIn here)
  scrapeJobs();
  scrapeAshbyJobs();

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
   
    await scrapeCareerPages();
    await scrapeAshbyJobs();
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
