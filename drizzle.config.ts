import { defineConfig } from 'drizzle-kit';

import fs from 'fs';
import path from 'path';

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
  } catch (e) {
    console.warn('Failed to parse .env file natively in drizzle config:', e);
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
