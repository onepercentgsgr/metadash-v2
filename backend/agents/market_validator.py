"""
Market Validator — Nivel Dios

Antes de gastar tokens generando un infoproducto, el usuario pega URLs
de sales pages competidoras + (opcional) texto de ads que vio + (opcional)
el nicho que está pensando.

El validador corre 3 agentes especializados en cadena:

1. SALES PAGE EXPERT (1 vez por URL): desarma quirúrgicamente cada página
   competidora — ángulos, dolores, pricing, técnicas de copy, fortalezas,
   debilidades, qué copiar, qué evitar.

2. AD CREATIVE STRATEGIST (1 vez por ad): analiza el hook, ángulo, promesa,
   elementos visuales, CTA, score de efectividad y cómo mejorarlo.

3. MARKET STRATEGIST (síntesis final): toma todos los análisis anteriores
   y produce un MARKET MAP con:
   - Veredicto (🟢/🟡/🔴) + score 1-10
   - Estado del mercado (saturación, competidores escalados, tendencia)
   - Ángulos dominantes vs WEDGE (el hueco que nadie ataca)
   - Pricing recomendado
   - Avatar consolidado
   - Go/No-Go + próximos pasos concretos
   - Seed listo para alimentar el pipeline Nivel Dios

Costo aproximado por validación de 5 páginas + 3 ads:
  - 5x sales page analysis: ~$0.10
  - 3x ad analysis:         ~$0.04
  - 1x synthesis:           ~$0.06
  TOTAL:                    ~$0.20 USD

Devuelve un dict con `pages`, `ads`, `synthesis`. Cada parte se persiste
en MarketValidation para historial y para que el botón
"Crear infoproducto basado en este análisis" pueda usar el seed
sin volver a pagar tokens.
"""

import json
import logging
from typing import Optional

import anthropic
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


PAGE_EXPERT_PROMPT = """Sos un experto en marketing de respuesta directa con 15 años analizando sales pages de infoproductos en LATAM. Tu trabajo es desarmar quirúrgicamente la página de un competidor para que un nuevo entrante al mercado pueda aprender, mejorar y atacar los huecos.

Devolvé ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown wrappers, sin texto antes ni después, sin explicaciones):

{{
  "url": "URL analizada",
  "marca": "nombre del producto/marca o 'no identificado'",
  "promesa_principal": "promesa principal en 1 oración",
  "angulo_principal": "el ángulo central (ej: anti-comisiones, fiscal, transformación, fast cash, autoridad, etc.)",
  "angulos_secundarios": ["ángulo 2", "ángulo 3"],
  "puntos_de_dolor": [
    "dolor 1 que ataca",
    "dolor 2",
    "dolor 3"
  ],
  "publico_objetivo": "descripción del avatar al que apuntan",
  "precio": "precio observado o 'no visible'",
  "garantia": "garantía mencionada o null",
  "tecnicas_de_copy": [
    "urgencia / scarcity / social proof / authority / testimonios / pruebas / etc."
  ],
  "estructura_pagina": ["hero", "problema", "solución", "bonuses", "garantía", "FAQ"],
  "fortalezas": ["fortaleza 1 — específica y accionable", "fortaleza 2"],
  "debilidades": ["debilidad 1 que vos podrías hacer mejor", "debilidad 2"],
  "score_calidad": 7,
  "que_copiarle": "1-2 elementos específicos que vale la pena copiar/inspirarse",
  "que_evitar": "qué hace mal y vos podés hacer mejor"
}}

URL: {url}
TÍTULO: {title}

CONTENIDO:
{content}
"""


