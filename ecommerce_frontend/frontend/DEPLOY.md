# Deploy login on Vercel (e-commerce-snj1.vercel.app)

## Option A — API on Vercel (recommended if you use Root Directory `ecommerce_frontend/frontend`)

1. **Vercel → Project → Settings → General**
   - **Root Directory:** `ecommerce_frontend/frontend`

2. **Vercel → Settings → Environment Variables** (Production + Preview)

   | Name | Value |
   |------|--------|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Long random string |
   | `ADMIN_SECRET_KEY` | Admin signup secret |
   | `FRONTEND_URL` | `https://e-commerce-snj1.vercel.app` |
   | `CORS_ALLOW_VERCEL` | `true` |

   Do **not** set `BACKEND_URL` unless you use Option B.

3. **Redeploy** the project.

4. **Test:** open `https://e-commerce-snj1.vercel.app/api/health`  
   You must see: `{"ok":true,"service":"aashansh-api"}`  
   If you see HTML, the API route is still wrong — redeploy after pulling the latest code.

## Option B — API on Render + proxy

1. Deploy API on [Render](https://render.com) using root `render.yaml`.
2. On Vercel set `BACKEND_URL` = `https://your-service.onrender.com` (no trailing slash).
3. Redeploy frontend.

## Local dev

```bash
# Terminal 1 — API
cd backend_e-commerce && npm run dev

# Terminal 2 — frontend
cd ecommerce_frontend/frontend && npm run dev
```
