"""v3.5 routes: MercadoPago checkout + daily videos. Mounted from main.py."""
import os
import logging
from datetime import datetime, date
from typing import Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, Subscription, GeneratedVideo
import payments

logger = logging.getLogger(__name__)
router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

ARS_PLANS = {
    "starter": 19900,
    "pro": 29900,
    "enterprise": 79900,
}


def _get_user(authorization: Optional[str], db: Session) -> User:
    """Extract user from Bearer token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    import jwt
    import config
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/checkout/mercadopago")
async def create_mercadopago_checkout(
    plan: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)

    if plan not in ARS_PLANS:
        raise HTTPException(status_code=400, detail=f"Plan '{plan}' not found")

    try:
        checkout_url = payments.create_checkout(
            user_id=user.id,
            plan=plan,
            db=db,
            frontend_url=FRONTEND_URL
        )
        if not checkout_url:
            raise HTTPException(status_code=500, detail="Could not create checkout")
        return {"success": True, "checkout_url": checkout_url, "plan": plan}
    except Exception as e:
        logger.error(f"MercadoPago checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/mercadopago")
async def mercadopago_webhook_handler(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        success = payments.handle_webhook(body, db)
        return {"received": True, "status": "success" if success else "processed"}
    except Exception as e:
        logger.error(f"MercadoPago webhook error: {e}")
        return {"received": True, "status": "error"}


@router.post("/auth/onboard")
async def mark_onboarded(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    user.onboarded_at = datetime.utcnow()
    db.commit()
    return {"onboarded_at": user.onboarded_at}


@router.get("/videos/daily")
async def get_daily_video(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    today = date.today().isoformat()
    video = db.query(GeneratedVideo).filter(
        GeneratedVideo.user_id == user.id,
        GeneratedVideo.date == today,
    ).order_by(GeneratedVideo.created_at.desc()).first()
    if not video:
        return {"video": None, "date": today}
    return {
        "video": {
            "id": video.id,
            "content": video.content,
            "angle": video.angle,
            "date": video.date,
            "created_at": video.created_at.isoformat(),
        },
        "date": today,
    }


@router.get("/videos/history")
async def get_video_history(
    limit: int = 30,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    videos = db.query(GeneratedVideo).filter(
        GeneratedVideo.user_id == user.id
    ).order_by(GeneratedVideo.created_at.desc()).limit(limit).all()
    return [
        {
            "id": v.id,
            "content": v.content,
            "angle": v.angle,
            "date": v.date,
            "created_at": v.created_at.isoformat(),
        }
        for v in videos
    ]
