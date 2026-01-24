import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL =
  "https://wellfound.com/jobs?locations[]=India&job_types[]=internship&job_types[]=full_time";


export const fetchWellfoundJobs = async () => {
  const url = `${BASE_URL}?locations[]=India&remote=true`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
      Accept: "text/html",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(res.data);
  const jobs = [];

  /**
   * Wellfound job cards are dynamic-ish,
   * but core data exists in anchors
   */
  $("a[href^='/company/']").each((_, el) => {
    const jobUrl = `https://wellfound.com${$(el).attr("href")}`;

    const title = $(el).find("h3").first().text().trim();
    const company = $(el).find("h4").first().text().trim();
    const location = $(el).find("span").text().trim();

    if (!title || !company) return;

    jobs.push({
      title,
      company_name: company,
      location: location || "India / Remote",
      external_url: jobUrl,
    });
  });

  return jobs;
};
