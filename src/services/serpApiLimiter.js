let serpApiUsage = {
  count: 0,
  lastReset: Date.now()
};

const MONTH = 30 * 24 * 60 * 60 * 1000;
const MAX_FREE_CALLS = 200; // keep buffer under 250

export const canUseSerpApi = () => {
  const now = Date.now();

  // reset monthly
  if (now - serpApiUsage.lastReset > MONTH) {
    serpApiUsage = { count: 0, lastReset: now };
  }

  if (serpApiUsage.count >= MAX_FREE_CALLS) {
    return false;
  }

  serpApiUsage.count += 1;
  return true;
};
