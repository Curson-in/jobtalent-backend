import pool  from '../config/database.js';
import { PLAN_CONFIG } from '../config/plans.js';

export const checkPlanLimit = (feature) => {
  return async (req, res, next) => {
    const userId = req.user.id;

    try {
      // 1. Get Usage Data
      let usageRes = await pool.query('SELECT * FROM company_usage WHERE user_id = $1', [userId]);
      
      // Auto-create usage record if missing (Safety net)
      if (usageRes.rows.length === 0) {
        usageRes = await pool.query(
          `INSERT INTO company_usage (user_id) VALUES ($1) RETURNING *`, 
          [userId]
        );
      }

      const usage = usageRes.rows[0];
      const plan = PLAN_CONFIG[usage.current_plan] || PLAN_CONFIG.free_trial;
      
      // 2. Map feature to DB column & Config key
      const map = {
        'post_job': { col: 'jobs_posted_count', limitKey: 'jobs' },
        'invite':   { col: 'invites_used_count', limitKey: 'invites' },
        'search':   { col: 'searches_used_count', limitKey: 'searches' },
        'save':     { col: 'profiles_saved_count', limitKey: 'saves' }
      };

      const target = map[feature];
      if (!target) return next(); // Should not happen

      const currentCount = usage[target.col];
      const limit = plan.limits[target.limitKey];

      // 3. The Check
      if (currentCount >= limit) {
        return res.status(403).json({ 
          error: 'LIMIT_REACHED', 
          message: `You have reached your limit of ${limit} for ${feature}. Please upgrade or renew.`,
          currentUsage: usage
        });
      }

      // 4. Attach usage to request for the controller to increment later
      req.companyUsage = usage;
      next();

    } catch (err) {
      console.error('Gatekeeper Error:', err);
      res.status(500).json({ message: 'Plan validation failed' });
    }
  };
};