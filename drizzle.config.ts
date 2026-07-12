import { defineConfig } from 'drizzle-kit';
import { config } from './src/configs/envImplement';

export default defineConfig({
  out: './src/migration',
  schema:'./src/schema/migrations.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.db.url,
  },
});