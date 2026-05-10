"""
Video Ad Analyzer — Nivel Dios

Analiza videos de ads (Instagram Stories, Reels, TikTok, Facebook Ads)
usando Claude Vision para extraer inteligencia de competencia completa:

Pipeline:
  1. ffmpeg extrae frames estratégicos del video
  2. Claude Vision lee subtítulos quemados + analiza visualmente
  3. 4 perspectivas simultáneas en un solo call:
     - Visual: hook, edición, ritmo, elementos dopamina
     - Copy/Audio: transcripción, estructura, palabras de poder
     - Psicología: gatillos, avatar implícito, emociones
     - Estrategia: ángulo, marca, qué está testeando
  4. Guía detallada de búsqueda en Facebook Ads Library
  5. Veredicto de duplicación + WEDGE explícito
  6. Script template listo para producir
  7. Pipeline seed para pre-llenar el Lanzador
"""

import base64
import json
import logging
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

import anthropic

logger = logging.getLogger(__name__)

MAX_FRAMES = 14
MAX_FILE_MB = 150


SYSTEM_PROMPT = """Sos un sistema de inteligencia de competencia para media buyers y creadores de infoproductos en Latinoamérica.

Analizás videos de ads de competidores con la precisión de 4 expertos simultáneos:

1. **Director Creativo Senior** (10 años de producción de UGC y VSL)
   — Lee cada frame, detecta el hook visual exacto, el ritmo de edición, los elementos de dopamina
   — Transcribe TODO el texto visible en pantalla (subtítulos, overlays, CTAs visuales)
   — Detecta qué está pasando segundo a segundo

2. **Media Buyer de +$10M gastados en Meta**
   — Detecta señales de scaling real vs. test
   — Identifica el ángulo de venta, la audiencia implícita, el nivel de sofisticación del mercado
   — Sabe exactamente qué está testeando el anunciante y por qué

3. **Copywriter de Respuesta Directa**
   — Transcribe y analiza el copy completo: hook → problema → solución → prueba → CTA
   — Detecta palabras de poder, open loops, curiosity gaps, objeciones pre-manejadas
   — Califica el copywriting con criterios objetivos

4. **Estratega de Ofertas estilo Hormozi/Brunson**
   — Identifica el WEDGE: el ángulo que NADIE está atacando
   — Diseña el script template mejorado
   — Crea el seed para el pipeline de creación

REGLAS DURAS:
- Transcribí EXACTAMENTE lo que ves/lees en los frames. Si hay subtítulos, copialos textualmente.
- Si no podés leer algo con certeza, indicalo con [ilegible] en lugar de inventar.
- Nunca inventes datos del competidor. Solo lo que está en el video.
- Sé concreto, accionable, sin teoría académica.
- Hablá en español argentino, directo y al punto.

FORMATO: Devolvé ÚNICAMENTE JSON válido, sin markdown wrappers, sin texto antes ni después.
"""

