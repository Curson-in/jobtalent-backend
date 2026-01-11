export const normalizeFreshteamJob = (job, company) => {
  return {
    title: job.title,
    description: job.description || "Job description not provided",
    location: job.location?.name || "India",
    job_type: job.type || null,

    source: "aggregated",
    source_job_id: `freshteam-${company.name}-${job.id}`,

    company_name: company.name,
    company_website: company.website,

    external_url: job.apply_url
  };
};
