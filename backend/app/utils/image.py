"""
app/utils/image.py

Image processing utility functions for the AI pipeline.

Responsibilities:
  - Decode base64-encoded frames (from WebSocket clients)
  - Decode raw uploaded file bytes (from HTTP multipart uploads)
  - Resize images to the target inference resolution
  - Validate image format and file size before processing

These are pure utility functions with no FastAPI or database dependencies.
"""

import base64
import io
from typing import Tuple

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings


# ─── Constants ────────────────────────────────────────────────────────────────
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
INFERENCE_FRAME_SIZE: Tuple[int, int] = (640, 480)  # (width, height)


# ─── Decoding ─────────────────────────────────────────────────────────────────

def decode_base64_image(b64_string: str) -> np.ndarray:
    """
    Decode a base64 JPEG/PNG string (e.g. from WebSocket frame) into a
    BGR numpy array compatible with OpenCV.

    Args:
        b64_string: Base64-encoded image string. May include data URI prefix.

    Returns:
        BGR numpy array ready for OpenCV processing.

    Raises:
        ValueError: If decoding fails or result is empty.
    """
    # Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(b64_string)
    except Exception as exc:
        raise ValueError(f"Failed to decode base64 image: {exc}") from exc

    return bytes_to_bgr_array(image_bytes)


def bytes_to_bgr_array(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes to a BGR numpy array for OpenCV.

    Args:
        image_bytes: Raw bytes of a JPEG, PNG, or WEBP image.

    Returns:
        BGR numpy array.

    Raises:
        ValueError: If the bytes cannot be decoded as a valid image.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Image bytes are empty.")

    np_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if frame is None or frame.size == 0:
        raise ValueError("Image bytes could not be decoded. The file may be corrupted or unsupported.")

    return frame


# ─── Resizing ─────────────────────────────────────────────────────────────────

def resize_for_inference(frame: np.ndarray, target_size: Tuple[int, int] = INFERENCE_FRAME_SIZE) -> np.ndarray:
    """
    Resize an image to the target inference resolution while maintaining
    quality for face detection accuracy.

    Downscales large images to reduce AI inference cost.
    Does NOT upscale images smaller than the target.

    Args:
        frame: BGR numpy array from OpenCV.
        target_size: (width, height) target size. Default is 640x480.

    Returns:
        Resized BGR numpy array.
    """
    h, w = frame.shape[:2]
    target_w, target_h = target_size

    # Only resize if the image is larger than the target
    if w > target_w or h > target_h:
        frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)

    return frame


# ─── Validation ──────────────────────────────────────────────────────────────

def validate_image_bytes(image_bytes: bytes, content_type: str) -> None:
    """
    Validate that uploaded image bytes are within size limits and of
    an allowed MIME type. Raises ValueError on violation.

    Args:
        image_bytes: Raw image bytes from the upload.
        content_type: MIME type reported by the client.

    Raises:
        ValueError: If validation fails.
    """
    # Check file size
    if len(image_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
        max_mb = settings.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
        raise ValueError(f"Image file exceeds the maximum allowed size of {max_mb:.0f}MB.")

    # Check MIME type
    if content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ValueError(
            f"Unsupported image format '{content_type}'. "
            f"Allowed formats: JPEG, PNG, WEBP."
        )
