"""
app/services/emotion_service.py

AI Inference Engine — the heart of EmotionSense AI.

Architecture:
  EmotionService wraps OpenCV + DeepFace into a clean, stateful service.
  It is instantiated once at app startup (singleton via module-level instance)
  and shared across all requests.

Pipeline per frame:
  1. Resize frame to inference resolution (640×480)
  2. Convert to grayscale for fast OpenCV Haar Cascade face detection
  3. For each detected face ROI — run DeepFace emotion analysis
  4. Return structured FaceDetectionDetail list

Design decisions:
  - OpenCV Haar Cascade for face detection: fast, CPU-only, no model download.
  - DeepFace for emotion analysis on cropped ROIs: accurate, pre-trained.
  - ROI cropping prevents sending full frames to the heavy neural network.
  - enforce_detection=False prevents exceptions when DeepFace loses a face.
  - Errors on individual faces are caught and logged without crashing the pipeline.
"""

import time
from typing import List

import cv2
import numpy as np
from loguru import logger

from app.schemas.detect import BoundingBox, FaceDetectionDetail

# ─── Emotion Label Normalisation ─────────────────────────────────────────────
# DeepFace may return slightly different key names across versions.
# We normalise all keys to lowercase for consistent API output.
VALID_EMOTIONS = {"happy", "sad", "angry", "neutral", "fear", "surprise", "disgust"}


