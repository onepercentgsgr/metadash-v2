"""
Conexión a Meta Marketing API v20.0
Trae métricas reales de campañas, adsets y ads
Acepta credenciales por parámetro (multi-tenant)
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

BASE_URL = "https://graph.facebook.com/v20.0"


def _headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


async def get_campaigns(
    access_token: str,
    ad_account_id: str,
    date_preset: str = "last_7d",
) -> list[dict]:
    """Trae todas las campañas con métricas del período."""
    # Asegurar formato act_XXXXX
    if not ad_account_id.startswith("act_"):
        ad_account_id = f"act_{ad_account_id}"

    url = f"{BASE_URL}/{ad_account_id}/campaigns"
    params = {
        "fields": "id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time",
        "limit": 100,
    }

    logger.info(f"Meta API: Fetching campaigns from {ad_account_id}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
        if r.status_code != 200:
            logger.error(f"Meta API error {r.status_code}: {r.text[:500]}")
            r.raise_for_status()
        campaigns = r.json().get("data", [])

    logger.info(f"Meta API: Found {len(campaigns)} campaigns")

    # Agregar insights (métricas) a cada campaña
    for campaign in campaigns:
        try:
            insights = await get_campaign_insights(
                access_token, campaign["id"], date_preset
            )
            campaign["insights"] = insights
        except Exception as e:
            logger.warning(f"Meta API: Failed to get insights for {campaign['id']}: {e}")
            campaign["insights"] = {}

    return campaigns


async def get_campaign_insights(
    access_token: str,
    campaign_id: str,
    date_preset: str = "last_7d",
) -> dict:
    """Métricas de una campaña específica."""
    url = f"{BASE_URL}/{campaign_id}/insights"
    params = {
        "fields": "impressions,clicks,spend,cpm,cpc,ctr,actions,action_values,cost_per_action_type,frequency,reach",
        "date_preset": date_preset,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
        if r.status_code != 200:
            return {}
        data = r.json().get("data", [])

    if not data:
        return {}

    raw = data[0]
    # Extraer compras y revenue de actions
    purchases = 0
    revenue = 0.0
    for action in raw.get("actions", []):
        at = action.get("action_type", "")
        if at in ("offsite_conversion.fb_pixel_purchase", "purchase"):
            purchases += int(action.get("value", 0))
    for av in raw.get("action_values", []):
        at = av.get("action_type", "")
        if at in ("offsite_conversion.fb_pixel_purchase", "purchase"):
            revenue += float(av.get("value", 0))

    spend = float(raw.get("spend", 0))
    clicks = int(raw.get("clicks", 0))
    impressions = int(raw.get("impressions", 0))

    return {
        "spend": spend,
        "impressions": impressions,
        "reach": int(raw.get("reach", 0)),
        "clicks": clicks,
        "cpm": float(raw.get("cpm", 0)),
        "cpc": float(raw.get("cpc", 0)) if clicks > 0 else 0,
        "ctr": float(raw.get("ctr", 0)),
        "frequency": float(raw.get("frequency", 0)),
        "purchases": purchases,
        "revenue": revenue,
        "cpa": round(spend / purchases, 2) if purchases > 0 else None,
        "roas": round(revenue / spend, 2) if spend > 0 else None,
    }


async def get_ads(
    access_token: str,
    ad_account_id: str,
    date_preset: str = "last_7d",
) -> list[dict]:
    """Trae todos los ads activos con métricas."""
    if not ad_account_id.startswith("act_"):
        ad_account_id = f"act_{ad_account_id}"

    url = f"{BASE_URL}/{ad_account_id}/ads"
    params = {
        "fields": "id,name,status,adset_id,creative{thumbnail_url,body,title}",
        "limit": 200,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
        if r.status_code != 200:
            return []
        ads = r.json().get("data", [])

    for ad in ads:
        try:
            insights = await _get_ad_insights(access_token, ad["id"], date_preset)
            ad["insights"] = insights
        except Exception:
            ad["insights"] = {}

    return ads


async def _get_ad_insights(access_token: str, ad_id: str, date_preset: str) -> dict:
    url = f"{BASE_URL}/{ad_id}/insights"
    params = {
        "fields": "impressions,clicks,spend,cpm,cpc,ctr,actions,action_values,frequency",
        "date_preset": date_preset,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=_headers(access_token), params=params)
        if r.status_code != 200:
            return {}
        data = r.json().get("data", [])

    if not data:
        return {}

    raw = data[0]
    purchases = 0
    spend = float(raw.get("spend", 0))
    for action in raw.get("actions", []):
        at = action.get("action_type", "")
        if at in ("offsite_conversion.fb_pixel_purchase", "purchase"):
            purchases += int(action.get("value", 0))

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


async def pause_campaign(access_token: str, campaign_id: str) -> bool:
    url = f"{BASE_URL}/{campaign_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            url, headers=_headers(access_token), data={"status": "PAUSED"}
        )
        return r.status_code == 200


async def enable_campaign(access_token: str, campaign_id: str) -> bool:
    url = f"{BASE_URL}/{campaign_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            url, headers=_headers(access_token), data={"status": "ACTIVE"}
        )
        return r.status_code == 200
