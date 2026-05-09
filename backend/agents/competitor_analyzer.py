"""
Competitor Deep Analyzer — Nivel Dios

Sistema híbrido de 3 agentes senior (DR copywriter / performance buyer /
funnel strategist) que disecciona UN competidor a fondo: anuncio +
landing + datos de Ads Library + hipótesis del usuario, y devuelve:

- Análisis del anuncio (ángulo, visual, audio, copy)
- Recon de Ads Library (qué buscar específicamente)
- Análisis quirúrgico de la landing
- Veredicto 🟢/🟡/🔴 + score
- WEDGE explícito
- 3 ángulos nuevos + 3 hooks + 3 VSL ideas + 3 mejoras de funnel + 3 ofertas irresistibles
- Seed listo para alimentar el Pipeline

Limitaciones: no puede ver videos automáticamente. El usuario pega:
- Transcripción del audio (o copy del ad)
- Descripción visual ("se ve un creator joven en su escritorio,
  pantalla con dashboard mostrando $X de ingresos, corte rápido a...")
- Si hay screenshots, los puede pegar como descripción
"""

import json
import logging
from typing import Optional

import anthropic
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """Sos un sistema híbrido compuesto por 3 agentes senior de marketing de respuesta directa, performance marketing y análisis de funnels digitales.

Tu misión NO es resumir anuncios.
Tu misión es detectar oportunidades escalables multimillonarias antes de construir un infoproducto o lanzar campañas.

Personajes que adoptás simultáneamente:
- Un media buyer de +10M USD gastados
- Un creador de VSLs de alta conversión
- Un estratega de ofertas estilo Hormozi/Russell Brunson
- Un investigador obsesionado con detectar productos ganadores

Hablás como:
- killer de performance marketing
- operador de scaling
- media buyer obsesionado con ROAS
- estratega que busca productos de 7 cifras

NO sos académico. NO sos ChatGPT corporativo. Sos directo, agresivo, accionable.

# REGLAS DURAS
- Si faltan datos críticos: pedilos antes de inventar.
- NUNCA inventes información sobre el competidor.
- Detectá: oportunidades ocultas, humo, estafas, mercados saturados, productos escalables reales.
- Priorizá: señales de dinero REAL, evidencia de scaling, comportamiento de advertisers.

# DEVOLVÉ ÚNICAMENTE UN JSON VÁLIDO con esta estructura exacta (sin markdown wrappers, sin texto antes ni después):

{
  "fase_1_anuncio": {
    "angulo_de_venta": {
      "deseo_principal": "...",
      "dolor_principal": "...",
      "mecanismo_unico": "...",
      "promesa_explicita": "...",
      "promesa_implicita": "...",
      "enemigo_comun": "...",
      "tipo_de_oportunidad": "dinero | status | libertad | tiempo | placer | miedo | urgencia | supervivencia",
      "emocion_que_vende": "...",
      "creencia_que_rompe": "...",
      "transformacion_que_promete": "...",
      "publico_targeteado": "..."
    },
    "analisis_visual": {
      "hook_3_segundos": "...",
      "tipo_edicion": "...",
      "ritmo_cortes": "rápido / medio / lento",
      "calidad_produccion": "amateur / UGC / profesional / cinemática",
      "elementos_dopamina": ["..."],
      "elementos_confianza": ["..."],
      "elementos_fomo": ["..."],
      "es_ugc": true,
      "parece_grabado_para_ads": true,
      "parece_escalado": true,
      "parece_fake_o_humo": false,
      "autoridad_real": "alta / media / baja"
    },
    "analisis_audio": {
      "tipo_voz": "...",
      "energia": "alta / media / baja",
      "musica": "...",
      "apunta_a": "TikTok brainrot | autoridad | aspiracional | urgencia | storytelling emocional"
    },
    "analisis_copy": {
      "hook": "...",
      "open_loops": ["..."],
      "curiosity_gaps": ["..."],
      "ctas": ["..."],
      "social_proof_usado": "...",
      "big_promise": "...",
      "formula_psicologica": "AIDA / PAS / 4U / before-after-bridge / Hormozi-stack / etc.",
      "agresividad": "alta / media / baja",
      "escalabilidad_aparente": "alta / media / baja",
      "nivel_sofisticacion_mercado": "1 (virgen) - 5 (saturadísimo)"
    }
  },

  "fase_2_library_recon": {
    "keywords_a_buscar": ["palabra 1", "palabra 2", "..."],
    "competidores_relacionados_a_buscar": ["...", "..."],
    "claims_y_promesas_a_buscar": ["..."],
    "que_revisar": [
      "cantidad de anuncios activos por marca",
      "fecha del más viejo (señal de scaling si > 3 meses)",
      "variaciones creativas (testing vs scaling)",
      "uso de UGC vs producción",
      "uso de VSL / webinar / lead magnet"
    ],
    "instrucciones_para_el_usuario": "decile específicamente qué buscar y cómo interpretarlo"
  },

  "fase_3_landing": {
    "above_the_fold": "...",
    "oferta": "...",
    "stack_de_valor": ["..."],
    "pricing": "...",
    "garantia": "...",
    "ctas": ["..."],
    "storytelling": "...",
    "prueba_social": "...",
    "autoridad": "...",
    "bonuses": ["..."],
    "scarcity_urgency": "...",
    "objection_handling": ["..."],
    "lead_capture": "...",
    "checkout": "...",
    "upsells": "...",
    "nivel_copywriting": "1-10",
    "fortalezas": ["..."],
    "debilidades": ["..."]
  },

  "fase_4_veredicto": {
    "verdict": "🟢 RENTABLE | 🟡 RIESGOSO | 🔴 EVITAR",
    "score": 8,
    "scores_detallados": {
      "mercado": 8,
      "oferta": 7,
      "escalabilidad": 9,
      "saturacion": 6,
      "margen": 8,
      "viralidad": 7,
      "facilidad_adquisicion": 7,
      "potencial_latam": 8,
      "potencial_argentina": 9,
      "riesgo_burnout": 5,
      "dependencia_marca_personal": 4,
      "potencial_evergreen": 7,
      "potencial_paid_ads": 9
    },
    "explicacion_estrategica": "por qué sí o no — concreto, accionable, sin teoría",
    "es_un_gol": true,
    "vale_duplicarlo": true,
    "conviene_mejorarlo_o_cambiar_angulo": "duplicar / mejorar / cambiar ángulo"
  },

  "wedge": {
    "angulo_libre": "el ángulo que NADIE está atacando — sé concreto",
    "emocion_subutilizada": "...",
    "promesa_que_falta": "...",
    "subnicho_abandonado": "...",
    "mecanismo_unico_que_dominaria": "..."
  },

  "ideas_para_atacar": {
    "3_nuevos_angulos": ["...", "...", "..."],
    "3_hooks_virales": ["...", "...", "..."],
    "3_ideas_de_vsl": ["...", "...", "..."],
    "3_mejoras_al_funnel": ["...", "...", "..."],
    "3_ofertas_irresistibles": ["...", "...", "..."]
  },

  "seed_para_pipeline": {
    "nicho": "...",
    "problema": "...",
    "publico": "...",
    "diferencial": "el wedge convertido en diferencial",
    "precio_objetivo": "...",
    "competidor_principal": "...",
    "notas": "contexto estratégico para que el pipeline arranque con el wedge ya cargado"
  }
}

Si algún dato no aplica o no se puede determinar con la información dada, poné null. Si faltan datos CRÍTICOS, devolvé en su lugar:
{ "necesito_mas_datos": ["dato 1", "dato 2", ...] }
"""


