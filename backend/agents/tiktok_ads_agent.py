"""
TikTok Ads Agent — Paid (Nivel Dios)

Reads shared memory (product, market, current Meta Ads metrics if any),
generates a TikTok Ads paid strategy + adset structure + budget plan +
optimization rules ("don't burn money"), and saves the result back.
"""

import json
import logging
import os
from typing import Optional

import anthropic
from sqlalchemy.orm import Session

from agents.shared_memory import SharedMemoryStore

logger = logging.getLogger(__name__)


def _build_prompt(mode: str, payload: dict, memory_context: dict) -> str:
    """
    Build the TikTok Ads prompt.
    `mode` selects what to generate: "strategy" (full launch plan) or
    "optimize" (decisions over current metrics, no-burn rules).
    """
    pais = memory_context.get("pais", "LATAM")
    moneda = memory_context.get("moneda", "USD")
    product = memory_context.get("product", {})
    meta_metrics = memory_context.get("campaign_data", {})

    common = f"""
═══════════════════════════════════════════════════════
CONTEXTO COMPARTIDO (memoria multi-agente)
═══════════════════════════════════════════════════════
• Mercado: {pais} | Moneda: {moneda}
• Producto: {json.dumps(product, ensure_ascii=False)}
• Métricas actuales en Meta Ads (si existen): {json.dumps(meta_metrics, ensure_ascii=False)}
• Datos del usuario para esta corrida: {json.dumps(payload, ensure_ascii=False)}

REGLAS ABSOLUTAS PARA NO QUEMAR PLATA EN TIKTOK ADS:
1. Empezar con presupuesto chico — máximo 5x el ticket del producto por adset/día.
2. Aprender 3-5 días antes de tocar nada — TikTok necesita data para optimizar.
3. Pausar adset si CPM > 2x el promedio o frecuencia > 3 sin ventas.
4. Escalar SOLO con +20-30% si ROAS supera el breakeven por 3 días seguidos.
5. Cada creatividad probada como variante separada — nunca mezclar formatos.
6. Adaptar TODO al tono cultural de {pais} — TikTok castiga lo que parece traducción.
"""

    if mode == "strategy":
        return f"""Actuás como el mejor estratega de TikTok Ads paid para infoproductos en {pais}.
{common}

═══════════════════════════════════════════════════════
TAREA: Plan de Lanzamiento de TikTok Ads — Paso a Paso
═══════════════════════════════════════════════════════
Generá un plan completo accionable hoy, con estas secciones:

## 1. ESTRUCTURA DE CUENTA
- Cuántas campañas crear, con qué objetivo, y por qué
- Cuántos adsets por campaña, con qué segmentación

## 2. PRESUPUESTO INICIAL
- Budget diario por adset (en {moneda})
- Cuándo escalar y cuándo cortar
- Threshold mínimo para tomar decisiones

## 3. AUDIENCIAS A TESTEAR (top 5)
Para cada una: nombre, intereses/comportamientos exactos, edad, género, tamaño estimado en {pais}

## 4. CREATIVIDADES — 5 FORMATOS A PROBAR
Para cada formato: hook (3 seg), guion 15-30 seg, CTA, por qué funciona en TikTok {pais}

## 5. REGLAS AUTOMÁTICAS DE OPTIMIZACIÓN
- Cuándo pausar (CPM, CTR, frecuencia)
- Cuándo escalar (ROAS, días, consistencia)
- Cuándo duplicar adsets
- Cuándo refrescar creatividades

## 6. KPIs DE ÉXITO PARA {pais}
- CPM esperado
- CTR objetivo
- CPL/CPA objetivo
- ROAS mínimo para escalar"""

    # mode == "optimize"
    return f"""Actuás como el mejor optimizador de TikTok Ads paid para infoproductos en {pais}.
{common}

═══════════════════════════════════════════════════════
TAREA: Decisión de Optimización HOY (no quemar plata)
═══════════════════════════════════════════════════════
Con los datos actuales, generá:

## 1. DIAGNÓSTICO EN 3 LÍNEAS
La salud actual de la cuenta de TikTok Ads — sin rodeos.

## 2. ACCIONES URGENTES (próximas 24hs)
Lista numerada: qué pausar, qué escalar, qué duplicar, qué dejar correr.
Para cada acción: el criterio numérico que la justifica.

## 3. RIESGO DE QUEMA DE PRESUPUESTO
- ¿Qué adsets están en zona roja?
- ¿Cuánto se está perdiendo por día si no actuás?

## 4. PRÓXIMA CREATIVIDAD A LANZAR
Hook + guion 15s listo para grabar, basado en lo que ya funciona/falla.

## 5. KPIs A MONITOREAR EN LAS PRÓXIMAS 48HS
Lista corta y concreta."""


def run_tiktok_ads(
    db: Session,
    user_id: int,
    mode: str,
    payload: dict,
    api_key: Optional[str] = None,
    model: str = "claude-opus-4-7",
) -> str:
    """
    Run the TikTok Ads paid agent.

    mode: "strategy" (full launch plan) | "optimize" (decisions on current data)
    payload: extra inputs from the user for this run (free-form dict)
    """
    if mode not in ("strategy", "optimize"):
        raise ValueError(f"Unknown tiktok_ads mode: {mode}")

    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    memory = SharedMemoryStore(db, user_id)
    memory_context = memory.get_full_context()

    prompt = _build_prompt(mode, payload or {}, memory_context)

    client = anthropic.Anthropic(api_key=key)
    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    output = message.content[0].text

    # Save to shared memory so other agents can read it
    memory.write(
        f"tiktok_ads.{mode}",
        {"output": output, "payload": payload or {}},
        agent="tiktok_ads_agent",
        memory_type="campaign",
    )
    memory.add_insight(f"TikTok Ads ({mode}) — output generated", agent="tiktok_ads_agent")

    logger.info(f"[tiktok_ads_agent] mode={mode} user={user_id} output_len={len(output)}")
    return output
