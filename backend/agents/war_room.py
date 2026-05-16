import anthropic
import json
import re
import os
import logging

logger = logging.getLogger(__name__)


def run_war_room(
    campaigns_data: list,
    adsets_data: list,
    ads_data: list,
    negocio_info: str,
    target_margin: float,  # % 0-100
    clarity_insights: str,
    api_key: str,
) -> dict:
    breakeven_roas = round(100 / target_margin, 2) if target_margin > 0 else 2.0

    client = anthropic.Anthropic(api_key=api_key)

    campaigns_json = json.dumps(campaigns_data, ensure_ascii=False)
    adsets_json = json.dumps(adsets_data, ensure_ascii=False)
    ads_json = json.dumps(ads_data, ensure_ascii=False)

    # Fase 1 — Optimizer
    fase1_text = "Análisis no disponible"
    try:
        system1 = f"Eres un Media Buyer Senior analizando cuentas publicitarias de infoproductos.\n\nCONTEXTO DEL NEGOCIO:\n{negocio_info}"
        resp1 = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            system=[{"type": "text", "text": system1, "cache_control": {"type": "ephemeral"}}],
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"CAMPAÑAS:\n{campaigns_json}\n\n"
                        f"ADSETS:\n{adsets_json}\n\n"
                        f"ADS:\n{ads_json}\n\n"
                        f"Analiza el rendimiento actual. En español, describe: estado actual de la cuenta, "
                        f"problemas críticos identificados, y qué campañas/adsets/ads escalar o pausar."
                    ),
                }
            ],
        )
        fase1_text = next(
            (b.text for b in resp1.content if b.type == "text"), fase1_text
        )
    except Exception:
        logger.exception("Fase 1 (Optimizer) falló")

    # Fase 2 — Finance
    fase2_text = "Análisis no disponible"
    try:
        total_spend = sum(c.get("spend", 0) or 0 for c in campaigns_data)
        total_revenue = sum(c.get("revenue", 0) or 0 for c in campaigns_data)

        system2 = f"Eres el CFO de esta cuenta publicitaria de infoproductos.\nBreakeven ROAS: {breakeven_roas}\nMargen objetivo: {target_margin}%"
        resp2 = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            system=[{"type": "text", "text": system2, "cache_control": {"type": "ephemeral"}}],
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Informe del Media Buyer:\n{fase1_text}\n\n"
                        f"DATOS FINANCIEROS:\n"
                        f"- Gasto total: ${total_spend:.2f}\n"
                        f"- Revenue total: ${total_revenue:.2f}\n\n"
                        f"Analiza en español: ¿es rentable la cuenta?, burn rate actual, "
                        f"cuándo agotan presupuesto al ritmo actual, si vale escalar o hay que cortar."
                    ),
                }
            ],
        )
        fase2_text = next(
            (b.text for b in resp2.content if b.type == "text"), fase2_text
        )
    except Exception:
        logger.exception("Fase 2 (Finance) falló")

    # Fase 3 — CRO
    fase3_text = "Análisis no disponible"
    try:
        system3 = f"Eres un especialista en CRO y landing pages para infoproductos.\n\nCONTEXTO DEL NEGOCIO:\n{negocio_info}"
        resp3 = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            system=[{"type": "text", "text": system3, "cache_control": {"type": "ephemeral"}}],
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Informe del Media Buyer:\n{fase1_text}\n\n"
                        f"Informe del CFO:\n{fase2_text}\n\n"
                        f"Insights de comportamiento (Clarity):\n{clarity_insights}\n\n"
                        f"Analiza en español: dónde se pierde conversión entre el click y la compra, "
                        f"qué mejorar en la landing page para aumentar el CVR."
                    ),
                }
            ],
        )
        fase3_text = next(
            (b.text for b in resp3.content if b.type == "text"), fase3_text
        )
    except Exception:
        logger.exception("Fase 3 (CRO) falló")

    # Fase 4 — Commander
    commander_result = {
        "resumen_ejecutivo": "No disponible por error en el análisis.",
        "estado_cuenta": "ERROR",
        "señales_positivas": [],
        "alerta_critica": None,
        "acciones": [],
    }
    try:
        resp4 = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Eres el Director de Estrategia. Leíste estos 3 informes:\n\n"
                        f"OPTIMIZER:\n{fase1_text}\n\n"
                        f"FINANCE:\n{fase2_text}\n\n"
                        f"CRO:\n{fase3_text}\n\n"
                        f"Genera ÚNICAMENTE un JSON válido con esta estructura exacta (sin texto adicional):\n"
                        f'{{\n'
                        f'  "resumen_ejecutivo": "string 2-3 oraciones",\n'
                        f'  "estado_cuenta": "ESCALANDO|ESTABLE|EN_RIESGO|CRITICO",\n'
                        f'  "señales_positivas": ["string", "string"],\n'
                        f'  "alerta_critica": null,\n'
                        f'  "acciones": [\n'
                        f'    {{\n'
                        f'      "prioridad": 1,\n'
                        f'      "titulo": "string corto",\n'
                        f'      "descripcion": "string detallado",\n'
                        f'      "razon": "string",\n'
                        f'      "riesgo": "bajo|medio|alto",\n'
                        f'      "tipo": "pause_campaign|pause_adset|scale_budget|rotate_creative|fix_landing|review",\n'
                        f'      "target_id": "id_o_null",\n'
                        f'      "target_name": "nombre_o_null",\n'
                        f'      "ejecutable": true,\n'
                        f'      "impacto_estimado": "string ej: Ahorra ~$50/día"\n'
                        f'    }}\n'
                        f'  ]\n'
                        f'}}\n\n'
                        f"Máximo 5 acciones ordenadas por prioridad. "
                        f"ejecutable=true solo para pause_campaign y pause_adset. "
                        f"ejecutable=false para scale_budget, fix_landing, rotate_creative, review."
                    ),
                }
            ],
        )

        raw = next((b.text for b in resp4.content if b.type == "text"), "")

        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
        json_str = match.group(1).strip() if match else raw.strip()

        parsed = json.loads(json_str)
        commander_result = parsed
    except Exception:
        logger.exception("Fase 4 (Commander) falló o el JSON no pudo parsearse")

    return {
        "diagnostico": {
            "optimizer": fase1_text,
            "finance": fase2_text,
            "cro": fase3_text,
        },
        "resumen_ejecutivo": commander_result.get("resumen_ejecutivo"),
        "estado_cuenta": commander_result.get("estado_cuenta"),
        "señales_positivas": commander_result.get("señales_positivas", []),
        "alerta_critica": commander_result.get("alerta_critica"),
        "acciones": commander_result.get("acciones", []),
        "breakeven_roas": breakeven_roas,
        "meta": {
            "campaigns_analizadas": len(campaigns_data),
            "adsets_analizados": len(adsets_data),
            "ads_analizados": len(ads_data),
        },
    }
