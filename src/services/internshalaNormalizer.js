export const normalizeInternshalaJob = (job) => ({
  title: job.title.slice(0, 255),

  description:
  "We are looking for motivated candidates to join our team. This role offers hands-on experience, learning opportunities, and exposure to real-world projects.",


  location: job.location,
  job_type: "internship",

  source: "aggregated",

  source_job_id: `internshala-${job.company_name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${job.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`,

  company_name: job.company_name,
  company_website: null,

  external_url: job.external_url,
});
