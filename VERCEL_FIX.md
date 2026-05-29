# Fix login on Vercel (2 minutes)

Login fails because **there is no live API**. Render was never deployed (`404 no-server`).

This repo now runs **frontend + API together on Vercel**.

## Do this once in Vercel dashboard

### 1. Root Directory
**Settings → General → Root Directory** → leave **empty** (repo root, NOT `ecommerce_frontend/frontend`)

### 2. Environment variables (Production)
| Variable | Value |
|----------|--------|
| `MONGO_URI` | Your Atlas connection string (same as local `.env`) |
| `JWT_SECRET` | Same as local `.env` |
| `ADMIN_SECRET_KEY` | Same as local `.env` |
| `FRONTEND_URL` | `https://e-commerce-snj1.vercel.app` |
| `CORS_ALLOW_VERCEL` | `true` |
| `NODE_ENV` | `production` |

### 3. Redeploy
**Deployments → … → Redeploy** (or push to GitHub)

### 4. Test
Open: `https://e-commerce-snj1.vercel.app/api/health`

Must show: `{"ok":true,"service":"aashansh-api"}`

Then login works.

## Push latest code first

```bash
git add .
git commit -m "Deploy API on Vercel for login and registration"
git push origin main
```
