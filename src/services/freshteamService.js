import axios from "axios";

export const fetchFreshteamJobs = async (slug) => {
  const url = `https://${slug}.freshteam.com/api/jobs`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json"
    },
    timeout: 15000
  });

  return res.data?.jobs || [];
};
