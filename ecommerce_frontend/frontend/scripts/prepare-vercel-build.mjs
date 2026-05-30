/**
 * Runs before `vite build` on Vercel (or when BACKEND_URL / VITE_API_URL is set).
 * Writes vercel.json rewrites so /api and /uploads proxy to the hosted Express API.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const repoRoot = path.join(frontendRoot, '..', '..');

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

const isVercel = Boolean(process.env.VERCEL);

const backend =
  normalizeBackend(process.env.VITE_API_URL) ||
  normalizeBackend(process.env.BACKEND_URL) ||
  normalizeBackend(process.env.API_URL) ||
  '';

const apiInDeployPackage =
  fs.existsSync(path.join(frontendRoot, 'api', 'index.js')) ||
  fs.existsSync(path.join(process.cwd(), 'api', 'index.js'));

const apiInRepoRoot = fs.existsSync(path.join(repoRoot, 'api', 'index.js'));

// Explicit external API (Render, Railway, etc.) — always proxy
if (backend && !/localhost|127\.0\.0\.1/i.test(backend)) {
  writeProxyVercelJson(backend);

  if (isVercel && !process.env.VITE_API_URL) {
    const prodEnv = `VITE_API_URL=${backend}/api\n`;
    fs.writeFileSync(path.join(frontendRoot, '.env.production.local'), prodEnv);
    console.log('[prepare-vercel-build] wrote .env.production.local with VITE_API_URL');
  }
  process.exit(0);
}

// Vercel serverless API only when api/index.js is inside the deployed project root
if (isVercel && apiInDeployPackage) {
  console.log('[prepare-vercel-build] serverless API in project — using same-origin /api');
  process.exit(0);
}

if (isVercel) {
  if (apiInRepoRoot && !apiInDeployPackage) {
    console.error(
      '[prepare-vercel-build] Vercel Root Directory is probably ecommerce_frontend/frontend, so api/index.js is not deployed.\n' +
        '  Fix: Render → deploy API from render.yaml, then set BACKEND_URL on Vercel to that URL and redeploy.'
    );
  } else {
    console.error(
      '[prepare-vercel-build] No API for this Vercel project. Set BACKEND_URL to your hosted API (e.g. Render) and redeploy.'
    );
  }
  process.exit(1);
}

console.log('[prepare-vercel-build] skipped (local build, no BACKEND_URL)');
process.exit(0);
