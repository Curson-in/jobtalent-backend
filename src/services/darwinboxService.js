import axios from "axios";

export const fetchDarwinboxJobs = async (apiUrl) => {
  const res = await axios.get(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json"
    },
    timeout: 15000
  });

  return res.data?.jobs || [];
};
