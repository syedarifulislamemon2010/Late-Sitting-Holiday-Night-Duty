import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables');
}

// Prevent multiple connections during hot reloading in development
const globalForPostgres = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const client = globalForPostgres.postgresClient ?? postgres(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.postgresClient = client;
}

// Export the Drizzle client initialized with schema relationships
export const db = drizzle(client, { schema });
