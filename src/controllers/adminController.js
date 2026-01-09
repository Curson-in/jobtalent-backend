import pool from '../config/database.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM users';
    const params = [];
    
    if (role) {
      sql += ' WHERE role = $' + (params.length + 1);
      params.push(role);
    }
    
    const countResult = await query('SELECT COUNT(*) as count FROM users' + (role ? ' WHERE role = $1' : ''), role ? [role] : []);
    
    sql += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json({
      users: result.rows.map(u => ({ ...u, password_hash: undefined })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmployer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      'UPDATE companies SET verified = true, verified_at = NOW() WHERE user_id = $1 RETURNING *',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Employer verified',
      company: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    const talentCount = await query('SELECT COUNT(*) as count FROM users WHERE role = \'talent\'');
    const employerCount = await query('SELECT COUNT(*) as count FROM users WHERE role = \'employer\'');
    const jobsCount = await query('SELECT COUNT(*) as count FROM jobs WHERE status = \'active\'');
    const applicationsCount = await query('SELECT COUNT(*) as count FROM applications');
    const revenueCount = await query('SELECT SUM(amount) as total FROM payments WHERE status = \'success\'');
    
    res.json({
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        talentUsers: parseInt(talentCount.rows[0].count),
        employerUsers: parseInt(employerCount.rows[0].count),
        activeJobs: parseInt(jobsCount.rows[0].count),
        totalApplications: parseInt(applicationsCount.rows[0].count),
        totalRevenue: parseInt(revenueCount.rows[0].total || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};
