export const PLAN_ENTITLEMENTS = {
  free: {
    resumeEnhance: false,
    jobMatch: false,
    followUpsPerMonth: 5,
    boostDays: 0
  },

  monthly_99: {
    resumeEnhance: true,
    jobMatch: false,
    followUpsPerMonth: 28,
    boostDays: 7
  },

  quarterly_149: {
    resumeEnhance: true,
    jobMatch: true,
    followUpsPerMonth: Infinity,
    boostDays: 60
  },

  yearly_399: {
    resumeEnhance: true,
    jobMatch: true,
    followUpsPerMonth: Infinity,
    boostDays: 365
  }
};
