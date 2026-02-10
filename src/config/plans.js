export const PLAN_CONFIG = {
  free_trial: {
    limits: { jobs: 2, invites: 5, searches: 5, saves: 5 },
    duration_days: 36500
  },
  starter: {
    limits: { jobs: 3, invites: 5, searches: 10, saves: 5 },
    duration_days: 30
  },
  growth: {
    limits: { jobs: 10, invites: 15, searches: 30, saves: 15 },
    duration_days: 90
  },
  pro: {
    limits: { jobs: 9999, invites: 60, searches: 120, saves: 60 },
    duration_days: 365
  }
};