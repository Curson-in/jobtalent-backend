import bcrypt from 'bcryptjs';

// ✅ load DB pool from backend
const { default: pool } = await import('../src/config/database.js');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');

    const users = [
      {
        email: 'talent@example.com',
        password: 'password123',
        role: 'talent',
        firstName: 'John',
        lastName: 'Talent',
      },
      {
        email: 'employer@example.com',
        password: 'password123',
        role: 'employer',
        firstName: 'Jane',
        lastName: 'Employer',
      },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.email,
          hashedPassword,
          user.role,
          user.firstName,
          user.lastName,
        ]
      );

      console.log(`✅ ensured user: ${user.email}`);
    }

    console.log('🌱 Database seeding completed');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDatabase();
