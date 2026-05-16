import anthropic
import json
import requests
from bs4 import BeautifulSoup


def _extract_landing_data(url: str) -> dict:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")

    title = soup.title.string.strip() if soup.title and soup.title.string else "No title"
    meta_description = ""
    md_tag = soup.find("meta", attrs={"name": "description"})
    if md_tag:
        meta_description = md_tag.get("content", "")

    headings = []
    for h in soup.find_all(["h1", "h2", "h3"]):
        text = h.get_text(strip=True)
        if text:
            headings.append({"level": h.name, "text": text})

    cta_buttons = []
    for tag in soup.find_all(["button", "a"]):
        cls = tag.get("class") or []
        cls_str = " ".join(cls).lower() if isinstance(cls, list) else str(cls).lower()
        text = tag.get_text(strip=True)
        if text and ("btn" in cls_str or "cta" in cls_str or "button" in cls_str):
            cta_buttons.append(text)
    cta_buttons = list(dict.fromkeys(cta_buttons))[:15]

    images = []
    for img in soup.find_all("img"):
        src = img.get("src", "")
        alt = img.get("alt", "")
        if src:
            images.append({"src": src[:200], "alt": alt[:100]})
    images = images[:20]

    text_content = " ".join(soup.get_text().split())[:4000]

    return {
        "url": url,
        "title": title,
        "meta_description": meta_description or "Sin meta description",
        "headings": headings,
        "cta_buttons": cta_buttons or ["Sin CTAs detectados"],
        "images_total": len(soup.find_all("img")),
        "images_sample": images,
        "text_sample": text_content,
    }


