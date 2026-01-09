import cron from 'node-cron';
import { scrapeJobs, expireStaleJobs, scrapeLeverJobs } from '../services/jobScraperService.js';

export const startJobScraperWorker = () => {
  if (process.env.SCRAPER_ENABLED === 'true') {
    scrapeJobs();
    expireStaleJobs();
    scrapeLeverJobs();

    cron.schedule('0 * * * *', async () => {
      await scrapeJobs();
      await expireStaleJobs();
      await scrapeLeverJobs();

    });

    console.log('✅ Job scraper worker started');
  }
};
