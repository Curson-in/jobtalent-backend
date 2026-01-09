export const jobReminderEmail = (name, jobs = []) => `
<h2>New jobs waiting for you 🚀</h2>

<p>Hi ${name},</p>

<p>Here are some jobs matching your profile:</p>

<ul>
  ${jobs
    .map(
      (job) =>
        `<li><strong>${job.title}</strong> at ${job.company}</li>`
    )
    .join("")}
</ul>

<p>
 <a href="https://curson.app/jobs">View all jobs</a>
</p>

<p>Don’t miss out 👀</p>

<p>— Curson</p>
`;
