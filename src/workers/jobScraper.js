import cron from 'node-cron';
import { scrapeJobs, scrapeDarwinboxJobs,scrapeFreshteamJobs, scrapeSmartRecruitersJobs, scrapeWorkdayJobs, scrapeWellfoundJobs, scrapeLeverJobs, expireStaleJobs, } from '../services/jobScraperService.js';
import { scrapeCareerPages } from "../services/careerScraper.js";



export const startJobScraperWorker = () => {
  if (process.env.SCRAPER_ENABLED === 'true') {
    scrapeJobs();
    scrapeCareerPages();
    scrapeDarwinboxJobs();
    scrapeFreshteamJobs();
    scrapeSmartRecruitersJobs();
    scrapeWorkdayJobs();
    scrapeLeverJobs();
    scrapeWellfoundJobs;
    expireStaleJobs();
    

    cron.schedule('0 * * * *', async () => {
      await scrapeJobs();
      await scrapeCareerPages();
      await scrapeDarwinboxJobs();
      await scrapeFreshteamJobs();
      await scrapeSmartRecruitersJobs();
      await scrapeWorkdayJobs();
      await scrapeWellfoundJobs();
      await scrapeLeverJobs();
      await expireStaleJobs();
      

    });

    console.log('✅ Job scraper worker started');
  }
};