AD_EXPERT_PROMPT = """Sos un creative strategist de Facebook/TikTok Ads de élite. Te paso una descripción/texto de un ad que el usuario vio. Analizalo como si fueras a presentarle un report al cliente.

Devolvé ÚNICAMENTE un JSON válido (sin markdown, sin texto extra):

{{
  "tipo": "image | video | carousel | reel | desconocido",
  "hook_inicial": "el hook de los primeros 3 segundos o la primera línea",
  "angulo": "ángulo de la creative (ej: testimonio, before/after, autoridad, problema-solución, etc.)",
  "promesa": "qué promete el ad",
  "elementos_visuales": "descripción de qué se ve",
  "cta": "call to action observado",
  "publico_inferido": "a quién parece estar dirigido",
  "score_efectividad": 7,
  "porque_funciona": "razones por las que probablemente convierte",
  "como_mejorarlo": "qué se puede hacer mejor"
}}

DESCRIPCIÓN DEL AD:
{ad_text}
"""


SYNTHESIS_PROMPT = """Sos un estratega de mercado de infoproductos en LATAM con 10 años de experiencia montando lanzamientos de 6 y 7 cifras. Te paso análisis previos de N sales pages competidoras + M ads del mismo nicho. Tu trabajo: dar un VEREDICTO definitivo, identificar el WEDGE (el ángulo que NADIE está atacando) y recomendar posicionamiento concreto para un nuevo entrante.

PRINCIPIOS QUE TENÉS QUE APLICAR:
- Si 4+ competidores tienen ads activos hace +3 meses → mercado validado y rentable
- Si todos los competidores hablan del MISMO ángulo → el wedge está en otro lado, no compitas en ese
- Pricing: el wedge muchas veces está abajo del más barato O arriba del más caro (premium)
- "Anti-X" tiende a funcionar cuando X está dominante (ej: "anti-Rappi" en gastronomía)
- Score 8-10 = adelante. 5-7 = condicional. <5 = NO GO.

CONTEXTO:
NICHO TARGET: {niche}
NOTAS DEL USUARIO: {notes}

ANÁLISIS DE PÁGINAS COMPETIDORAS (JSON):
{pages_json}

ANÁLISIS DE ADS (JSON):
{ads_json}

DATOS DE FACEBOOK ADS LIBRARY:
{ads_library_data}

Devolvé ÚNICAMENTE un JSON válido (sin markdown wrappers, sin explicación):

{{
  "veredicto": {{
    "score": 8,
    "verdict": "🟢 RENTABLE",
    "razonamiento": "2-3 oraciones explicando el score con datos concretos del análisis"
  }},
  "estado_del_mercado": {{
    "saturacion": "baja | media | alta",
    "competidores_activos": "estimación numérica",
    "competidores_escalados": "qué competidores ves que están escalados y por qué",
    "tendencia": "creciendo | estable | declinando"
  }},
  "angulos_dominantes": [
    "ángulo que TODOS usan 1",
    "ángulo que TODOS usan 2"
  ],
  "wedge": {{
    "angulo": "el ángulo específico que nadie está atacando — sé concreto",
    "razonamiento": "por qué este ángulo está libre",
    "como_atacarlo": "estrategia concreta para tomar este ángulo, en 2-3 oraciones"
  }},
  "pricing_recomendado": {{
    "rango_mercado": "$X - $Y observado",
    "tu_precio_sugerido": "$Z",
    "razonamiento": "por qué ese precio"
  }},
  "copy_winners": [
    "elemento de copy 1 que está funcionando — para inspirarte",
    "elemento 2"
  ],
  "puntos_de_dolor_top": [
    "dolor 1 — el más fuerte y validado por los competidores",
    "dolor 2",
    "dolor 3"
  ],
  "avatar_consolidado": "descripción del cliente ideal sintetizada de todos los competidores (4-5 oraciones)",
  "go_no_go": {{
    "recomendacion": "GO | NO GO | GO CON CONDICIONES",
    "next_steps": ["paso accionable 1", "paso accionable 2", "paso accionable 3"]
  }},
  "seed_para_pipeline": {{
    "nicho": "nicho preciso para arrancar el infoproducto",
    "problema": "problema central que tu producto va a resolver, basado en el wedge",
    "publico": "tu avatar específico (no copiar el avatar de los competidores, refinarlo)",
    "diferencial": "tu diferencial único basado en el wedge",
    "precio_objetivo": "tu precio recomendado",
    "competidor_principal": "el competidor más fuerte que vas a tener que superar",
    "notas": "notas extra estratégicas para que el agente del pipeline tenga contexto del wedge"
  }}
}}
"""