def _scrape_landing(url: str, timeout: int = 15) -> Optional[str]:
    if not url or not url.strip():
        return None
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MetaDash/3.5; +https://metadash.app)",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }
    try:
        with httpx.Client(follow_redirects=True, timeout=timeout) as client:
            resp = client.get(url, headers=headers)
        resp.raise_for_status()
    except Exception as e:
        logger.warning(f"[deep_analyzer] failed to scrape {url}: {e}")
        return None
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()
    blocks = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "span", "strong", "em"]):
        t = tag.get_text(separator=" ", strip=True)
        if len(t) > 15:
            blocks.append(t)
    return "\n".join(dict.fromkeys(blocks))[:14000]


def _parse_json_strict(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(f"[deep_analyzer] JSON parse failed: {e}")
        return {"error": "JSON parse failed", "raw_preview": raw[:1500]}


def deep_analyze_competitor(
    ad_transcription: str,
    ad_visual_description: str,
    landing_url: Optional[str],
    ads_library_manual: Optional[dict],
    niche: str,
    user_hypothesis: str,
    api_key: str,
    competitor_brand: Optional[str] = None,
) -> dict:
    """
    Single-call deep analysis. Builds a rich user message with all inputs
    and asks the multi-persona system prompt to produce the structured JSON.
    """
    landing_text = _scrape_landing(landing_url) if landing_url else None

    user_msg_parts = [
        f"# COMPETIDOR ANALIZADO: {competitor_brand or 'no especificado'}",
        f"# NICHO TARGET: {niche or 'no especificado'}",
        "",
        "# ANUNCIO / REEL / VIDEO",
        "## Transcripción / copy del anuncio:",
        ad_transcription or "(no provista)",
        "",
        "## Descripción visual del usuario:",
        ad_visual_description or "(no provista — el usuario no describió el video)",
        "",
        "# LANDING PAGE",
        f"URL: {landing_url or '(no provista)'}",
    ]
    if landing_text:
        user_msg_parts += ["## Contenido scrapeado de la landing:", landing_text[:12000]]
    else:
        user_msg_parts += ["## Contenido: no scrapeable o no provisto"]

    user_msg_parts += [
        "",
        "# DATOS DE FACEBOOK ADS LIBRARY (recolectados manualmente por el usuario)",
        json.dumps(ads_library_manual, ensure_ascii=False, indent=2)
            if ads_library_manual else "(no provistos)",
        "",
        "# HIPÓTESIS / NOTAS DEL USUARIO",
        user_hypothesis or "(sin hipótesis adicional)",
        "",
        "Ejecutá las 4 fases del análisis y devolvé el JSON estructurado tal como se especifica en el system prompt.",
    ]

    user_msg = "\n".join(user_msg_parts)

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=[
            {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = message.content[0].text
    return _parse_json_strict(raw)
