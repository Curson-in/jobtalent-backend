import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ load DB pool from backend
const { default: pool } = await import('../src/config/database.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.join(
  __dirname,
  'migrations',
  '001_initial_schema.sql'
);

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running migrations...');
    await client.query(migrationSQL);
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();