class EmotionService:
    """
    Singleton AI inference service for facial emotion detection.

    Wraps OpenCV Haar Cascade face detection + DeepFace emotion classification
    into a single reusable interface.

    Usage:
        emotion_service.analyze_frame(bgr_frame)
    """

    def __init__(self) -> None:
        self._model_ready: bool = False
        self._face_cascade: cv2.CascadeClassifier | None = None

    # ─── Initialisation ───────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load OpenCV Haar Cascade classifier.
        Called once at application startup before any request arrives.
        """
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._face_cascade = cv2.CascadeClassifier(cascade_path)

        if self._face_cascade.empty():
            raise RuntimeError(
                f"Failed to load Haar Cascade from: {cascade_path}. "
                "Ensure opencv-python-headless is installed correctly."
            )
        logger.info("[AI] OpenCV Haar Cascade loaded successfully.")

    def warm_up(self) -> None:
        """
        Warm up the DeepFace model by running inference on a black dummy image.

        DeepFace downloads model weights (~200MB) on the first call.
        Calling warm_up() at startup ensures:
          - Model weights are downloaded before user requests arrive
          - First user request gets full-speed inference, no 30s wait
          - Docker build can bake the weights into the image layer

        This is a blocking call — intentionally called synchronously at startup.
        """
        from deepface import DeepFace  # local import to defer TF loading

        logger.info("[AI] Starting DeepFace model warm-up (may download weights on first run)...")
        t0 = time.perf_counter()

        dummy = np.zeros((224, 224, 3), dtype=np.uint8)
        try:
            DeepFace.analyze(
                img_path=dummy,
                actions=["emotion"],
                enforce_detection=False,
                silent=True,
            )
            elapsed = (time.perf_counter() - t0) * 1000
            self._model_ready = True
            logger.info(f"[AI] DeepFace warm-up complete in {elapsed:.0f}ms. Model is ready.")
        except Exception as exc:
            logger.warning(
                f"[AI] DeepFace warm-up failed: {exc}. "
                "Inference will still work but first request may be slow."
            )

    # ─── Public API ───────────────────────────────────────────────────────────

    def analyze_frame(self, frame: np.ndarray) -> List[FaceDetectionDetail]:
        """
        Detect all faces in a BGR frame and predict emotions for each.

        Pipeline:
          1. Resize to inference resolution (avoids processing giant images)
          2. Convert to grayscale for Haar Cascade (lightweight face detection)
          3. Detect face bounding boxes via OpenCV
          4. For each face ROI → run DeepFace emotion analysis
          5. Normalise emotion scores and return structured results

        Args:
            frame: BGR numpy array (from OpenCV or image decoder).

        Returns:
            List of FaceDetectionDetail — one entry per detected face.
            Empty list if no faces detected or frame is invalid.
        """
        if frame is None or frame.size == 0:
            logger.warning("[AI] Received empty or None frame. Skipping analysis.")
            return []

        if self._face_cascade is None:
            logger.error("[AI] Face cascade not loaded. Call load() first.")
            return []

        # Step 1: Resize for consistent inference resolution
        frame = self._resize_frame(frame)

        # Step 2: Grayscale conversion for Haar Cascade
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Step 3: Detect face bounding boxes
        faces = self._detect_faces(gray)

        if len(faces) == 0:
            return []

        # Step 4: Analyze each face ROI
        results: List[FaceDetectionDetail] = []
        for face_index, (x, y, w, h) in enumerate(faces):
            detail = self._analyze_face_roi(frame, face_index, x, y, w, h)
            if detail is not None:
                results.append(detail)

        return results

    # ─── Internal Helpers ─────────────────────────────────────────────────────

    def _resize_frame(self, frame: np.ndarray, max_w: int = 640, max_h: int = 480) -> np.ndarray:
        """Downscale only — never upscale. Preserves aspect ratio for accuracy."""
        h, w = frame.shape[:2]
        if w > max_w or h > max_h:
            scale = min(max_w / w, max_h / h)
            new_w, new_h = int(w * scale), int(h * scale)
            frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return frame

    def _detect_faces(self, gray: np.ndarray) -> np.ndarray:
        """
        Run OpenCV Haar Cascade face detector on a grayscale frame.

        Parameters tuned for balance between detection rate and false positives:
          - scaleFactor=1.1: slide window by 10% per scale step
          - minNeighbors=5: require 5 overlapping detections (reduces false positives)
          - minSize=(48,48): ignore faces smaller than 48px (too small to analyze)
        """
        faces = self._face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(48, 48),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        # detectMultiScale returns () when no face found, not an empty array
        return faces if len(faces) > 0 else []

    def _analyze_face_roi(
        self,
        frame: np.ndarray,
        face_index: int,
        x: int, y: int, w: int, h: int,
    ) -> FaceDetectionDetail | None:
        """
        Crop a face ROI from the frame and run DeepFace emotion analysis on it.

        DeepFace is only called on the cropped face ROI (not the full frame).
        This is the key performance optimisation — reduces neural network input size by ~95%.

        Returns None if analysis fails for this face (other faces still processed).
        """
        from deepface import DeepFace  # local import — defers TensorFlow loading

        # Crop face region
        face_roi = frame[y : y + h, x : x + w]
        if face_roi.size == 0:
            return None

        try:
            analysis = DeepFace.analyze(
                img_path=face_roi,
                actions=["emotion"],
                enforce_detection=False,  # Don't raise if DeepFace can't re-find a face
                silent=True,
            )

            # DeepFace may return a list (multi-face) or a single dict
            if isinstance(analysis, list):
                analysis = analysis[0]

            raw_emotions: dict = analysis.get("emotion", {})
            dominant_emotion: str = analysis.get("dominant_emotion", "neutral")

            # Normalise emotion keys to lowercase, fill missing with 0.0
            emotion_scores = {
                emotion: float(raw_emotions.get(emotion, 0.0))
                for emotion in VALID_EMOTIONS
            }

            # Confidence is the score of the dominant emotion
            confidence = emotion_scores.get(dominant_emotion.lower(), 0.0)

            return FaceDetectionDetail(
                face_index=face_index,
                box=BoundingBox(x=int(x), y=int(y), width=int(w), height=int(h)),
                dominant_emotion=dominant_emotion.lower(),
                confidence=round(confidence, 2),
                emotion_scores={k: round(v, 2) for k, v in emotion_scores.items()},
            )

        except Exception as exc:
            logger.warning(
                f"[AI] DeepFace analysis failed for face {face_index} "
                f"(box: x={x},y={y},w={w},h={h}): {exc}"
            )
            return None

    @property
    def is_ready(self) -> bool:
        """True if the model has been successfully warmed up."""
        return self._model_ready


# ─── Singleton Instance ───────────────────────────────────────────────────────
# Shared across all requests. Instantiated at module load;
# load() and warm_up() are called during app startup lifespan.
emotion_service = EmotionService()
