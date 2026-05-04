# Deployment Guide - OTP Naama SaaS

This guide explains how to deploy the OTP Naama SaaS platform to production.

## 🏗️ Architecture Overview
- **Frontend**: Next.js (located in `apps/web`) - Recommended for **Vercel**.
- **Backend**: Fastify API (located in `apps/api`) - Recommended for **Render**, **Railway**, or **DigitalOcean**.
- **Database**: PostgreSQL (Prisma) - Recommended for **Supabase** or **Neon**.

---

## 🛠️ Environment Variables

You must set the following variables in your hosting provider's dashboard:

### Backend (`apps/api`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string. |
| `JWT_SECRET` | A secure random string for signing tokens. |
| `PORT` | Set to `3001` (or whatever the host provides). |
| `FRONTEND_URL` | The URL of your deployed frontend (to handle CORS). |

### Frontend (`apps/web`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | The URL of your deployed backend API. |

---

## 🚀 Deployment Steps

### 1. Database
1. Create a PostgreSQL database on Supabase or Neon.
2. Get the connection string.
3. Run the following command locally to sync the schema:
   ```bash
   npm run db:push
   ```

### 2. Backend (API)
1. Link your GitHub repo to a service like **Render** or **Railway**.
2. Set the **Root Directory** to `apps/api` (or keep it at the root and use the build command).
3. **Build Command**: `npm install`
4. **Start Command**: `npm run start`
5. Add the environment variables listed above.

### 3. Frontend (Web)
1. Link your GitHub repo to **Vercel**.
2. Vercel will automatically detect the Next.js app in `apps/web`.
3. **Framework Preset**: Next.js
4. **Root Directory**: `apps/web`
5. Add the `NEXT_PUBLIC_API_URL` environment variable.
6. Click **Deploy**.

---

## 🔐 Security Recommendations
- **API Keys**: Ensure your client generates new API keys for their external systems via the Settings panel.
- **RBAC**: The first user registered will be an **ADMIN** by default (verify this in your DB).
- **CORS**: Ensure `FRONTEND_URL` in the backend matches the Vercel deployment URL exactly.

---

## ✅ Final Checklist
- [ ] Database schema pushed.
- [ ] Backend API live and reachable.
- [ ] Frontend connected to Backend API.
- [ ] Admin login verified.
