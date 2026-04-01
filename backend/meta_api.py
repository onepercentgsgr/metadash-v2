"""
Conexión a Meta Marketing API
Trae métricas reales de campañas, adsets y ads
"""
import httpx
from typing import Optional
from config import settings


BASE_URL = "https://graph.facebook.com/v20.0"
ACCOUNT_ID = settings.META_AD_ACCOUNT_ID


def _headers():
    return {"Authorization": f"Bearer {settings.META_ACCESS_TOKEN}"}


async def get_campaigns(date_preset: str = "last_7d") -> list[dict]:
    """Trae todas las campañas con métricas del período."""
    url = f"{BASE_URL}/{ACCOUNT_ID}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget",
        "limit": 100,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        campaigns = r.json().get("data", [])

    # Agregar insights (métricas) a cada campaña
    for campaign in campaigns:
        insights = await get_campaign_insights(campaign["id"], date_preset)
        campaign["insights"] = insights

    return campaigns


async def get_campaign_insights(campaign_id: str, date_preset: str = "last_7d") -> dict:
    """Métricas de una campaña específica."""
    url = f"{BASE_URL}/{campaign_id}/insights"
    params = {
        "fields": "impressions,clicks,spend,cpm,cpc,ctr,actions,action_values,cost_per_action_type,frequency,reach",
        "date_preset": date_preset,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        data = r.json().get("data", [])

    if not data:
        return {}

    raw = data[0]
    # Extraer compras y revenue de actions
    purchases = 0
    revenue = 0.0
    for action in raw.get("actions", []):
        if action.get("action_type") == "offsite_conversion.fb_pixel_purchase":
            purchases = int(action.get("value", 0))
    for av in raw.get("action_values", []):
        if av.get("action_type") == "offsite_conversion.fb_pixel_purchase":
            revenue = float(av.get("value", 0))

    spend = float(raw.get("spend", 0))
    clicks = int(raw.get("clicks", 0))

    return {
        "spend": spend,
        "impressions": int(raw.get("impressions", 0)),
        "reach": int(raw.get("reach", 0)),
        "clicks": clicks,
        "cpm": float(raw.get("cpm", 0)),
        "cpc": float(raw.get("cpc", 0)),
        "ctr": float(raw.get("ctr", 0)),
        "frequency": float(raw.get("frequency", 0)),
        "purchases": purchases,
        "revenue": revenue,
        "cpa": round(spend / purchases, 2) if purchases > 0 else None,
        "roas": round(revenue / spend, 2) if spend > 0 else None,
    }


async def get_ads(date_preset: str = "last_7d") -> list[dict]:
    """Trae todos los ads activos con métricas."""
    url = f"{BASE_URL}/{ACCOUNT_ID}/ads"
    params = {
        "fields": "id,name,status,adset_id,creative{thumbnail_url,body,title}",
        "limit": 200,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        ads = r.json().get("data", [])

    for ad in ads:
        insights = await _get_ad_insights(ad["id"], date_preset)
        ad["insights"] = insights

    return ads


async def _get_ad_insights(ad_id: str, date_preset: str) -> dict:
    url = f"{BASE_URL}/{ad_id}/insights"
    params = {
        "fields": "impressions,clicks,spend,cpm,cpc,ctr,actions,action_values,frequency",
        "date_preset": date_preset,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=_headers(), params=params)
        r.raise_for_status()
        data = r.json().get("data", [])

    if not data:
        return {}

    raw = data[0]
    purchases = 0
    spend = float(raw.get("spend", 0))
    for action in raw.get("actions", []):
        if action.get("action_type") == "offsite_conversion.fb_pixel_purchase":
            purchases = int(action.get("value", 0))

    return {
        "spend": spend,
        "clicks": int(raw.get("clicks", 0)),
        "cpm": float(raw.get("cpm", 0)),
        "cpc": float(raw.get("cpc", 0)),
        "ctr": float(raw.get("ctr", 0)),
        "frequency": float(raw.get("frequency", 0)),
        "purchases": purchases,
        "cpa": round(spend / purchases, 2) if purchases > 0 else None,
    }


async def pause_campaign(campaign_id: str) -> bool:
    url = f"{BASE_URL}/{campaign_id}"
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url, headers=_headers(), data={"status": "PAUSED"}
        )
        return r.status_code == 200


async def enable_campaign(campaign_id: str) -> bool:
    url = f"{BASE_URL}/{campaign_id}"
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url, headers=_headers(), data={"status": "ACTIVE"}
        )
        return r.status_code == 200
