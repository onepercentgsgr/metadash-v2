"""Chat Launch Agent routes — separate router to be included in main.py."""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User, TenantConfig
from auth_utils import get_current_user_from_header
from agents.chat_launch_agent import chat_with_agent

router = APIRouter(prefix="/agents/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    history: list = []
    state: dict = {}


@router.post("/launch")
async def chat_launch(
    req: ChatRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    current_user = get_current_user_from_header(authorization=authorization, db=db)

    config = db.query(TenantConfig).filter(TenantConfig.user_id == current_user.id).first()
    api_key = None
    if config and config.anthropic_api_key and "***" not in config.anthropic_api_key:
        api_key = config.anthropic_api_key
    if not api_key:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="No Anthropic API key configured")

    # Capture mutable references for the generator closure
    state = dict(req.state)
    history = list(req.history)

    def generate():
        yield from chat_with_agent(
            message=req.message,
            history=history,
            state=state,
            user_id=current_user.id,
            db=db,
            api_key=api_key,
        )

    return StreamingResponse(generate(), media_type="text/event-stream")
