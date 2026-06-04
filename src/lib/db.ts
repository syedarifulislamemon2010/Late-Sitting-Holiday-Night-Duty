import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables');
}

// Set up the Neon serverless HTTP client connection
const sql = neon(process.env.DATABASE_URL);

// Export the Drizzle client initialized with schema relationships
export const db = drizzle(sql, { schema });
