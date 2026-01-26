export const normalizeAshbyJob = (job, companyName) => {
  // Use the HTML description from API if available, otherwise generic
  let finalDescription = job.description 
    ? job.description 
    : `<p>Exciting opportunity at <strong>${companyName}</strong>. This is a ${job.job_type} role located in ${job.location}.</p><p>Check the official career page for full details.</p>`;

  return {
    title: job.title.slice(0, 255),
    description: finalDescription,
    location: job.location,
    job_type: job.title.toLowerCase().includes("intern") ? "internship" : "full_time",
    source: "aggregated",
    // Create unique ID from the URL (last part is the UUID)
    source_job_id: `ashby-${job.external_url.split('/').pop()}`,
    company_name: companyName,
    company_website: `https://jobs.ashbyhq.com/${job.company_name}`,
    external_url: job.external_url,
  };
};