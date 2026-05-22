# EmotionSense AI

A production-grade AI-powered real-time facial emotion detection web application.

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS + Framer Motion
- Zustand (state management)
- TanStack Query (server state)
- react-webcam

### Backend
- FastAPI (Python)
- SQLAlchemy (async ORM)
- PostgreSQL (via Supabase)
- OpenCV + DeepFace (AI inference)
- JWT + bcrypt (authentication)
- WebSockets (real-time streaming)

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Vercel (frontend)
- Render / Railway (backend)
- Supabase (database)

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or Supabase account)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env    # Fill in your environment variables
python -m app.main      # Starts development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local   # Fill in API URL
npm run dev
```

## Project Structure
```
emotion-sense-ai/
├── frontend/       # React + Vite frontend
├── backend/        # FastAPI async backend
├── docs/           # API documentation
└── README.md
```

## Environment Variables

See `.env.example` in the root and backend directories for required variables.

## License
MIT