ANALYSIS_PROMPT = """Analizá estos {n_frames} frames del video de ad del competidor.

CONTEXTO ADICIONAL (si el usuario proporcionó):
- Nicho/industria: {niche}
- Marca sospechada: {brand}
- Hipótesis del usuario: {hypothesis}

INSTRUCCIONES:
1. Mirá TODOS los frames en orden cronológico
2. Transcribí TODO el texto visible (subtítulos, overlays, botones, texto en pantalla)
3. Describí qué está pasando visualmente en cada etapa clave
4. Analizá desde las 4 perspectivas simultáneas

Devolvé este JSON exacto:

{{
  "transcripcion_completa": "texto completo del video, en orden cronológico, incluyendo todo el texto visible en pantalla y descripción de lo que se dice/muestra",

  "estructura_temporal": {{
    "duracion_estimada_segundos": 30,
    "hook_0_3s": "qué pasa exactamente en los primeros 3 segundos — visual + audio",
    "desarrollo_3_20s": "cuerpo del mensaje",
    "cierre_ultimos_5s": "CTA y cierre",
    "momento_clave": "el segundo exacto donde el viewer tomaría la decisión de seguir viendo"
  }},

  "analisis_visual": {{
    "tipo_contenido": "UGC / producción profesional / screen recording / animación / testimonial",
    "ritmo_edicion": "muy rápido (<1s/corte) / rápido (1-2s) / medio (2-4s) / lento (>4s)",
    "hay_persona_en_camara": true,
    "tipo_hook_visual": "resultado impactante / pregunta / problema / antes-después / autoridad / shock",
    "elementos_dopamina": ["movimiento rápido", "colores contrastantes", "texto grande", "etc"],
    "elementos_confianza": ["cara real", "pantalla con números", "lugar reconocible", "etc"],
    "texto_en_pantalla": ["texto 1", "texto 2", "...todos los textos visibles"],
    "calidad_produccion": "amateur / semipro / profesional",
    "parece_ugc_organico": true,
    "parece_escalado": true
  }},

  "analisis_copy": {{
    "hook_frase_exacta": "la primera frase o texto que aparece — exacta",
    "estructura": "AIDA / PAS / Storytelling / Problema-Solución / Before-After / Hormozi-Stack",
    "promesa_principal": "qué promete exactamente",
    "mecanismo_unico": "cómo dice que lo logra (el 'nuevo método', 'el sistema', etc.)",
    "palabras_poder_usadas": ["gratis", "secreto", "probado", "etc"],
    "open_loops_creados": ["pregunta sin respuesta inmediata que genera curiosidad"],
    "objeciones_manejadas": ["objeción 1 que anticipa y neutraliza"],
    "cta_exacto": "qué pide que haga el viewer al final",
    "urgencia_escasez": "qué elementos de urgencia o escasez usa (si usa)",
    "prueba_social": "qué prueba social menciona o muestra",
    "score_copywriting": 7
  }},

  "analisis_psicologico": {{
    "emocion_principal_activada": "miedo / deseo / envidia / esperanza / frustración / urgencia",
    "dolor_especifico_tocado": "el dolor exacto, no genérico",
    "avatar_implicito": "a quién le está hablando exactamente (descripción detallada)",
    "nivel_sofisticacion_mercado": "1-virgen / 2-consciente del problema / 3-consciente de soluciones / 4-sofisticado / 5-saturado",
    "gatillos_psicologicos": ["autoridad", "reciprocidad", "prueba social", "escasez", "etc — los que usa"],
    "identidad_que_apela": "a qué identidad quiere que se identifique el viewer",
    "creencia_que_rompe": "qué creencia anterior destruye para instalar la suya"
  }},

  "analisis_estrategico": {{
    "marca_detectada": "nombre de marca o producto si se ve en el video",
    "producto_detectado": "qué está vendiendo exactamente",
    "precio_implicito": "si se menciona o se puede inferir el precio/inversión",
    "nicho_exacto": "nicho específico, no genérico",
    "angulo_central": "la gran idea del ad — en una frase",
    "por_que_funciona_este_angulo": "explicación estratégica concreta",
    "que_esta_testeando": "ángulo / hook / audiencia / oferta / precio — qué está probando con este ad",
    "funnel_detectado": "VSL / webinar / lead magnet / venta directa / consulta / etc",
    "plataforma_destino": "Instagram / TikTok / YouTube / Facebook — para qué plataforma está optimizado"
  }},

  "biblioteca_anuncios": {{
    "terminos_busqueda": [
      {{"termino": "nombre exacto para buscar", "razon": "por qué este término", "url_sugerida": "https://www.facebook.com/ads/library/?q=TERMINO&country=AR"}}
    ],
    "que_observar": [
      "Total de ads activos: 1-5 = testeando | 6-20 = algo funciona | 20+ = escalando",
      "Ad más viejo activo: +3 meses = rentable, +6 meses = ganador comprobado, +1 año = oro puro",
      "Actividad últimas 2 semanas: sin nuevos ads = pausaron o pivotearon",
      "Ad con más variaciones = su control, el que más convierte — copialo primero",
      "¿Usan UGC o producción? → te dice su estrategia de creative testing"
    ],
    "como_interpretar_los_datos": "cuando tengas los números (total de ads, fecha más vieja, actividad reciente), pegálos acá y te digo exactamente qué significan"
  }},

  "veredicto_duplicacion": {{
    "score_general": 8.2,
    "decision": "DUPLICAR CON MEJORAS",
    "por_que_funciona": [
      "razón concreta 1",
      "razón concreta 2",
      "razón concreta 3"
    ],
    "puntos_debiles": [
      "debilidad 1 que podés explotar",
      "debilidad 2"
    ],
    "que_mejorar_exactamente": [
      "mejora específica 1 con instrucción exacta",
      "mejora específica 2"
    ],
    "wedge": "el ángulo libre que nadie está atacando y que vos podés dominar — sé ultra específico",
    "diferenciador_que_te_gana": "cómo construís el ad que le gana a este"
  }},

  "script_template": {{
    "hook_0_3s": "primeros 3 segundos: visual + texto + audio exacto que vas a usar",
    "problema_3_8s": "agitación del dolor — copy exacto",
    "solucion_8_18s": "presentación de tu mecanismo único",
    "prueba_18_23s": "tu prueba social / resultado / número concreto",
    "cta_23_27s": "llamada a la acción con urgencia"
  }},

  "pipeline_seed": {{
    "nicho": "nicho detectado",
    "problema_principal": "el dolor central que está tocando",
    "wedge": "tu ángulo diferenciador vs. este competidor",
    "angulo_hook": "la idea central del hook para tu versión mejorada",
    "precio_competidor": "precio detectado o inferido",
    "estructura_funnel": "qué tipo de funnel están usando",
    "notas_estrategicas": "contexto clave para que el pipeline arranque con toda la inteligencia cargada"
  }}
}}"""


