"""
app/routes/interviews.py

API router for the AI Interview Coach.
"""

from typing import List
from fastapi import APIRouter, Query, status
from pydantic import BaseModel

router = APIRouter(prefix="/interviews", tags=["Interviews"])


class InterviewQuestion(BaseModel):
    id: str
    category: str
    text: str


QUESTIONS = {
    "self_intro": [
        InterviewQuestion(id="si_1", category="Self Introduction", text="Tell me about yourself and your technical background."),
        InterviewQuestion(id="si_2", category="Self Introduction", text="Why did you choose engineering/development as a career?"),
        InterviewQuestion(id="si_3", category="Self Introduction", text="What projects or technical achievements are you most proud of?"),
        InterviewQuestion(id="si_4", category="Self Introduction", text="How do you stay up-to-date with new technologies and frameworks?"),
    ],
    "hr": [
        InterviewQuestion(id="hr_1", category="HR Interview", text="Why do you want to work for our company specifically?"),
        InterviewQuestion(id="hr_2", category="HR Interview", text="What are your greatest professional strengths and weaknesses?"),
        InterviewQuestion(id="hr_3", category="HR Interview", text="Where do you see yourself in five years?"),
        InterviewQuestion(id="hr_4", category="HR Interview", text="How do you handle high-pressure environments and tight deadlines?"),
        InterviewQuestion(id="hr_5", category="HR Interview", text="Why should we hire you over other candidates?"),
    ],
    "behavioral": [
        InterviewQuestion(id="beh_1", category="Behavioral", text="Describe a time when you faced a difficult technical challenge and how you overcame it."),
        InterviewQuestion(id="beh_2", category="Behavioral", text="Tell me about a time you had a conflict with a teammate. How did you resolve it?"),
        InterviewQuestion(id="beh_3", category="Behavioral", text="Give an example of a time when you had to work under tight deadlines. How did you prioritize?"),
        InterviewQuestion(id="beh_4", category="Behavioral", text="Describe a situation where you had to adapt quickly to a major change in a project's requirements."),
        InterviewQuestion(id="beh_5", category="Behavioral", text="Tell me about a time you failed to meet a goal. What did you learn from that experience?"),
    ]
}


@router.get(
    "/questions",
    response_model=List[InterviewQuestion],
    status_code=status.HTTP_200_OK,
    summary="Get interview questions",
    description="Returns pre-defined interview questions based on the requested interview mode.",
)
async def get_interview_questions(
    mode: str = Query("self_intro", description="Interview mode: self_intro, hr, or behavioral")
):
    # Default to self_intro if not matching
    if mode not in QUESTIONS:
        mode = "self_intro"
    return QUESTIONS[mode]