def _scrape_page(url: str, timeout: int = 15) -> dict:
    """Fetch and clean a sales page. Returns {url, title, text}."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MetaDash/3.5; +https://metadash.app)",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    }
    with httpx.Client(follow_redirects=True, timeout=timeout) as client:
        resp = client.get(url, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()
    title = soup.title.string.strip() if soup.title and soup.title.string else url
    blocks = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "span", "strong", "em"]):
        t = tag.get_text(separator=" ", strip=True)
        if len(t) > 15:
            blocks.append(t)
    text = "\n".join(dict.fromkeys(blocks))[:14000]
    return {"url": url, "title": title, "text": text}


def _parse_json_strict(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        # Strip markdown code fences
        parts = raw.split("```")
        # take the second piece (between fences)
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning(f"[market_validator] JSON parse failed: {e}; raw[:500]={raw[:500]}")
        return {"error": "JSON parse failed", "raw_preview": raw[:500]}


def analyze_page(url: str, api_key: str) -> dict:
    """Scrape and analyze one competitor sales page."""
    try:
        scraped = _scrape_page(url)
    except Exception as e:
        logger.warning(f"[market_validator] scrape failed for {url}: {e}")
        return {"url": url, "error": f"scrape failed: {e}"}

    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2500,
        messages=[{
            "role": "user",
            "content": PAGE_EXPERT_PROMPT.format(
                url=scraped["url"],
                title=scraped["title"],
                content=scraped["text"],
            ),
        }],
    )
    raw = msg.content[0].text
    parsed = _parse_json_strict(raw)
    if "error" in parsed and "raw_preview" in parsed:
        # JSON parse failed — return what we have for debugging
        parsed["url"] = url
    return parsed


def analyze_ad(ad_text: str, api_key: str) -> dict:
    """Analyze a single ad's text/description."""
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": AD_EXPERT_PROMPT.format(ad_text=ad_text),
        }],
    )
    return _parse_json_strict(msg.content[0].text)


def synthesize_market(
    niche: str,
    notes: str,
    pages: list[dict],
    ads: list[dict],
    ads_library_data: Optional[dict],
    api_key: str,
) -> dict:
    """Final market map + verdict + wedge + pipeline seed."""
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": SYNTHESIS_PROMPT.format(
                niche=niche or "no especificado",
                notes=notes or "(sin notas adicionales)",
                pages_json=json.dumps(pages, ensure_ascii=False)[:10000],
                ads_json=json.dumps(ads, ensure_ascii=False)[:5000] or "[]",
                ads_library_data=json.dumps(ads_library_data, ensure_ascii=False)[:3000]
                                 if ads_library_data else "(sin datos de Ads Library — el usuario no los aportó)",
            ),
        }],
    )
    return _parse_json_strict(msg.content[0].text)


def validate_market(
    urls: list[str],
    ads: list[str],
    niche: str,
    notes: str,
    api_key: str,
    ads_library_data: Optional[dict] = None,
) -> dict:
    """
    Main entry point — runs all 3 agents in sequence and returns the
    full market analysis.
    """
    page_analyses = []
    for url in urls:
        if not url or not url.strip():
            continue
        page_analyses.append(analyze_page(url.strip(), api_key))

    ad_analyses = []
    for ad_text in ads:
        if not ad_text or not ad_text.strip():
            continue
        ad_analyses.append(analyze_ad(ad_text.strip(), api_key))

    synthesis = synthesize_market(
        niche=niche, notes=notes,
        pages=page_analyses, ads=ad_analyses,
        ads_library_data=ads_library_data,
        api_key=api_key,
    )

    return {
        "pages": page_analyses,
        "ads": ad_analyses,
        "synthesis": synthesis,
    }
