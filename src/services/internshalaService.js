import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://internshala.com/internships";

export const fetchInternshalaJobs = async () => {
  const res = await axios.get(BASE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 Chrome/120",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(res.data);
  const jobs = [];

  $(".individual_internship").each((_, el) => {
    const title = $(el).find(".job-internship-name").text().trim();
    const company = $(el).find(".company-name").text().trim();
    const location = $(el).find(".locations").text().trim();
    const link = `https://internshala.com${$(el).find("a").attr("href")}`;

    if (!title || !company) return;

    jobs.push({
      title,
      company_name: company,
      location: location || "India",
      external_url: link,
    });
  });

  return jobs;
};
