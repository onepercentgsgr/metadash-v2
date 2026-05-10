"""
Master Sky integration routes.

Endpoints públicos detrás de un API key fijo (NO el JWT user-auth normal),
para que un dashboard agregador externo (Master Sky) pueda:

- Leer stats de MetaDash (cantidad de usuarios, MRR, runs, validaciones)
- Listar y ver detalle de cada usuario
- Pausar / despausar / eliminar usuarios
- Marcar como pagado / cambiar plan

Auth: header `X-Master-Sky-Key` debe coincidir con el env var
`MASTER_SKY_API_KEY`. Si no está configurado, los endpoints devuelven 503.
Cada request loggea para auditoría.

Mismo patrón que AGP usa en su backend: clave fija, no JWT, no usuarios.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import (
    User, Subscription, PipelineRun, MarketValidation, CompetitorAnalysis,
    AgentLog, TenantConfig,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/master-sky", tags=["master-sky"])


# Pricing reference para calcular MRR / saldo a cobrar.
# Mantener sincronizado con tu landing y plan_limits.
PLAN_PRICING_USD = {
    "trial":       0,
    "starter":    19,
    "pro":        49,
    "enterprise": 149,
}


def _verify_master_sky_key(x_master_sky_key: Optional[str] = Header(None)) -> None:
    """Verifica el header X-Master-Sky-Key contra el env var."""
    expected = os.getenv("MASTER_SKY_API_KEY", "")
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Master Sky integration not configured (MASTER_SKY_API_KEY env var missing)",
        )
    if not x_master_sky_key:
        raise HTTPException(status_code=401, detail="Missing X-Master-Sky-Key header")
    if x_master_sky_key != expected:
        logger.warning(f"[master-sky] invalid key attempt — first 8 chars: {x_master_sky_key[:8]}")
        raise HTTPException(status_code=403, detail="Invalid Master Sky API key")


def _user_brief(u: User, db: Session) -> dict:
    """Resumen de usuario para listas — incluye plan actual y métricas básicas."""
    sub = db.query(Subscription).filter(
        Subscription.user_id == u.id,
        Subscription.status == "active",
    ).order_by(Subscription.created_at.desc()).first()

    plan = sub.plan if sub else "trial"
    sub_status = sub.status if sub else "no_subscription"

    runs_count = db.query(func.count(PipelineRun.id)).filter(
        PipelineRun.user_id == u.id,
    ).scalar() or 0

    last_run = db.query(PipelineRun.started_at).filter(
        PipelineRun.user_id == u.id,
    ).order_by(PipelineRun.started_at.desc()).first()

    monthly_value = PLAN_PRICING_USD.get(plan, 0)

    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "is_active": u.is_active,
        "has_paid": u.has_paid,
        "paid_at": u.paid_at.isoformat() if u.paid_at else None,
        "onboarded_at": u.onboarded_at.isoformat() if u.onboarded_at else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "current_plan": plan,
        "subscription_status": sub_status,
        "pipeline_runs_total": runs_count,
        "last_pipeline_at": last_run[0].isoformat() if last_run else None,
        "estimated_monthly_value_usd": monthly_value,
        "owes_payment": (sub is not None and sub.plan != "trial" and not u.has_paid),
    }


# ─────────────────────────── Stats globales ───────────────────────────

@router.get("/stats", dependencies=[Depends(_verify_master_sky_key)])
async def stats_endpoint(db: Session = Depends(get_db)):
    """Snapshot completo del estado de MetaDash. Lo que pinta el botón 'stats'."""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = datetime(now.year, now.month, 1)

    # Users
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    paused_users = total_users - active_users
    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_week = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    new_month = db.query(func.count(User.id)).filter(User.created_at >= month_start).scalar() or 0

    role_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    # Subscriptions
    plan_counts = dict(
        db.query(Subscription.plan, func.count(Subscription.id))
        .filter(Subscription.status == "active")
        .group_by(Subscription.plan).all()
    )
    status_counts = dict(
        db.query(Subscription.status, func.count(Subscription.id))
        .group_by(Subscription.status).all()
    )

    # Billing — MRR estimado y saldo a cobrar
    mrr = 0
    pending = 0
    paid_users = 0
    unpaid_users = 0
    active_subs = db.query(Subscription, User).join(
        User, Subscription.user_id == User.id
    ).filter(Subscription.status == "active").all()
    for sub, user in active_subs:
        price = PLAN_PRICING_USD.get(sub.plan, 0)
        if sub.plan == "trial":
            continue
        if user.has_paid:
            mrr += price
            paid_users += 1
        else:
            pending += price
            unpaid_users += 1

    # Activity
    runs_today = db.query(func.count(PipelineRun.id)).filter(PipelineRun.started_at >= today_start).scalar() or 0
    runs_week = db.query(func.count(PipelineRun.id)).filter(PipelineRun.started_at >= week_start).scalar() or 0
    runs_month = db.query(func.count(PipelineRun.id)).filter(PipelineRun.started_at >= month_start).scalar() or 0

    validations_month = db.query(func.count(MarketValidation.id)).filter(
        MarketValidation.created_at >= month_start
    ).scalar() or 0
    analyses_month = db.query(func.count(CompetitorAnalysis.id)).filter(
        CompetitorAnalysis.created_at >= month_start
    ).scalar() or 0

    last_pipeline = db.query(PipelineRun.started_at).order_by(
        PipelineRun.started_at.desc()
    ).first()
    last_signup = db.query(User.created_at).order_by(User.created_at.desc()).first()

    # Health
    has_global_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    db_ok = True  # if we got here, db works

    return {
        "service": "metadash",
        "status": "ok",
        "timestamp": now.isoformat() + "Z",
        "users": {
            "total": total_users,
            "active": active_users,
            "paused": paused_users,
            "new_today": new_today,
            "new_this_week": new_week,
            "new_this_month": new_month,
            "by_role": role_counts,
        },
        "subscriptions": {
            "by_plan": plan_counts,
            "by_status": status_counts,
        },
        "billing": {
            "currency": "USD",
            "monthly_recurring_revenue": mrr,
            "pending_collection": pending,
            "paid_users": paid_users,
            "unpaid_users": unpaid_users,
            "pricing": PLAN_PRICING_USD,
        },
        "activity": {
            "pipeline_runs_today": runs_today,
            "pipeline_runs_this_week": runs_week,
            "pipeline_runs_this_month": runs_month,
            "market_validations_this_month": validations_month,
            "competitor_analyses_this_month": analyses_month,
            "last_pipeline_at": last_pipeline[0].isoformat() if last_pipeline else None,
            "last_signup_at": last_signup[0].isoformat() if last_signup else None,
        },
        "health": {
            "anthropic_global_key_configured": has_global_anthropic,
            "db_ok": db_ok,
        },
    }


# ─────────────────────────── Users CRUD ───────────────────────────

@router.get("/users", dependencies=[Depends(_verify_master_sky_key)])
async def list_users_endpoint(
    db: Session = Depends(get_db),
    limit: int = 200,
    offset: int = 0,
    only_active: bool = False,
    only_unpaid: bool = False,
    plan: Optional[str] = None,
):
    """Lista usuarios para el botón 'stats' del Master Sky."""
    q = db.query(User)
    if only_active:
        q = q.filter(User.is_active == True)
    if only_unpaid:
        q = q.filter(User.has_paid == False)
    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    items = [_user_brief(u, db) for u in users]
    if plan:
        items = [i for i in items if i["current_plan"] == plan]

    return {
        "total_returned": len(items),
        "users": items,
    }


@router.get("/users/{user_id}", dependencies=[Depends(_verify_master_sky_key)])
async def user_detail_endpoint(user_id: int, db: Session = Depends(get_db)):
    """Detalle completo de un usuario — lo que se ve al clickear su tarjeta."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    base = _user_brief(user, db)

    subs = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).order_by(Subscription.created_at.desc()).all()

    runs = db.query(PipelineRun).filter(
        PipelineRun.user_id == user_id
    ).order_by(PipelineRun.started_at.desc()).limit(20).all()

    cfg = db.query(TenantConfig).filter(TenantConfig.user_id == user_id).first()

    return {
        **base,
        "tenant_config": {
            "anthropic_api_key_configured": bool(cfg and cfg.anthropic_api_key),
            "meta_access_token_configured": bool(cfg and cfg.meta_access_token),
            "shopify_store_url": cfg.shopify_store_url if cfg else None,
            "landing_page_url": cfg.landing_page_url if cfg else None,
            "negocio_info": (cfg.negocio_info if cfg else None) or None,
        } if cfg else None,
        "subscriptions": [
            {
                "id": s.id,
                "plan": s.plan,
                "status": s.status,
                "trial_start": s.trial_start.isoformat() if s.trial_start else None,
                "trial_end": s.trial_end.isoformat() if s.trial_end else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in subs
        ],
        "recent_pipelines": [
            {
                "run_id": r.run_id,
                "status": r.status,
                "product_name": r.product_name,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "duration_seconds": r.duration_seconds,
            }
            for r in runs
        ],
    }


# ─────────────────────────── Acciones de gestión ───────────────────────────

@router.post("/users/{user_id}/pause", dependencies=[Depends(_verify_master_sky_key)])
async def pause_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    logger.info(f"[master-sky] paused user {user_id} ({user.email})")
    return {"ok": True, "user_id": user_id, "is_active": False}


@router.post("/users/{user_id}/unpause", dependencies=[Depends(_verify_master_sky_key)])
async def unpause_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    logger.info(f"[master-sky] unpaused user {user_id} ({user.email})")
    return {"ok": True, "user_id": user_id, "is_active": True}


@router.post("/users/{user_id}/mark-paid", dependencies=[Depends(_verify_master_sky_key)])
async def mark_user_paid_endpoint(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.has_paid = True
    user.paid_at = datetime.utcnow()
    db.commit()
    logger.info(f"[master-sky] marked user {user_id} as paid")
    return {
        "ok": True,
        "user_id": user_id,
        "has_paid": True,
        "paid_at": user.paid_at.isoformat(),
    }


@router.post("/users/{user_id}/change-plan", dependencies=[Depends(_verify_master_sky_key)])
async def change_user_plan_endpoint(user_id: int, plan: str, db: Session = Depends(get_db)):
    if plan not in PLAN_PRICING_USD:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan. Must be one of: {list(PLAN_PRICING_USD.keys())}",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mark current active sub as cancelled, create new one
    current = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == "active",
    ).first()
    if current:
        current.status = "cancelled"
        current.updated_at = datetime.utcnow()

    new_sub = Subscription(user_id=user_id, plan=plan, status="active")
    db.add(new_sub)
    db.commit()
    logger.info(f"[master-sky] changed user {user_id} plan to {plan}")
    return {"ok": True, "user_id": user_id, "new_plan": plan}


@router.delete("/users/{user_id}", dependencies=[Depends(_verify_master_sky_key)])
async def delete_user_endpoint(
    user_id: int,
    hard: bool = False,
    db: Session = Depends(get_db),
):
    """
    Soft delete por defecto (is_active=False, role='deleted').
    Para hard delete cascadeado pasar ?hard=true.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "admin" and not hard:
        raise HTTPException(
            status_code=400,
            detail="No se puede pausar un admin. Usá hard=true si querés borrarlo igual.",
        )

    if hard:
        # Cascade delete user's data
        for model in (PipelineRun, MarketValidation, CompetitorAnalysis,
                      Subscription, AgentLog, TenantConfig):
            db.query(model).filter(model.user_id == user_id).delete()
        db.delete(user)
        db.commit()
        logger.info(f"[master-sky] HARD-deleted user {user_id} ({user.email})")
        return {"ok": True, "user_id": user_id, "hard_deleted": True}

    user.is_active = False
    user.role = "deleted"
    db.commit()
    logger.info(f"[master-sky] soft-deleted user {user_id} ({user.email})")
    return {"ok": True, "user_id": user_id, "soft_deleted": True}
