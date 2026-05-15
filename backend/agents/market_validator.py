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


SYNTHESIS_PROMPT = """Actuá como un sistema privado de análisis de mercados compuesto por:
- un media buyer que escaló +200M USD en Meta Ads,
- un operador de DTC e infoproductos de 8 cifras,
- un especialista obsesionado con Facebook Ads Library,
- un analista de funnels de alta conversión,
- y un investigador de oportunidades ocultas.

Tu trabajo NO es resumir páginas. Tu trabajo es detectar:
- si el mercado imprime dinero,
- si el competidor está escalando de verdad,
- si el producto vale la pena duplicar/mejorar,
- y si existe espacio para entrar con una oferta superior.

# FUENTES DE DATOS QUE RECIBÍS
Pueden venir 1, 2 o 3 fuentes. Cuando recibás varias, CRUZÁ todo.

- FUENTE 1 — Biblioteca de Anuncios (exportada por MetaDash Spy Extension): JSON con ads activos, fechas, copy, CTAs, variaciones, hooks repetidos.
- FUENTE 2 — Landing Pages: análisis estructurado de cada sales page competidora.
- FUENTE 3 — Análisis de Video (de Spy de Ads de MetaDash): transcripción + hook + estructura + WEDGE detectado + script template.

# REGLA DURA
NO asumas que "muchos anuncios" = bueno automáticamente. Determiná si esos ads son:
- TESTING (hooks distintos, baja repetición, pocos ads)
- SCALING (muchas variaciones del mismo ángulo, ads viejos sobreviviendo)
- RETARGETING (formatos repetidos a la misma audiencia)
- QUEMANDO CREATIVOS (muchos ads recientes pero el viejo desapareció)

Referencias:
- 3 ads activos → producto muerto o test inicial
- 30 ads → scaling serio
- 100+ ads → máquina rentable O desesperación quemando creativos
- Ad sobrevive +60 días → rentable confirmado
- Ad sobrevive +1 año → ganador comprobado (oro puro)
- 10+ variaciones del mismo contenido → duplicación masiva del control

# CONTEXTO
NICHO TARGET: {niche}
NOTAS DEL USUARIO: {notes}

# FUENTE 1 — BIBLIOTECA DE ANUNCIOS
{ads_library_data}

# FUENTE 2 — ANÁLISIS DE PÁGINAS COMPETIDORAS (JSON)
{pages_json}

# ANÁLISIS DE ADS EN TEXTO (complementario a Fuente 1)
{ads_json}

# FUENTE 3 — ANÁLISIS DE VIDEO DEL SPY DE ADS
{video_analysis}

# MODO OPERADOR
Hablá como un media buyer killer obsesionado con ROAS. No académico. Directo, accionable, español argentino.

# FORMATO DE SALIDA
Devolvé ÚNICAMENTE un JSON válido (sin markdown wrappers, sin explicación):

{{
  "veredicto": {{
    "score": 8,
    "verdict": "🟢 ESCALAR / DUPLICAR | 🟡 ENTRAR CON OTRO ÁNGULO | 🔴 EVITAR",
    "razonamiento": "2-3 oraciones con DATOS CONCRETOS de las fuentes recibidas — citá números, fechas, hooks específicos"
  }},

  "fuentes_recibidas": {{
    "biblioteca": true,
    "landings": true,
    "video": false,
    "notas": "qué tan completa fue la data — si falta algo, qué impactó"
  }},

  "fase_1_biblioteca": {{
    "estado_competidor": "TESTING | SCALING | RETARGETING | QUEMANDO_CREATIVOS | SIN_DATA",
    "ads_activos": 0,
    "ad_mas_viejo_dias": 0,
    "ads_que_sobreviven_60d": 0,
    "ads_que_sobreviven_90d": 0,
    "max_variaciones_un_contenido": 0,
    "winner_probable": {{
      "hook": "hook exacto del ad con más variaciones",
      "library_id": "ID si está disponible",
      "porque_es_winner": "razón concreta"
    }},
    "hooks_repetidos": [
      {{"hook": "frase repetida", "frecuencia": 3, "variaciones": 5}}
    ],
    "señales_de_dinero_real": ["señal 1", "señal 2"],
    "señales_de_humo_o_riesgo": ["si hay banderas rojas"]
  }},

  "fase_2_landing": {{
    "calidad_promedio": 7,
    "above_the_fold": "lo que ven primero los visitantes (síntesis)",
    "oferta_dominante": "qué venden y a cómo",
    "pricing_observado": "$X - $Y",
    "tecnicas_dominantes": ["urgencia", "social proof", "etc."],
    "fortalezas_comunes": ["fortaleza repetida 1", "fortaleza 2"],
    "debilidades_comunes": ["debilidad explotable 1", "debilidad 2"],
    "ux_quality": "amateur | media | profesional"
  }},

  "fase_3_video": {{
    "hook_ganador": "el hook del video analizado (si vino Fuente 3)",
    "wedge_del_video": "el WEDGE que detectó el Spy de Ads",
    "se_alinea_con_biblioteca": "true | false | parcial — explicar en 1 oración"
  }},

  "fase_4_dinero_real": {{
    "ticket_probable": "$X",
    "cac_probable": "$Y",
    "margen_probable": "Z%",
    "ltv_probable": "$W",
    "necesidad_backend": "alta | media | baja",
    "dependencia_marca_personal": "alta | media | baja",
    "potencial_escalar_latam": "alto | medio | bajo",
    "es_negocio_rentable": "SI | NO | TAL VEZ",
    "razonamiento": "por qué con datos concretos"
  }},

  "scores": {{
    "validacion_mercado": 8,
    "señales_scaling_real": 7,
    "potencial_evergreen": 7,
    "potencial_latam": 9,
    "potencial_argentina": 9,
    "saturacion": 6,
    "facilidad_adquisicion": 7,
    "potencial_viralidad": 7,
    "potencial_roas": 8,
    "potencial_duplicacion": 8,
    "dependencia_marca_personal": 4,
    "riesgo_burnout_creativo": 5,
    "calidad_oferta": 7,
    "calidad_funnel": 6
  }},

  "estado_del_mercado": {{
    "saturacion": "baja | media | alta",
    "competidores_activos": "estimación numérica",
    "competidores_escalados": "qué competidores ves escalados y por qué",
    "tendencia": "creciendo | estable | declinando"
  }},

  "angulos_dominantes": [
    "ángulo que TODOS usan 1",
    "ángulo que TODOS usan 2"
  ],

  "wedge": {{
    "angulo": "el ángulo específico que NADIE está atacando — sé ultra concreto",
    "emocion_subutilizada": "emoción que nadie está activando bien",
    "promesa_que_falta": "la promesa que el mercado no está haciendo",
    "subnicho_abandonado": "el subnicho con baja competencia y alto potencial",
    "mecanismo_unico_que_dominaria": "el mecanismo único que podrías ofrecer",
    "razonamiento": "por qué este ángulo está libre — con datos",
    "como_atacarlo": "estrategia concreta 2-3 oraciones"
  }},

  "ideas_para_atacar": {{
    "nuevos_angulos": ["ángulo 1", "ángulo 2", "ángulo 3"],
    "hooks_virales": ["hook 1", "hook 2", "hook 3"],
    "ofertas_irresistibles": ["oferta 1", "oferta 2", "oferta 3"],
    "mejoras_de_funnel": ["mejora 1", "mejora 2", "mejora 3"],
    "ideas_de_vsl": ["idea 1", "idea 2", "idea 3"],
    "formas_de_superar_al_competidor": ["forma 1", "forma 2", "forma 3"]
  }},

  "script_template": {{
    "hook_0_3s": "VISUAL + TEXTO + AUDIO — script exacto de los primeros 3 segundos",
    "problema_3_8s": "VISUAL + TEXTO + VOZ",
    "solucion_8_18s": "VISUAL + TEXTO + VOZ",
    "prueba_18_23s": "VISUAL + TEXTO",
    "cta_23_27s": "VISUAL + TEXTO + VOZ"
  }},

  "pricing_recomendado": {{
    "rango_mercado": "$X - $Y observado",
    "tu_precio_sugerido": "$Z",
    "razonamiento": "por qué ese precio basado en el wedge"
  }},

  "copy_winners": ["elemento copy 1 que funciona", "elemento 2"],
  "puntos_de_dolor_top": ["dolor 1 validado por los competidores", "dolor 2", "dolor 3"],
  "avatar_consolidado": "descripción del cliente ideal sintetizada de TODAS las fuentes (4-5 oraciones)",

  "go_no_go": {{
    "recomendacion": "GO | NO GO | GO CON CONDICIONES",
    "explicacion_ejecutiva": "Por qué sí o no, qué señales muestran dinero real, si vale clonar el modelo, si conviene otro subnicho, dónde está la oportunidad REAL — 4-6 oraciones",
    "next_steps": ["paso accionable 1", "paso accionable 2", "paso accionable 3"]
  }},

  "seed_para_pipeline": {{
    "nicho": "nicho preciso para arrancar el infoproducto",
    "problema": "problema central que tu producto va a resolver, basado en el wedge",
    "publico": "tu avatar específico (refinado, no copiado)",
    "diferencial": "tu diferencial único basado en el wedge",
    "precio_objetivo": "tu precio recomendado",
    "competidor_principal": "el competidor más fuerte a superar",
    "notas": "notas estratégicas para que el pipeline arranque con el WEDGE cargado"
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


def _summarize_library(library_data: Optional[dict]) -> str:
    """Resume el JSON exportado por la extensión a un bloque legible para el prompt."""
    if not library_data:
        return "(sin datos de Biblioteca de Anuncios — el usuario no aportó la Fuente 1)"
    try:
        meta = library_data.get("meta", {})
        summary = library_data.get("summary", {})
        analysis = library_data.get("analysis", {})
        ads = library_data.get("ads", []) or []

        lines = []
        lines.append(f"Fecha de scan: {meta.get('scraped_at', 'desconocida')}")
        lines.append(f"Búsqueda: {meta.get('search_query', '') or meta.get('page_name', '')}")
        lines.append(f"Total detectados: {meta.get('total_detected', 0)}"
                     + (f" (de ~{meta['total_estimated']} estimados)" if meta.get('total_estimated') else ""))
        lines.append(f"Tipos: videos={summary.get('videos', 0)}, imágenes={summary.get('images', 0)}, carruseles={summary.get('carousels', 0)}")
        if summary.get('oldest_ad_date'):
            lines.append(f"Ad más viejo: {summary['oldest_ad_date']} ({summary.get('oldest_ad_days', '?')} días)")
        if summary.get('max_variations'):
            lines.append(f"Máx. variaciones en un contenido: {summary['max_variations']}")
        if summary.get('platforms'):
            lines.append(f"Plataformas: {', '.join(summary['platforms'])}")

        signals = analysis.get("scaling_signals", []) or []
        if signals:
            lines.append("\nSeñales de scaling detectadas:")
            for s in signals[:6]:
                lines.append(f"  - {s}")

        hooks = analysis.get("hook_patterns", []) or []
        if hooks:
            lines.append("\nHooks repetidos (top):")
            for h in hooks[:6]:
                lines.append(f"  - \"{h.get('hook', '')}\" — freq {h.get('frequency', 1)}, max_var {h.get('max_variations', 1)}")

        winner = analysis.get("probable_winner")
        if winner:
            lines.append(f"\nWinner probable: ID {winner.get('library_id', '?')}")
            lines.append(f"  Hook: \"{winner.get('hook', '')}\"")
            lines.append(f"  Variaciones: {winner.get('variation_count', '?')}, días activo: {winner.get('days_active', '?')}")
            if winner.get('reason'):
                lines.append(f"  Razón: {winner['reason']}")

        # Muestreo de hasta 12 ads ordenados por antigüedad
        sorted_ads = sorted(
            (a for a in ads if isinstance(a, dict)),
            key=lambda a: a.get("start_date_iso") or "9999",
        )[:12]
        if sorted_ads:
            lines.append("\nMuestra de ads (más viejos primero, max 12):")
            for i, ad in enumerate(sorted_ads):
                lines.append(f"  [{i+1}] ID:{ad.get('library_id')} | {ad.get('media_type', '?')} | "
                             f"desde {ad.get('start_date_iso', '?')} ({ad.get('days_active', '?')}d) | "
                             f"variaciones: {ad.get('variation_count', 1)} | CTA: {ad.get('cta_text', '-')}")
                hook = (ad.get("ad_text") or "").split("\n")[0][:120]
                if hook:
                    lines.append(f"      Hook: \"{hook}\"")

        return "\n".join(lines)[:6000]
    except Exception as e:
        logger.warning(f"[market_validator] error summarizing library: {e}")
        return json.dumps(library_data, ensure_ascii=False)[:3000]


def _summarize_video_analysis(video_analysis: Optional[dict]) -> str:
    """Resume el análisis de video del Spy de Ads (Fuente 3) para el prompt."""
    if not video_analysis:
        return "(sin análisis de video — el usuario no aportó la Fuente 3)"
    try:
        estructura = video_analysis.get("estructura_temporal", {}) or {}
        copy = video_analysis.get("analisis_copy", {}) or {}
        psico = video_analysis.get("analisis_psicologico", {}) or {}
        estrat = video_analysis.get("analisis_estrategico", {}) or {}
        veredicto = video_analysis.get("veredicto_duplicacion", {}) or {}
        seed = video_analysis.get("pipeline_seed", {}) or {}

        lines = []
        if estrat.get("marca_detectada"):
            lines.append(f"Marca detectada: {estrat['marca_detectada']}")
        if estrat.get("nicho_exacto"):
            lines.append(f"Nicho exacto: {estrat['nicho_exacto']}")
        if estrat.get("angulo_central"):
            lines.append(f"Ángulo central del video: {estrat['angulo_central']}")
        if estrat.get("funnel_detectado"):
            lines.append(f"Funnel detectado: {estrat['funnel_detectado']}")
        if estructura.get("hook_0_3s"):
            lines.append(f"\nHook (0-3s): {estructura['hook_0_3s']}")
        if copy.get("hook_frase_exacta"):
            lines.append(f"Hook frase exacta: \"{copy['hook_frase_exacta']}\"")
        if copy.get("promesa_principal"):
            lines.append(f"Promesa: {copy['promesa_principal']}")
        if copy.get("mecanismo_unico"):
            lines.append(f"Mecanismo único: {copy['mecanismo_unico']}")
        if psico.get("avatar_implicito"):
            lines.append(f"\nAvatar implícito: {psico['avatar_implicito']}")
        if psico.get("dolor_especifico_tocado"):
            lines.append(f"Dolor tocado: {psico['dolor_especifico_tocado']}")
        if veredicto.get("wedge"):
            lines.append(f"\nWEDGE detectado en el video: {veredicto['wedge']}")
        if veredicto.get("score_general") is not None:
            lines.append(f"Score del video: {veredicto['score_general']}/10")
        if seed.get("notas_estrategicas"):
            lines.append(f"\nNotas estratégicas: {seed['notas_estrategicas']}")
        return "\n".join(lines)[:4000]
    except Exception as e:
        logger.warning(f"[market_validator] error summarizing video: {e}")
        return json.dumps(video_analysis, ensure_ascii=False)[:3000]


def synthesize_market(
    niche: str,
    notes: str,
    pages: list[dict],
    ads: list[dict],
    ads_library_data: Optional[dict],
    api_key: str,
    video_analysis: Optional[dict] = None,
) -> dict:
    """Final market map + verdict + wedge + pipeline seed. Acepta 3 fuentes (v2)."""
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=6000,
        messages=[{
            "role": "user",
            "content": SYNTHESIS_PROMPT.format(
                niche=niche or "no especificado",
                notes=notes or "(sin notas adicionales)",
                pages_json=json.dumps(pages, ensure_ascii=False)[:10000],
                ads_json=json.dumps(ads, ensure_ascii=False)[:5000] or "[]",
                ads_library_data=_summarize_library(ads_library_data),
                video_analysis=_summarize_video_analysis(video_analysis),
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
    video_analysis: Optional[dict] = None,
) -> dict:
    """
    Main entry point — corre los agentes y devuelve el análisis completo.
    Acepta hasta 3 fuentes: landing URLs (Fuente 2), library_data (Fuente 1),
    video_analysis (Fuente 3).
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
        video_analysis=video_analysis,
        api_key=api_key,
    )

    return {
        "pages": page_analyses,
        "ads": ad_analyses,
        "synthesis": synthesis,
    }
