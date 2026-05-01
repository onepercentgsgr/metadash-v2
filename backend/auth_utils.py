"""Shared auth utilities — imported by main.py and sub-routers to avoid circular imports."""
import logging
import jwt
from typing import Optional
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
import config

logger = logging.getLogger(__name__)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        try:
            user_id: int = int(sub)
        except (ValueError, TypeError):
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_from_header(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    try:
        token = authorization.replace("Bearer ", "")
        if not token or len(token) < 10:
            raise HTTPException(status_code=401, detail="Invalid token format")
        payload = verify_token(token)
        user_id = payload.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"auth: unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
