import axios from "axios";

if (!process.env.SERP_API_KEY) {
  throw new Error("❌ SERP_API_KEY missing in env");
}

const API_KEY = process.env.SERP_API_KEY;

export const fetchLinkedInJobs = async () => {
  const res = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_jobs",
      q: "software engineer intern India",
      hl: "en",
      api_key: API_KEY,
    },
  });

  return res.data.jobs_results.map(j => ({
    title: j.title,
    company_name: j.company_name,
    location: j.location,
    external_url: j.apply_options?.[0]?.link,
  }));
};
