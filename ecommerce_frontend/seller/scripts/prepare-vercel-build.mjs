/**
 * Runs before `vite build` on Vercel (or when BACKEND_URL / VITE_API_URL is set).
 * - BACKEND_URL set → proxy /api to external host (Render)
 * - Else → keep vercel.json serverless /api (see ../vercel.json)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const repoRoot = path.join(frontendRoot, '..', '..');

const MONOLITH_VERCEL = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  installCommand: 'cd ../.. && npm install && npm install',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  functions: {
    'api/index.js': {
      maxDuration: 30,
    },
  },
  rewrites: [
    { source: '/api/(.*)', destination: '/api/index' },
    { source: '/uploads/(.*)', destination: '/api/index' },
    { source: '/((?!api/|uploads/).*)', destination: '/index.html' },
  ],
};

function normalizeBackend(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/$/, '').replace(/\/api\/?$/i, '');
}

function writeProxyVercelJson(backend) {
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
}

function writeMonolithVercelJson() {
  fs.writeFileSync(
    path.join(frontendRoot, 'vercel.json'),
    `${JSON.stringify(MONOLITH_VERCEL, null, 2)}\n`
  );
  console.log('[prepare-vercel-build] using Vercel serverless API at /api (set MONGO_URI + JWT_SECRET on Vercel)');
}

const isVercel = Boolean(process.env.VERCEL);

const backend =
  normalizeBackend(process.env.VITE_API_URL) ||
  normalizeBackend(process.env.BACKEND_URL) ||
  normalizeBackend(process.env.API_URL) ||
  '';

const hasServerlessApi =
  fs.existsSync(path.join(frontendRoot, 'api', 'index.js')) ||
  fs.existsSync(path.join(repoRoot, 'api', 'index.js'));

if (backend && !/localhost|127\.0\.0\.1/i.test(backend)) {
  writeProxyVercelJson(backend);

  if (isVercel && !process.env.VITE_API_URL) {
    const prodEnv = `VITE_API_URL=${backend}/api\n`;
    fs.writeFileSync(path.join(frontendRoot, '.env.production.local'), prodEnv);
    console.log('[prepare-vercel-build] wrote .env.production.local with VITE_API_URL');
  }
  process.exit(0);
}

if (isVercel && hasServerlessApi) {
  writeMonolithVercelJson();
  process.exit(0);
}

if (isVercel) {
  console.warn('[prepare-vercel-build] No API found — set BACKEND_URL or add api/index.js');
}

console.log('[prepare-vercel-build] skipped (local build)');
process.exit(0);
