export const normalizeWellfoundJob = (job) => {
  return {
    title: job.title.slice(0, 255),

   description:
  "This role offers an opportunity to work with a fast-growing team, build impactful products, and develop industry-relevant skills.",


    location: job.location || "India / Remote",

    job_type: null,

    source: "aggregated",

    source_job_id: `wellfound-${job.company_name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${job.title
      .toLowerCase()
      .replace(/\s+/g, "-")}`,

    company_name: job.company_name,
    company_website: null,

    external_url: job.external_url,
  };
};
