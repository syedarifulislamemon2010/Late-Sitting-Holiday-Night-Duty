import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/lhn_portal_build';

// Prevent multiple connections during hot reloading in development
const globalForPostgres = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const client = globalForPostgres.postgresClient ?? postgres(connectionString);

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.postgresClient = client;
}

// Export the Drizzle client initialized with schema relationships
export const db = drizzle(client, { schema });
