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

const isVercel = Boolean(process.env.VERCEL);
const repoRoot = path.join(frontendRoot, '..', '..');
const monolithApi = fs.existsSync(path.join(repoRoot, 'api', 'index.js'));

// Monorepo deploy: API runs as Vercel serverless at repo root — same-origin /api
if (isVercel && monolithApi) {
  console.log('[prepare-vercel-build] monolith API detected — using same-origin /api');
  process.exit(0);
}

const backend =
  normalizeBackend(process.env.VITE_API_URL) ||
  normalizeBackend(process.env.BACKEND_URL) ||
  normalizeBackend(process.env.API_URL) ||
  '';

if (!backend) {
  console.log('[prepare-vercel-build] skipped (no external BACKEND_URL)');
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
