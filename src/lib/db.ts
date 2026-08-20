import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// Fallback to reading .env directly if process.env.DATABASE_URL is not set by runner
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of envLines) {
        const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
        if (match) {
          process.env.DATABASE_URL = match[1].trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  } catch {}
}

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/lhn_portal_build';

// Prevent multiple connections during hot reloading in development
const globalForPostgres = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const client = globalForPostgres.postgresClient ?? postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 15,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.postgresClient = client;
}

// Export the Drizzle client initialized with schema relationships
export const db = drizzle(client, { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;
