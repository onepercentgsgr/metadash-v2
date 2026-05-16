"""Plan limit definitions and enforcement for MetaDash."""
from fastapi import HTTPException

PLAN_LIMITS = {
    "trial": {
        "ai_generations_per_month": 20,
        "infoproductos": 1,
        "pipeline_runs_per_month": 1,
        "meta_accounts": 0,
        "autonomous_agents": False,
        "chat_launch": True,
        "war_room_sessions_per_month": 3,
        "optimizer_sessions_per_month": 5,
        "can_execute_actions": False,
    },
    "starter": {  # shown as "Emprendedor" in UI
        "ai_generations_per_month": 100,
        "infoproductos": 1,
        "pipeline_runs_per_month": 3,
        "meta_accounts": 1,
        "autonomous_agents": False,
        "chat_launch": True,
        "war_room_sessions_per_month": None,
        "optimizer_sessions_per_month": None,
        "can_execute_actions": True,
    },
    "pro": {  # shown as "Master" in UI
        "ai_generations_per_month": None,
        "infoproductos": None,
        "pipeline_runs_per_month": 10,
        "meta_accounts": 5,
        "autonomous_agents": True,
        "chat_launch": True,
        "war_room_sessions_per_month": None,
        "optimizer_sessions_per_month": None,
        "can_execute_actions": True,
    },
    "enterprise": {
        "ai_generations_per_month": None,
        "infoproductos": None,
        "pipeline_runs_per_month": None,
        "meta_accounts": None,
        "autonomous_agents": True,
        "chat_launch": True,
        "war_room_sessions_per_month": None,
        "optimizer_sessions_per_month": None,
        "can_execute_actions": True,
    },
}

PLAN_DISPLAY_NAMES = {
    "trial": "Trial",
    "starter": "Emprendedor",
    "pro": "Master",
    "enterprise": "Enterprise",
}

def get_plan_limits(plan: str) -> dict:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["trial"])

def check_feature_access(plan: str, feature: str):
    """Raise 403 if plan does not have access to feature."""
    limits = get_plan_limits(plan)
    value = limits.get(feature)
    if value is False:
        display = PLAN_DISPLAY_NAMES.get(plan, plan)
        upgrade_to = "Master" if plan in ("trial", "starter") else "Enterprise"
        raise HTTPException(
            status_code=403,
            detail=f"Tu plan {display} no incluye esta función. Upgradeá a {upgrade_to} para acceder.",
        )

def check_generation_limit(plan: str, current_count: int):
    """Raise 429 if monthly generation limit reached."""
    limits = get_plan_limits(plan)
    max_gens = limits.get("ai_generations_per_month")
    if max_gens is not None and current_count >= max_gens:
        display = PLAN_DISPLAY_NAMES.get(plan, plan)
        raise HTTPException(
            status_code=429,
            detail=f"Límite mensual de {max_gens} generaciones IA alcanzado ({display}). Upgradeá a Master para generaciones ilimitadas.",
        )

def check_pipeline_limit(plan: str, current_count_this_month: int):
    """Raise 429 if monthly Nivel Dios pipeline run limit reached."""
    limits = get_plan_limits(plan)
    max_runs = limits.get("pipeline_runs_per_month")
    if max_runs is not None and current_count_this_month >= max_runs:
        display = PLAN_DISPLAY_NAMES.get(plan, plan)
        upgrade_to = "Master" if plan in ("trial", "starter") else "Enterprise"
        raise HTTPException(
            status_code=429,
            detail=(
                f"Llegaste al límite de {max_runs} infoproductos completos este mes en plan {display}. "
                f"Upgradeá a {upgrade_to} para más runs."
            ),
        )

def check_war_room_limit(plan: str, current_count: int):
    """Raise 429 if monthly War Room session limit reached."""
    limits = get_plan_limits(plan)
    max_sessions = limits.get("war_room_sessions_per_month")
    if max_sessions is not None and current_count >= max_sessions:
        display = PLAN_DISPLAY_NAMES.get(plan, plan)
        raise HTTPException(
            status_code=429,
            detail=f"Usaste las {max_sessions} sesiones de Guerra Room de tu trial. Upgradeá a Emprendedor ($19/mes) para sesiones ilimitadas.",
        )

def check_optimizer_limit(plan: str, current_count: int):
    """Raise 429 if monthly Optimizer session limit reached."""
    limits = get_plan_limits(plan)
    max_sessions = limits.get("optimizer_sessions_per_month")
    if max_sessions is not None and current_count >= max_sessions:
        display = PLAN_DISPLAY_NAMES.get(plan, plan)
        raise HTTPException(
            status_code=429,
            detail=f"Usaste los {max_sessions} análisis de Optimizer de tu trial. Upgradeá a Emprendedor ($19/mes) para análisis ilimitados.",
        )

def check_action_permission(plan: str):
    """Raise 403 if plan cannot execute Meta actions (pause/enable)."""
    limits = get_plan_limits(plan)
    if not limits.get("can_execute_actions", True):
        raise HTTPException(
            status_code=403,
            detail="Tu trial no permite ejecutar acciones en Meta Ads. Upgradeá a Emprendedor ($19/mes) para pausar y escalar campañas.",
        )
