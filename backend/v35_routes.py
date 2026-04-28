"""v3.5 routes: Stripe checkout + daily videos. Mounted from main.py."""
import os
import json
import logging
from datetime import datetime, date
from typing import Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User, Subscription, GeneratedVideo

logger = logging.getLogger(__name__)
router = APIRouter()


class CheckoutRequest(BaseModel):
    price_id: str = ""
    success_url: str
    cancel_url: str


def _get_user(authorization: Optional[str], db: Session) -> User:
    """Local copy of header auth — avoids circular import from main.py."""
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


@router.post("/checkout/session")
async def create_checkout_session(
    request: CheckoutRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe not configured")
    price_id = request.price_id or os.getenv("STRIPE_PRICE_ID", "")
    if not price_id:
        raise HTTPException(status_code=400, detail="STRIPE_PRICE_ID not configured")
    try:
        import stripe as stripe_lib
        stripe_lib.api_key = stripe_key
        session = stripe_lib.checkout.Session.create(
            customer_email=user.email,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=request.success_url + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            metadata={"user_id": str(user.id)},
        )
        return {"session_url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks/stripe")
async def stripe_webhook_handler(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    try:
        import stripe as stripe_lib
        stripe_lib.api_key = os.getenv("STRIPE_SECRET_KEY", "")
        if webhook_secret:
            event = stripe_lib.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = stripe_lib.Event.construct_from(json.loads(payload), stripe_lib.api_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] in ("checkout.session.completed", "invoice.payment_succeeded"):
        obj = event["data"]["object"]
        user_id_str = obj.get("metadata", {}).get("user_id", "")
        if user_id_str:
            user_id = int(user_id_str)
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.has_paid = True
                user.paid_at = datetime.utcnow()
                sub = db.query(Subscription).filter(
                    Subscription.user_id == user_id
                ).order_by(Subscription.created_at.desc()).first()
                if sub:
                    sub.plan = "pro"
                    sub.status = "active"
                db.commit()
                logger.info(f"User {user_id} marked as paid")

    return {"received": True}


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
