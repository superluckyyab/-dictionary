import { cpSync, existsSync, rmSync } from 'node:fs';

if (!existsSync('frontend/dist')) {
  throw new Error('frontend/dist does not exist; run the frontend build first');
}

rmSync('dist', { recursive: true, force: true });
cpSync('frontend/dist', 'dist', { recursive: true });
