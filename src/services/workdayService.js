import axios from "axios";

export const WORKDAY_COMPANIES = [
  {
    name: "Amazon",
    endpoint:
      "https://amazon.wd1.myworkdayjobs.com/wday/cxs/amazon/AmazonJobs/jobs"
  },
  {
    name: "Accenture",
    endpoint:
      "https://accenture.wd3.myworkdayjobs.com/wday/cxs/accenture/AccentureCareers/jobs"
  }
];

export const fetchWorkdayJobs = async () => {
  let allJobs = [];

  for (const company of WORKDAY_COMPANIES) {
    try {
      const res = await axios.post(company.endpoint, {
        limit: 50,
        offset: 0
      });

      const jobs = res.data.jobPostings || [];
      console.log(`✅ Workday ${company.name}: ${jobs.length} jobs`);

      allJobs.push(...jobs.map(j => ({ ...j, company: company.name })));
    } catch (err) {
      console.error(`❌ Workday ${company.name} failed`);
    }
  }

  return allJobs;
};
