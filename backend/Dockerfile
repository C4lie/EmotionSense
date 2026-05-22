FROM python:3.10-slim

# ─── Labels ──────────────────────────────────────────────────────────────────
LABEL maintainer="EmotionSense AI Team"
LABEL description="EmotionSense AI FastAPI Backend"

# ─── System Dependencies ──────────────────────────────────────────────────────
# Required for OpenCV (libGL for image processing) and DeepFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ─── Working Directory ────────────────────────────────────────────────────────
WORKDIR /workspace

# ─── Python Dependencies ──────────────────────────────────────────────────────
# Copy requirements first for Docker layer caching
# (Dependencies only re-install when requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ─── DeepFace Model Cache Directory ──────────────────────────────────────────
# DeepFace downloads weights to ~/.deepface by default.
# We redirect to /workspace/.deepface so it persists in the container image.
ENV DEEPFACE_HOME=/workspace/.deepface
RUN mkdir -p /workspace/.deepface/weights

# ─── Application Code ─────────────────────────────────────────────────────────
COPY app/ ./app/

# ─── Non-Root User (Security Best Practice) ──────────────────────────────────
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /workspace
USER appuser

# ─── Exposed Port ─────────────────────────────────────────────────────────────
EXPOSE 8000

# ─── Health Check ─────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# ─── Startup Command ──────────────────────────────────────────────────────────
# Use multiple workers in production via environment variable
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