COMPARATOR_SYSTEM_PROMPT = """Sos el mejor CRO Expert de LATAM. 15+ años haciendo split tests y analizando
landings de infoproductos en mercado hispano. Tu misión: comparar dos landings y decir exactamente qué cambiar.

Recibís dos landings: PROPIA y COMPETIDOR. Tu output es brutalmente accionable.

Devolvé tu análisis EN ESTE ORDEN EXACTO, usando estos separadores visuales:

═══════════════════════════════════════════
1. VEREDICTO RÁPIDO
═══════════════════════════════════════════
- NICHO detectado: [espiritualidad / coaching / trading / salud / educación / fitness / etc.]
- ¿Quién gana hoy?: PROPIA gana / COMPETIDOR gana / Empate
- Razón en 1 línea: ...
- CVR estimado PROPIA: X%  |  CVR estimado COMPETIDOR: Y%
- Ventaja o desventaja actual: +Z% o -Z%

═══════════════════════════════════════════
2. TABLA COMPARATIVA POR SECCIÓN
═══════════════════════════════════════════
| Elemento | Tu Landing | Competidor | Ganador |
| Headline principal | ... | ... | 🏆 / ⚠️ |
| Propuesta de valor | ... | ... | 🏆 / ⚠️ |
| CTAs (texto + cantidad) | ... | ... | 🏆 / ⚠️ |
| Trust signals | ... | ... | 🏆 / ⚠️ |
| Manejo de objeciones | ... | ... | 🏆 / ⚠️ |
| Prueba social / testimonios | ... | ... | 🏆 / ⚠️ |
| Oferta / precio | ... | ... | 🏆 / ⚠️ |
| Imágenes / visual | ... | ... | 🏆 / ⚠️ |
| Mobile-first | ... | ... | 🏆 / ⚠️ |
| Velocidad percibida | ... | ... | 🏆 / ⚠️ |

SCORE FINAL: Tu Landing __/10  |  Competidor __/10

═══════════════════════════════════════════
3. LO QUE EL COMPETIDOR HACE MEJOR
═══════════════════════════════════════════
Para cada ventaja del competidor:
🔴 [Elemento]: qué hace, por qué convierte mejor, impacto estimado en CVR

Mínimo 5 puntos concretos y accionables.

═══════════════════════════════════════════
4. LO QUE VOS HACÉS MEJOR (ventajas a mantener)
═══════════════════════════════════════════
✅ [Elemento]: qué tenés y el competidor no. NO lo cambies.

═══════════════════════════════════════════
5. GAP ANALYSIS — Los 3 elementos que más separan sus conversiones
═══════════════════════════════════════════
🎯 GAP #1: [nombre del gap]
   - Tu landing: ...
   - Competidor: ...
   - Impacto estimado: -X% conversión vs competidor
   - Solución exacta: ...

🎯 GAP #2: ...
🎯 GAP #3: ...

═══════════════════════════════════════════
6. PLAN DE ACCIÓN — ROBÁ LO MEJOR, MANTENÉS LO TUYO
═══════════════════════════════════════════
| # | Cambio a hacer | Inspirado en competidor | Impacto | Esfuerzo | Cuándo |
| 1 | ... | Sí/No | 🔥 Alto | ⚡ Bajo | HOY |
| 2 | ... | Sí/No | 🔥 Alto | 🔨 Medio | Esta semana |
| 3 | ... | Sí/No | 📈 Medio | ⚡ Bajo | Esta semana |
| 4 | ... | Sí/No | 📈 Medio | 🔨 Medio | 2 semanas |
| 5 | ... | Sí/No | 📊 Bajo | ⚡ Bajo | Este mes |

═══════════════════════════════════════════
7. PROMPTS LISTOS PARA COPIAR Y PEGAR
═══════════════════════════════════════════
Para los 3 cambios más importantes, generá un PROMPT COMPLETO listo para Claude/ChatGPT.
Cada prompt debe incluir: rol, contexto con datos reales de tu landing, fórmula a usar,
restricciones, tono, idioma, y output esperado.

### PROMPT #1 — [nombre del cambio]
[texto completo del prompt, con datos concretos de tu landing rellenados]

### PROMPT #2 — [nombre del cambio]
[texto completo]

### PROMPT #3 — [nombre del cambio]
[texto completo]

═══════════════════════════════════════════
8. SÍNTESIS EJECUTIVA
═══════════════════════════════════════════
Si aplicás estos cambios:
- CVR actual estimado: X%
- CVR potencial: Y%
- Lift esperado: +Z%
- Tiempo para implementar los cambios críticos: X horas/días

REGLAS DE ORO:
- Brutal honestidad. Si la tuya está peor, decilo claro.
- No copies todo del competidor — identificá qué SÍ tiene sentido para tu audiencia.
- Cada recomendación: específica y accionable, nunca genérica.
- Lenguaje: español neutro LATAM o rioplatense.
- Si algo no se pudo extraer bien, decilo upfront.
"""


def compare_landings(
    url_own: str,
    url_competitor: str,
    negocio_info: str = "",
    api_key: str = "",
) -> str:
    if not api_key:
        return "Error: api_key is required"

    errors = []
    try:
        own_data = _extract_landing_data(url_own)
    except Exception as e:
        own_data = {"url": url_own, "error": str(e)}
        errors.append(f"Tu landing ({url_own}): {str(e)}")

    try:
        competitor_data = _extract_landing_data(url_competitor)
    except Exception as e:
        competitor_data = {"url": url_competitor, "error": str(e)}
        errors.append(f"Landing competidor ({url_competitor}): {str(e)}")

    if errors:
        error_note = "⚠️ Errores al extraer algunas páginas:\n" + "\n".join(errors) + "\n\nAnálisis parcial:\n\n"
    else:
        error_note = ""

    business_context = f"CONTEXTO DEL NEGOCIO:\n{negocio_info}\n\n" if negocio_info else ""
    user_message = (
        f"{business_context}"
        f"LANDING PROPIA:\n"
        f"{json.dumps(own_data, indent=2, ensure_ascii=False)}\n\n"
        f"LANDING COMPETIDOR:\n"
        f"{json.dumps(competitor_data, indent=2, ensure_ascii=False)}"
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4000,
            system=[
                {
                    "type": "text",
                    "text": COMPARATOR_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_message}],
        )
        result = message.content[0].text
        return error_note + result
    except Exception as e:
        return f"Error en comparación de landings: {str(e)}"
