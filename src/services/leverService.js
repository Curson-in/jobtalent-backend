import axios from 'axios'; // 🔥 REQUIRED

export const fetchLeverJobs = async (slug) => {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;

  const response = await axios.get(url, { timeout: 10000 });

  return response.data || [];
};
