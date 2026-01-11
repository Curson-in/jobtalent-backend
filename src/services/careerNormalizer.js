export const normalizeCareerJob = (job, company) => {
  return {
    title: job.title || job.jobTitle || "Software Role",
    description:
      job.description ||
      job.jobDescription ||
      "Visit job page for details",
    location:
      job.jobLocation?.address?.addressLocality ||
      job.location ||
      "India",
    job_type: job.employmentType || null,
    source: "aggregated",
    source_job_id:
      job.url || `${company.name}-${job.title}-${Date.now()}`,
    company_name: company.name,
    company_website: company.website,
    external_url: job.url || company.careersUrl
  };
};
