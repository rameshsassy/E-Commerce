/**
 * Runs before `vite build` on Vercel (or when BACKEND_URL / VITE_API_URL is set).
 * Writes vercel.json rewrites so /api and /uploads proxy to the hosted Express API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');

function normalizeBackend(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/$/, '').replace(/\/api\/?$/i, '');
}

const backend =
  normalizeBackend(process.env.VITE_API_URL) ||
  normalizeBackend(process.env.BACKEND_URL) ||
  normalizeBackend(process.env.API_URL);

const isVercel = Boolean(process.env.VERCEL);
const shouldWrite = isVercel || Boolean(backend);

if (!shouldWrite) {
  console.log('[prepare-vercel-build] skipped (local build, no BACKEND_URL)');
  process.exit(0);
}

const rewrites = [];

if (backend && !/localhost|127\.0\.0\.1/i.test(backend)) {
  rewrites.push(
    { source: '/api/:path*', destination: `${backend}/api/:path*` },
    { source: '/uploads/:path*', destination: `${backend}/uploads/:path*` }
  );
  console.log(`[prepare-vercel-build] proxy /api → ${backend}/api`);
} else if (isVercel) {
  console.warn(
    '[prepare-vercel-build] WARNING: Set BACKEND_URL (or VITE_API_URL) on Vercel to your hosted API, e.g. https://your-app.onrender.com'
  );
}

rewrites.push({ source: '/(.*)', destination: '/index.html' });

fs.writeFileSync(
  path.join(frontendRoot, 'vercel.json'),
  `${JSON.stringify({ rewrites }, null, 2)}\n`
);

if (isVercel && backend && !process.env.VITE_API_URL) {
  const prodEnv = `VITE_API_URL=${backend}/api\n`;
  fs.writeFileSync(path.join(frontendRoot, '.env.production.local'), prodEnv);
  console.log('[prepare-vercel-build] wrote .env.production.local with VITE_API_URL');
}
