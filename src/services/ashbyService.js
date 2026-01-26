import axios from "axios";

// ✅ Helper to check if job is in India
const isIndiaJob = (job) => {
  // Combine all location data into one string for checking
  const locationString = [
    job.locationName,
    job.address?.postalAddress?.addressLocality,
    job.address?.postalAddress?.addressCountry,
    ...(job.secondaryLocations || []).map(l => l.locationName) // Check secondary locations too
  ].join(" ").toLowerCase();

  return (
    locationString.includes("india") ||
    locationString.includes("bengaluru") ||
    locationString.includes("bangalore") ||
    locationString.includes("mumbai") ||
    locationString.includes("pune") ||
    locationString.includes("delhi") ||
    locationString.includes("noida") ||
    locationString.includes("gurugram") ||
    locationString.includes("gurgaon") ||
    locationString.includes("hyderabad") ||
    locationString.includes("chennai") ||
    locationString.includes("remote")
  );
};

export const fetchAshbyJobs = async (companySlug) => {
  try {
    // 🔥 USE THE OFFICIAL API ENDPOINT
    const url = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}?includeCompensation=true`;
    
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    const jobs = [];

    // The API returns { jobs: [...] }
    if (data.jobs && Array.isArray(data.jobs)) {
      for (const post of data.jobs) {
        
        // Filter for India
        if (isIndiaJob(post)) {
          jobs.push({
            title: post.title,
            location: post.locationName || "Remote",
            // Ashby API gives 'applyUrl' and 'jobUrl'
            external_url: post.jobUrl || post.applyUrl, 
            job_type: post.employmentType || "Full-time",
            company_name: companySlug,
            description: post.descriptionHtml || null // Sometimes API gives HTML description
          });
        }
      }
    }

    return jobs;
  } catch (err) {
    console.error(`❌ Ashby failed for ${companySlug}: ${err.message}`);
    return [];
  }
};