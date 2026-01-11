import axios from "axios";

const BASE_URL = "https://api.smartrecruiters.com/v1/companies";

export const SMARTRECRUITERS_COMPANIES = [
  "boschgroup",
  "siemens-healthineers",
  "ericsson",
  "philips",
  "capgemini",
  "delltechnologies"
];


export const fetchSmartRecruitersJobs = async () => {
  let allJobs = [];

  for (const company of SMARTRECRUITERS_COMPANIES) {
    try {
      const res = await axios.get(
        `${BASE_URL}/${company}/postings`,
        { params: { limit: 50 } }
      );

      const jobs = res.data.content || [];
      console.log(`✅ SmartRecruiters ${company}: ${jobs.length} jobs`);

      allJobs.push(...jobs);
    } catch (err) {
      console.error(`❌ SmartRecruiters ${company} failed`);
    }
  }

  return allJobs;
};
