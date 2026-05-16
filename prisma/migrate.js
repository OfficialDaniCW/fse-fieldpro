// Run with: node prisma/migrate.js
// Applies the initial SQL schema to your Neon database.
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const migration = readFileSync(new URL('./migrations/0001_init.sql', import.meta.url), 'utf8');

const statements = migration
  .split(';')
  .map(s => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.unsafe(stmt + ';');
  console.log('✓', stmt.split('\n')[0].slice(0, 60));
}

console.log('\nMigration complete.');