def _extract_frames(video_path: str, tmp_dir: str) -> list[str]:
    """Extrae frames estratégicos del video con ffmpeg."""

    hook_pattern = os.path.join(tmp_dir, "hook_%03d.jpg")
    hook_cmd = [
        "ffmpeg", "-i", video_path,
        "-t", "3",
        "-vf", "fps=2,scale=720:-1",
        "-frames:v", "6",
        hook_pattern,
        "-y", "-loglevel", "error",
    ]

    body_pattern = os.path.join(tmp_dir, "body_%03d.jpg")
    body_cmd = [
        "ffmpeg", "-i", video_path,
        "-ss", "3",
        "-vf", "fps=0.5,scale=720:-1",
        "-frames:v", "8",
        body_pattern,
        "-y", "-loglevel", "error",
    ]

    for cmd in [hook_cmd, body_cmd]:
        try:
            subprocess.run(cmd, check=True, timeout=60)
        except subprocess.CalledProcessError as e:
            logger.warning(f"[video_analyzer] ffmpeg error: {e}")
        except FileNotFoundError:
            logger.error("[video_analyzer] ffmpeg not found — install it")
            raise RuntimeError("ffmpeg no está instalado en el servidor.")

    frames: list[str] = []
    for prefix in ["hook_", "body_"]:
        frame_files = sorted(Path(tmp_dir).glob(f"{prefix}*.jpg"))
        for f in frame_files:
            with open(f, "rb") as fh:
                frames.append(base64.standard_b64encode(fh.read()).decode())

    return frames[:MAX_FRAMES]


def _build_content(frames: list[str], niche: str, brand: str, hypothesis: str) -> list[dict]:
    n_frames = len(frames)
    content: list[dict] = []

    for i, b64 in enumerate(frames):
        label = f"Frame {i+1}/{n_frames}"
        if i < 6:
            label = f"HOOK — {label} (primeros 3s)"
        elif i >= n_frames - 2:
            label = f"CIERRE — {label}"
        else:
            label = f"CUERPO — {label}"

        content.append({"type": "text", "text": f"[{label}]"})
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": b64,
            },
        })

    prompt_text = ANALYSIS_PROMPT.format(
        n_frames=n_frames,
        niche=niche or "no especificado",
        brand=brand or "no especificado",
        hypothesis=hypothesis or "ninguna",
    )
    content.append({"type": "text", "text": prompt_text})
    return content


def _parse_json(raw: str) -> dict:
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
        logger.warning(f"[video_analyzer] JSON parse failed: {e}")
        return {"error": "JSON parse failed", "raw_preview": raw[:2000]}


def analyze_video(
    video_bytes: bytes,
    filename: str,
    niche: str = "",
    brand: str = "",
    hypothesis: str = "",
    api_key: str = "",
) -> dict:
    """
    Recibe los bytes del video, extrae frames con ffmpeg y corre el análisis
    con Claude Vision. Devuelve el JSON completo del análisis.
    """
    if not api_key:
        raise ValueError("API key de Anthropic requerida")

    ext = Path(filename).suffix.lower() or ".mp4"
    analysis_id = str(uuid.uuid4())

    with tempfile.TemporaryDirectory() as tmp_dir:
        video_path = os.path.join(tmp_dir, f"input{ext}")
        with open(video_path, "wb") as fh:
            fh.write(video_bytes)

        frames = _extract_frames(video_path, tmp_dir)

    if not frames:
        raise RuntimeError("No se pudieron extraer frames del video. Verificá que sea un video válido.")

    client = anthropic.Anthropic(api_key=api_key)
    content = _build_content(frames, niche, brand, hypothesis)

    logger.info(f"[video_analyzer] {analysis_id} — {len(frames)} frames, llamando a Claude Vision")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text if response.content else ""
    result = _parse_json(raw)

    result["_meta"] = {
        "analysis_id": analysis_id,
        "frames_analyzed": len(frames),
        "filename": filename,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }

    return result
