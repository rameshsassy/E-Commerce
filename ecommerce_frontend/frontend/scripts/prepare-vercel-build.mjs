/**
 * Runs before `vite build` on Vercel (or when BACKEND_URL / VITE_API_URL is set).
 * Writes vercel.json rewrites so /api and /uploads proxy to the hosted Express API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');

/** Default Render service name from render.yaml — override with BACKEND_URL on Vercel. */
const DEFAULT_BACKEND = 'https://aashansh-api.onrender.com';

function normalizeBackend(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/$/, '').replace(/\/api\/?$/i, '');
}

const backend =
  normalizeBackend(process.env.VITE_API_URL) ||
  normalizeBackend(process.env.BACKEND_URL) ||
  normalizeBackend(process.env.API_URL) ||
  (process.env.VERCEL ? DEFAULT_BACKEND : '');

const isVercel = Boolean(process.env.VERCEL);

if (!backend && isVercel) {
  console.error(
    '[prepare-vercel-build] FATAL: Set BACKEND_URL on Vercel to your Render API URL, e.g.',
    DEFAULT_BACKEND
  );
  process.exit(1);
}

if (!backend) {
  console.log('[prepare-vercel-build] skipped (local build, no BACKEND_URL)');
  process.exit(0);
}

if (/localhost|127\.0\.0\.1/i.test(backend)) {
  console.log('[prepare-vercel-build] skipped (localhost backend)');
  process.exit(0);
}

const rewrites = [
  { source: '/api/:path*', destination: `${backend}/api/:path*` },
  { source: '/uploads/:path*', destination: `${backend}/uploads/:path*` },
  { source: '/(.*)', destination: '/index.html' },
];

fs.writeFileSync(
  path.join(frontendRoot, 'vercel.json'),
  `${JSON.stringify({ rewrites }, null, 2)}\n`
);

console.log(`[prepare-vercel-build] proxy /api → ${backend}/api`);

if (isVercel && !process.env.VITE_API_URL) {
  const prodEnv = `VITE_API_URL=${backend}/api\n`;
  fs.writeFileSync(path.join(frontendRoot, '.env.production.local'), prodEnv);
  console.log('[prepare-vercel-build] wrote .env.production.local with VITE_API_URL');
}
