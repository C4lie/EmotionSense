"""
app/services/confidence_service.py

Confidence and stability engine service layer.
Calculates telemetry metrics from frame records for Feature B - Public Speaking Trainer.
"""

from statistics import mean, pstdev
from typing import List
from loguru import logger
from app.models.record import EmotionRecord

class ConfidenceService:
    """
    Formulates behavioral feedback scores and aggregates from emotion records.
    Scores range from 0 to 100.
    """

    def calculate_metrics(self, records: List[EmotionRecord], duration_seconds: float) -> dict:
        """
        Processes emotion records and generates four key telemetry scores:
        - confidence_score: based on positive emotions vs nervous/fear weights and stability.
        - stability_score: emotional consistency based on state transitions.
        - eye_contact_score: camera alignment and presence ratio.
        - speaking_energy: facial animation and expression dynamics.
        """
        if not records:
            return {
                "confidence_score": 50.0,
                "stability_score": 50.0,
                "eye_contact_score": 50.0,
                "speaking_energy": 50.0,
            }

        # ── 1. Average Emotion Probabilities ─────────────────────────────────
        avg_happy = mean(r.happy for r in records)
        avg_neutral = mean(r.neutral for r in records)
        avg_fear = mean(r.fear for r in records)
        avg_sad = mean(r.sad for r in records)
        avg_angry = mean(r.angry for r in records)
        avg_disgust = mean(r.disgust for r in records)
        avg_surprise = mean(r.surprise for r in records)

        # ── 2. Stability Score ───────────────────────────────────────────────
        # Count transitions of dominant emotions between consecutive frames
        transitions = 0
        for i in range(1, len(records)):
            if records[i].dominant_emotion != records[i - 1].dominant_emotion:
                transitions += 1

        # Volatility percentage relative to frame count
        volatility = transitions / len(records) if len(records) > 1 else 0.0
        # 0 transitions = 100 stability, constant changes drop score quickly
        stability_score = max(10.0, min(100.0, 100.0 - (volatility * 200.0)))

        # ── 3. Eye Contact / Camera Focus ────────────────────────────────────
        # Frontal-face detection ratio based on expected frame throughput
        # Assume 5 FPS target rate
        expected_frames = max(1.0, duration_seconds * 5.0)
        detection_ratio = min(1.0, len(records) / expected_frames)

        # Calculate bounding box alignment relative to center of a 480x360 frame
        alignments = []
        for r in records:
            # Face center relative to 480x360 canvas
            cx = r.box_x + (r.box_w / 2.0)
            cy = r.box_y + (r.box_h / 2.0)
            off_x = abs(cx - 240.0) / 240.0
            off_y = abs(cy - 180.0) / 180.0
            alignments.append((off_x + off_y) / 2.0)
            
        avg_off_center = mean(alignments) if alignments else 0.2
        alignment_factor = max(0.0, 1.0 - (avg_off_center * 2.0))

        # Eye contact merges presence (70%) and camera centering (30%)
        eye_contact_score = (detection_ratio * 70.0) + (alignment_factor * 30.0)
        eye_contact_score = max(10.0, min(100.0, eye_contact_score))

        # ── 4. Speaking Energy ───────────────────────────────────────────────
        # Calculated from bounding box size variations (indicates talking/expressive movements)
        # and positive animation score
        w_dev = pstdev(r.box_w for r in records) if len(records) > 1 else 1.0
        h_dev = pstdev(r.box_h for r in records) if len(records) > 1 else 1.0
        box_variance = (w_dev + h_dev) / 2.0
        
        # Max out box variance scoring around 15 pixels of deviation
        variance_factor = min(1.0, box_variance / 15.0)
        expressiveness = (avg_happy * 0.4) + (avg_surprise * 0.3) + (avg_neutral * 0.1)
        
        speaking_energy = (variance_factor * 60.0) + (expressiveness * 0.4) + 20.0
        speaking_energy = max(10.0, min(100.0, speaking_energy))

        # ── 5. Confidence Score Formula ──────────────────────────────────────
        # Confidence increases with happy/neutral balance and stability/focus
        # Decreases with fear, sad, angry weights, and high emotional volatility
        positives = (avg_happy * 1.2) + (avg_neutral * 1.0) + (avg_surprise * 0.4)
        negatives = (avg_fear * 1.5) + (avg_sad * 1.0) + (avg_angry * 1.0) + (avg_disgust * 1.2)
        
        confidence_base = 50.0 + (positives - negatives)
        
        # Adjust base using stability and eye contact factors
        confidence_score = (
            confidence_base * 0.6 +
            stability_score * 0.2 +
            eye_contact_score * 0.2
        )
        # Bound confidence score cleanly
        confidence_score = max(5.0, min(100.0, confidence_score))

        logger.info(
            f"[ConfidenceEngine] Metrics generated: "
            f"conf={confidence_score:.1f} stab={stability_score:.1f} "
            f"eye={eye_contact_score:.1f} energy={speaking_energy:.1f}"
        )

        return {
            "confidence_score": round(confidence_score, 1),
            "stability_score": round(stability_score, 1),
            "eye_contact_score": round(eye_contact_score, 1),
            "speaking_energy": round(speaking_energy, 1),
        }

# Singleton instance
confidence_service = ConfidenceService()
