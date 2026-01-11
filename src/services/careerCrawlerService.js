import axios from "axios";
import * as cheerio from "cheerio";


export const fetchCareerPageJobs = async (company) => {
  const res = await axios.get(company.careersUrl, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (JobBot)"
    }
  });

  const html = res.data;
  const $ = cheerio.load(html);

  const jobs = [];

  // ✅ 1. JSON-LD (BEST CASE)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());

      if (json["@type"] === "JobPosting") {
        jobs.push(json);
      }

      if (Array.isArray(json)) {
        json.forEach(j => {
          if (j["@type"] === "JobPosting") jobs.push(j);
        });
      }
    } catch {}
  });

  // ✅ 2. Fallback: job links
  if (jobs.length === 0) {
    $("a").each((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr("href");

      if (
        href &&
        (text.includes("engineer") ||
         text.includes("developer") ||
         text.includes("software"))
      ) {
        jobs.push({
          title: $(el).text().trim(),
          url: href.startsWith("http")
            ? href
            : company.website + href
        });
      }
    });
  }

  return jobs;
};
