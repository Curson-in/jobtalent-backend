export const USER_ROLES = {
  TALENT: 'talent',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};


export const JOB_SOURCES = {
  AGGREGATED: 'aggregated',
  DIRECT: 'direct',
  ADMIN: 'admin',
};

export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  OFFERED: 'offered',
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  TALENT_PREMIUM: 'talent_premium',
  EMPLOYER_PRO: 'employer_pro',
};

export const SUBSCRIPTION_PRICES = {
  talent_premium: {
    amount: 999,
    currency: 'INR',
    interval: 'monthly',
  },
};

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};
