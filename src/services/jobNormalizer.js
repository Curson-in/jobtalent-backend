import { htmlToText } from 'html-to-text';

export const normalizeGreenhouseJob = (job, company) => {
  return {
    title: job.title,

    description: job.content
      ? htmlToText(job.content, { wordwrap: 120 })
      : 'Job description not provided',

    location: job.location?.name || 'Remote',

    job_type:
      job.metadata?.find(m => m.name === 'Employment Type')?.value || null,

    source: 'aggregated',

    source_job_id: `${company.boardToken}-${job.id}`,

    company_name: company.name,
    company_website: company.website,

    external_url:
      job.absolute_url || `https://boards.greenhouse.io/${company.boardToken}`,
  };
};

