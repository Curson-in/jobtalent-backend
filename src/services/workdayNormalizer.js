export const normalizeWorkdayJob = (job) => {
  const locations = job.locationsText || "";

  return {
    source: "workday",
    external_id: job.bulletFields?.[0] || job.jobReqId,
    title: job.title,
    company: job.company,
    location: locations,
    city: locations.includes("India") ? locations : null,
    country: locations.includes("India") ? "India" : null,
    is_remote: locations.toLowerCase().includes("remote"),
    url: job.externalPath
      ? `https://${job.externalPath}`
      : null,
    description: job.jobDescription || "",
    posted_at: job.postedOn,
    job_type: "internship",
  is_entry_level: true,
    raw: job
  };
};
