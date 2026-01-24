export const normalizeLinkedInJob = (job) => ({
  title: job.title,
  description:
  "Join a dynamic organization working on cutting-edge technology. Ideal for early-career professionals looking to grow.",

  location: job.location,
  job_type: "internship",
  source: "aggregated",

  source_job_id: `linkedin-${Buffer.from(job.external_url).toString("base64")}`,

  company_name: job.company_name,
  company_website: "https://linkedin.com",

  external_url: job.external_url,
});
