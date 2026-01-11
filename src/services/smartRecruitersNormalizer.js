export const normalizeSmartRecruitersJob = (job) => {
  const location = job.location || {};

  return {
    source: "smartrecruiters",
    external_id: job.id,
    title: job.name,
    company: job.company?.name || "Unknown",
    location: `${location.city || ""}, ${location.country || ""}`,
    city: location.city || null,
    country: location.country || null,
    is_remote: location.remote || false,
    url: job.ref || job.applyUrl,
    description: job.jobAd?.sections
      ?.map(s => s.text)
      .join("\n") || "",
    posted_at: job.releasedDate,
    raw: job
  };
};
