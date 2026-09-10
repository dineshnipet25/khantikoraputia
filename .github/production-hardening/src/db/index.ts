import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const globalForDb = globalThis as typeof globalThis & { __khantiPostgresPool?: Pool };
export const pool = globalForDb.__khantiPostgresPool ?? new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 10000,
});
if (process.env.NODE_ENV !== 'production') globalForDb.__khantiPostgresPool = pool;
export const db = drizzle(pool);
