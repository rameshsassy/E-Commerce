/**
 * Run before deploy: node scripts/verify-deploy.mjs [API_BASE_URL]
 * Default API_BASE_URL: http://localhost:5000
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const apiBase = (process.argv[2] || 'http://localhost:5000').replace(/\/$/, '');

let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}:`, e.message);
    failed += 1;
  }
}

await check('API /api/health', async () => {
  const res = await fetch(`${apiBase}/api/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(JSON.stringify(data));
});

await check('API /api/auth/login responds (not HTML)', async () => {
  const res = await fetch(`${apiBase}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Portal': 'customer' },
    body: JSON.stringify({ email: 'verify@test.com', password: 'x' }),
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html')) throw new Error('Got HTML — API not reachable');
  if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
});

await check('prepare-vercel-build writes /api proxy', async () => {
  const sampleBackend = 'https://test-api.onrender.com';
  const { execSync } = await import('child_process');
  execSync('node scripts/prepare-vercel-build.mjs', {
    cwd: frontendRoot,
    stdio: 'pipe',
    env: { ...process.env, VERCEL: '1', BACKEND_URL: sampleBackend },
  });
  const vercel = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'vercel.json'), 'utf8'));
  const apiRewrite = vercel.rewrites?.find((r) => r.source?.startsWith('/api'));
  if (!apiRewrite?.destination?.startsWith(`${sampleBackend}/api/`)) {
    throw new Error('vercel.json missing /api rewrite to BACKEND_URL');
  }
  fs.writeFileSync(
    path.join(frontendRoot, 'vercel.json'),
    `${JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }] }, null, 2)}\n`
  );
});

await check('frontend production build', async () => {
  const { execSync } = await import('child_process');
  execSync('npm run build', {
    cwd: frontendRoot,
    stdio: 'pipe',
    env: { ...process.env, VERCEL: '1', BACKEND_URL: apiBase },
  });
  const distJs = fs.readdirSync(path.join(frontendRoot, 'dist/assets')).find((f) => f.endsWith('.js'));
  const bundle = fs.readFileSync(path.join(frontendRoot, 'dist/assets', distJs), 'utf8');
  if (/localhost:5000/.test(bundle) && !/resolveApiBaseUrl|apiConfig/.test(bundle)) {
    console.warn('  (note: localhost:5000 may appear as dev fallback string)');
  }
});

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed. Safe to deploy.');
process.exit(failed ? 1 : 0);
