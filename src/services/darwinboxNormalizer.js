export const normalizeDarwinboxJob = (job, company) => {
  return {
    title: job.title,
    description: job.description || "Job description not provided",
    location: job.location || "India",
    job_type: job.employmentType || null,

    source: "aggregated",
    source_job_id: `darwinbox-${company.name}-${job.id}`,

    company_name: company.name,
    company_website: company.website,

    external_url: job.applyUrl || company.website
  };
};
