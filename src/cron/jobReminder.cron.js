import cron from "node-cron";
import { sendJobReminder } from "../services/email/email.events.js";
import { getUsersWithNewJobs } from "../services/job.service.js";

cron.schedule("0 10 */2 * *", async () => {
  const users = await getUsersWithNewJobs();

  for (const user of users) {
    await sendJobReminder(user, user.jobs);
  }
});
