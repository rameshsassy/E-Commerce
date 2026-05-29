# Deploy login & registration (Vercel + Render)

Login fails on Vercel when **only the frontend** is deployed. You need **both** services.

## 1. Deploy API on Render

1. Push this repo to GitHub.
2. [render.com](https://render.com) → **New** → **Blueprint** (or Web Service).
3. Connect the repo; use `render.yaml` at repo root.
4. Set **Environment** (required):
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — long random string
   - `ADMIN_SECRET_KEY` — admin signup secret
5. Deploy. Copy the service URL, e.g. `https://aashansh-api.onrender.com`.
6. Test: `https://YOUR-API.onrender.com/api/health` → `{"ok":true,...}`

## 2. Configure Vercel (frontend)

**Project → Settings → General**

- **Root Directory:** `ecommerce_frontend/frontend`

**Settings → Environment Variables** (Production)

| Name | Value |
|------|--------|
| `BACKEND_URL` | `https://aashansh-api.onrender.com` (your Render URL, no trailing slash) |

**Redeploy** the frontend after saving.

Build runs `prepare-vercel-build.mjs`, which proxies `/api` to `BACKEND_URL`.

## 3. Verify

- `https://e-commerce-snj1.vercel.app/api/health` → JSON, not HTML
- Register / login on the live site

## Local dev

```bash
# Terminal 1 — API
cd backend_e-commerce && npm run dev

# Terminal 2 — frontend
cd ecommerce_frontend/frontend && npm run dev
```
