# 🚀 EmotionSense AI — Localhost Setup Guide

> **Stack**: React (Vite) + FastAPI + PostgreSQL + DeepFace AI  
> **Time to run**: ~10–15 minutes (first-time AI model download takes longer)

---

## 📋 Prerequisites

Before you begin, make sure the following are installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.10 or 3.11 | https://python.org/downloads |
| **Node.js** | 18+ (LTS) | https://nodejs.org |
| **PostgreSQL** | 14+ | https://www.postgresql.org/download |
| **Git** | Latest | https://git-scm.com |

> ⚠️ **Python 3.12+ is NOT recommended** — some AI/ML packages (DeepFace, TensorFlow) may have compatibility issues.

---

## 🗂️ Project Structure

```
emotion-sense-ai/
├── backend/          ← FastAPI Python server
│   ├── app/
│   ├── requirements.txt
│   └── .env.example
├── frontend/         ← React + Vite app
│   ├── src/
│   ├── package.json
│   └── .env (you will create this)
└── docker-compose.yml
```

---

## ⚡ Option A — Run Manually (Recommended for Development)

### Step 1 — Clone & Enter the Project

```bash
git clone <your-repo-url>
cd emotion-sense-ai
```

---

### Step 2 — Set Up PostgreSQL Database

1. Open **pgAdmin** or the **psql** shell and run:

```sql
CREATE DATABASE emotionsense;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE emotionsense TO postgres;
```

> 💡 If you already have a `postgres` superuser, you only need to create the database.

---

### Step 3 — Set Up the Backend

#### 3.1 — Navigate to the backend folder

```bash
cd backend
```

#### 3.2 — Create a Python virtual environment

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

> ✅ You should see `(venv)` at the start of your terminal prompt.

#### 3.3 — Install Python dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> ⏳ This step may take several minutes. DeepFace and TensorFlow are large packages.

#### 3.4 — Create your backend `.env` file

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Now open `backend/.env` and fill in your values:

```env
# ─── Database ────────────────────────────────────────────────────
# Use localhost for local PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/emotionsense

# ─── JWT Authentication ──────────────────────────────────────────
JWT_SECRET_KEY=my-super-secret-local-dev-key-change-this
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ─── Application ─────────────────────────────────────────────────
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000

# ─── CORS ────────────────────────────────────────────────────────
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# ─── AI Configuration ────────────────────────────────────────────
MAX_IMAGE_SIZE_BYTES=10485760
MAX_VIDEO_SIZE_BYTES=104857600
EMOTION_CONFIDENCE_THRESHOLD=30.0
```

#### 3.5 — Start the backend server

```bash
# Make sure you are inside the backend/ folder with venv active
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ **Backend is running when you see:**
```
API ready -> http://0.0.0.0:8000/api/docs
```

📖 **API Docs available at:** http://localhost:8000/api/docs

---

### Step 4 — Set Up the Frontend

Open a **new terminal window** (keep the backend running in the first one).

#### 4.1 — Navigate to the frontend folder

```bash
# From the project root
cd frontend
```

#### 4.2 — Install Node dependencies

```bash
npm install
```

#### 4.3 — Create your frontend `.env` file

Create a file called `.env` inside the `frontend/` folder:

```bash
# Windows (PowerShell)
New-Item .env

# macOS / Linux
touch .env
```

Add the following content to `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

#### 4.4 — Start the frontend dev server

```bash
npm run dev
```

✅ **Frontend is running when you see:**
```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

🌐 **Open your browser at:** http://localhost:5173

---

## ✅ Verify Everything is Working

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:5173 | React app loads |
| Backend API | http://localhost:8000 | `{"message": "EmotionSense AI API", ...}` |
| API Docs | http://localhost:8000/api/docs | Swagger UI |
| Health Check | http://localhost:8000/health | `{"status": "ok", ...}` |

---

## 🐳 Option B — Run with Docker (Easiest)

> Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

This runs the **backend + PostgreSQL** together in containers. You still run the frontend manually.

#### Step 1 — Create root `.env` file

```bash
# In the emotion-sense-ai/ root directory
# Windows
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Update the root `.env`:
```env
JWT_SECRET_KEY=my-local-docker-dev-secret
```

#### Step 2 — Start backend + database via Docker

```bash
# From emotion-sense-ai/ root
docker-compose up --build
```

> ⏳ First run will download PostgreSQL image and build the backend. This may take 5–10 minutes.

✅ Backend will be available at http://localhost:8000

#### Step 3 — Run the frontend (same as Option A, Step 4)

```bash
cd frontend
npm install
# Create frontend/.env with the values shown in Step 4.3 above
npm run dev
```

---

## 🔧 Troubleshooting

### ❌ `uvicorn: command not found`
Your virtual environment is not active. Run:
```bash
# Windows
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate
```

### ❌ `Could not connect to server: Connection refused` (Database error)
- Confirm PostgreSQL is running on port `5432`
- Verify your `DATABASE_URL` in `backend/.env` uses the correct password and database name

### ❌ `VITE_API_URL is not defined`
Make sure you created `frontend/.env` (not `.env.local`) with the correct variable names starting with `VITE_`.

### ❌ DeepFace / TensorFlow errors on startup
- On **first startup**, DeepFace downloads AI model weights (~500MB). This is normal.
- Make sure you are using **Python 3.10 or 3.11**, not 3.12+.
- If errors persist, try: `pip install tf-keras==2.16.0 deepface==0.0.92`

### ❌ PowerShell script execution error
Run this in PowerShell as Administrator, then retry:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Frontend port 5173 already in use
Vite will automatically try the next port (5174, 5175, etc.). Check your terminal output for the actual URL.

---

## 🛑 How to Stop the Servers

- **Frontend**: Press `Ctrl + C` in the frontend terminal
- **Backend (manual)**: Press `Ctrl + C` in the backend terminal
- **Docker**: Press `Ctrl + C` or run `docker-compose down`

---

## 📁 Summary of Commands (Quick Reference)

```bash
# ── Backend ──────────────────────────────────────────────────────
cd backend
.\venv\Scripts\Activate.ps1          # Activate venv (Windows)
pip install -r requirements.txt      # Install deps (first time only)
uvicorn app.main:app --reload        # Start backend

# ── Frontend ─────────────────────────────────────────────────────
cd frontend
npm install                          # Install deps (first time only)
npm run dev                          # Start frontend
```

---

*Generated for EmotionSense AI — Face Detection & Emotion Analysis App*
