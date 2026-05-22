"""
app/routes/scripts.py

API router for public speaking script presets.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/scripts", tags=["Scripts"])

class ScriptPreset(BaseModel):
    id: str
    title: str
    category: str
    text: str

PRESETS = [
    ScriptPreset(
        id="pitch",
        title="Elevator Pitch Opening",
        category="Public Speaking",
        text="Hello everyone. Today, I want to share a story about transformation. In a world full of rapid technological developments, we often forget the core element of any successful system: human connection. When we communicate, our expressions tell a story far deeper than our words alone."
    ),
    ScriptPreset(
        id="roadmap",
        title="Roadmap Presentation Pitch",
        category="Public Speaking",
        text="Good morning. I am excited to present our product roadmap for the next quarter. We are focusing on three main pillars: performance stability, clean architecture standards, and user-centric features. Let's dive into how these updates will impact our growth and scalability."
    ),
    ScriptPreset(
        id="self-intro",
        title="Tell Me About Yourself",
        category="Interview Prep",
        text="Thank you for this opportunity. I am a software engineer passionate about building scalable, high-performance web systems. Throughout my career, I've prioritized code quality, performance optimization, and clean architectural principles. I enjoy solving complex problems and collaborating with cross-functional teams."
    ),
    ScriptPreset(
        id="star-answer",
        title="Behavioral Challenge Answer",
        category="Interview Prep",
        text="One of the most challenging situations I faced was leading a database migration with zero downtime. I coordinated with team members, set up structured replication tasks, and performed thorough regression testing. The migration was completed successfully, improving our query latency by 40%."
    ),
    ScriptPreset(
        id="affirmation",
        title="Confidence Affirmation Mirror Drill",
        category="Confidence Building",
        text="I am confident, expressive, and clear in my speech. Every word I say has purpose, and I project authority through my presence. I maintain eye contact, speak at a comfortable pace, and adapt my tone to engage my audience. I embrace challenging situations as opportunities to learn and grow."
    )
]

@router.get(
    "/presets",
    response_model=List[ScriptPreset],
    status_code=status.HTTP_200_OK,
    summary="Get script presets for public speaking practice",
    description="Returns a collection of structured, pre-defined prompts and scripts."
)
async def get_presets():
    return PRESETS
