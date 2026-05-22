# EmotionSense AI — Production Deployment Guide

This document describes the complete steps and configurations required to deploy the EmotionSense AI platform to production-grade hosting services.

The architecture comprises:
1. **Frontend**: Hosted on **Vercel** (Global CDN, HTTPS, SPA route fallbacks).
2. **Backend**: Hosted on **Render** or **Railway** (FastAPI running inside Docker with dynamic port mapping).
3. **Database**: Hosted on **Supabase** (Centralized PostgreSQL Instance with connection pooling).
4. **Media/File Storage (Optional)**: Hosted on **Cloudinary** or **Supabase Storage** (for saving profile pictures, exports, or screenshots).

---

## 1. Centralized Database Setup (Supabase PostgreSQL)

To support real authentication, analytics, history reports, and premium subscriptions, we use a single centralized database shared between the Web frontend and any potential client (e.g., mobile applications).

### Step-by-Step Setup:
1. Sign up for a [Supabase Account](https://supabase.com/).
2. Create a new project named `EmotionSense AI` and choose the database region closest to your app servers.
3. Retrieve your **Transaction Connection String** from the database settings page (`Settings` -> `Database` -> `Connection string` -> Select `Transaction Pooler`).
   * *Example default connection string*:
     ```text
     postgresql://postgres.your-project-id:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
     ```
4. **Driver Schema Note**: The FastAPI backend is configured using SQLAlchemy's async connection pooling which requires the `postgresql+asyncpg://` schema instead of `postgresql://` (or `postgres://`). It also requires `ssl=` instead of `sslmode=`.
   * **No Manual Rewriting Required**: The backend automatically normalizes any database URL string (such as `postgres://` or `postgresql://` and `sslmode=`) at runtime. You can paste the default connection string directly into your environment variable.

---

## 2. Backend Container Deployment (Render or Railway)

The FastAPI backend is deployed using its containerized Docker setup.

### Step-by-Step Deployment on Render:
1. Sign in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository containing the codebase.
4. Select the project root. Under the service settings, configure:
   * **Root Directory**: `backend` (or leave empty if deploying a standalone backend repository).
   * **Runtime**: `Docker`.
   * **Dockerfile Path**: `Dockerfile`.
5. Under **Environment Variables**, add the following production variables:

| Variable Name | Production Value / Description |
| :--- | :--- |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `DATABASE_URL` | *Your Supabase Transaction Connection String (e.g. `postgresql://...:6543/postgres?sslmode=require`)* |
| `JWT_SECRET_KEY` | *A secure random string (e.g., generate using `openssl rand -hex 32`)* |
| `JWT_ALGORITHM` | `HS256` |
| `BACKEND_CORS_ORIGINS` | *JSON list of allowed origins, e.g.:* `["https://emotionsense.vercel.app","https://emotionsense.ai"]` |
| `PORT` | *Render will assign this dynamically, but you can set it to `8000` (FastAPI Docker will map to this port)* |

6. Render will build the container from the `Dockerfile` and start it on the dynamic port. It will perform health checking automatically at `/health` to confirm the service is live.

---

## 3. Frontend Hosting (Vercel)

The React/Vite frontend is deployed on Vercel to optimize global loading speeds.

### Step-by-Step Deployment on Vercel:
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Select your GitHub repository.
4. Configure the **Vercel Project Build Settings**:
   * **Framework Preset**: `Vite` (detected automatically).
   * **Root Directory**: `frontend` (Click edit and select the `frontend` folder).
   * **Build Command**: `npm run build`.
   * **Output Directory**: `dist`.
5. Under **Environment Variables**, add:

| Variable Name | Production Value / Description |
| :--- | :--- |
| `VITE_API_URL` | *The URL of your deployed Render backend (e.g., `https://emotionsense-api.onrender.com`)* |
| `VITE_WS_URL` | *(Optional) The WebSocket URL of your backend (e.g., `wss://emotionsense-api.onrender.com`). If not set, frontend will dynamically derive it from `VITE_API_URL`.* |

6. Click **Deploy**. Vercel will build the React bundle and deploy it.
7. **Single Page Application Routing**: The included `vercel.json` routing configuration inside the frontend folder handles rewrites automatically, ensuring client-side routes (like `/pricing`, `/dashboard`, `/tone-coaching`) load correctly on page refresh.

---

## 4. Custom Domain & SSL Certificates

### Vercel Custom Domain:
1. Go to your Vercel project dashboard -> **Settings** -> **Domains**.
2. Add your custom domain (e.g., `emotionsense.ai` or `app.emotionsense.ai`).
3. Set up the CNAME/A records in your DNS registrar pointing to Vercel's servers. Vercel automatically generates and renews a free Let's Encrypt SSL/HTTPS certificate.

### Render/Railway Custom Domain:
1. Go to your Render/Railway web service dashboard -> **Settings** -> **Custom Domains**.
2. Add your API subdomain (e.g., `api.emotionsense.ai`).
3. Configure the DNS CNAME record in your registrar pointing to Render. Render will issue a free SSL certificate for HTTPS/WSS communication.

---

## 5. Media & File Hosting (Cloudinary or Supabase Storage)

The application executes OpenCV image processing and tone calculations on input frames in-memory and stores scores in the database. 

If you decide to save physical session snapshots or export PDF reports to cloud files:
1. **Supabase Storage**:
   * Create a public bucket in your Supabase project called `emotion-sessions`.
   * Use the Supabase JS SDK client-side or Python client backend to upload images and generate secure URLs.
2. **Cloudinary**:
   * Register a Cloudinary account.
   * Add `CLOUDINARY_URL` to backend environment variables.
   * Use the Cloudinary SDK to stream uploads directly.

---

## 6. Continuous Integration & CD

On push to `main` or `master`:
* **Quality Check**: GitHub Actions (`.github/workflows/ci.yml`) runs tests, ESLint checks, and dry-run build compilation.
* **Auto-deploy**: Vercel and Render/Railway build and deploy the changes immediately upon successful branch merge.
