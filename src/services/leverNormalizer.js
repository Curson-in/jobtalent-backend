export const normalizeLeverJob = (job, company) => {
  return {
    title: job.text?.slice(0, 255),

    description:
      job.descriptionPlainText ||
      'Job description not provided by employer.',

    location: job.categories?.location || 'Remote',

    job_type: job.categories?.commitment || null,

    source: 'aggregated',

    source_job_id: `${company.slug}-${job.id}`,

    company_name: company.name,
    company_website: company.website,

    external_url: job.hostedUrl, // 🔥 IMPORTANT
  };
};
