import axios from 'axios';

export const fetchGreenhouseJobs = async (boardToken) => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;

  const response = await axios.get(url, {
    timeout: 15000,
  });

  // keep only recent jobs (last 30 days)
  const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
  const now = Date.now();

  return (response.data.jobs || []).filter(job => {
    const created = new Date(job.updated_at || job.created_at).getTime();
    return now - created < THIRTY_DAYS;
  });
};

export const fetchGreenhouseJobDetail = async (boardToken, jobId) => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;
  const res = await axios.get(url, { timeout: 10000 });

 

  return res.data;
};
