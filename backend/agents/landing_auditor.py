import anthropic
import json
import requests
from bs4 import BeautifulSoup


def _extract_landing_data(url: str) -> dict:
    """Extrae estructura, contenido e imágenes de una landing page."""
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


CRO_SYSTEM_PROMPT = """Sos el mejor CRO Expert de LATAM. 15+ años optimizando landings de
infoproductos con datos de miles de tests A/B en el mercado hispano.
Tu output es brutalmente accionable: cero teoría, todo listo para implementar.

Devolvé tu análisis EN ESTE ORDEN EXACTO, usando estos separadores visuales:

═══════════════════════════════════════════
1. DIAGNÓSTICO INICIAL
═══════════════════════════════════════════
- NICHO detectado: [espiritualidad / coaching / trading / salud / educación / fitness / etc.]
- PRODUCTO: qué venden, precio, formato
- TARGET inferido: edad, género, país, nivel económico
- VEREDICTO en 1 línea: ¿Vendible hoy? Sí / No / A medias

═══════════════════════════════════════════
2. CRO AUDIT POR SECCIÓN
═══════════════════════════════════════════
| Elemento | Score | Problema |
| Headlines | x/10 | ... |
| Copy / propuesta de valor | x/10 | ... |
| CTAs (texto + visibilidad) | x/10 | ... |
| Trust signals (autor, testimonios) | x/10 | ... |
| Manejo de objeciones | x/10 | ... |
| Visual hierarchy | x/10 | ... |
| Pricing y oferta | x/10 | ... |
| Imágenes / visual storytelling | x/10 | ... |

SCORE TOTAL: __/80

═══════════════════════════════════════════
3. ANÁLISIS DE IMÁGENES
═══════════════════════════════════════════
Basándote en alt text + URLs de imágenes extraídas:
- ¿Hay foto del autor/creador? (clave en LATAM)
- ¿Hay mockup del producto digital visible?
- ¿Hay screenshots / antes-después / testimonios visuales?
- ¿La calidad parece profesional o armado apurado?
- 3 imágenes faltantes que subirían conversión inmediato

═══════════════════════════════════════════
4. EXPERIENCIA MOBILE
═══════════════════════════════════════════
80%+ del tráfico LATAM es mobile. Evaluá:
- ¿CTA principal probablemente above the fold en mobile?
- ¿Los headlines parecen cortarse?
- ¿El precio está cerca del CTA?
- ¿Hay indicios de sticky CTA al scrollear?
🔴 Top 3 problemas mobile críticos

═══════════════════════════════════════════
5. FLUJO POST-CTA
═══════════════════════════════════════════
Hipotetizá qué pasa al hacer click en "Comprar":
- ¿Checkout directo o landing intermedia?
- ¿Order bump (producto extra al pagar)?
- ¿Upsell post-compra?
- ¿Métodos de pago LATAM (MercadoPago, transferencia, cuotas)?
🚨 RECOMENDACIÓN concreta: cómo sumar 20-40% al ticket promedio

═══════════════════════════════════════════
6. TOP 3 FRICTION POINTS
═══════════════════════════════════════════
🔴 #1: [problema]
   → Impacto estimado: -X% conversión
   → Causa raíz: ...

🔴 #2: ...
🔴 #3: ...

═══════════════════════════════════════════
7. MATRIZ DE PRIORIZACIÓN
═══════════════════════════════════════════
| # | Cambio | Impacto | Esfuerzo | Cuándo |
| 1 | ... | 🔥 Alto | ⚡ Bajo | HOY |
| 2 | ... | 🔥 Alto | 🔨 Medio | Esta semana |
| 3 | ... | 📈 Medio | ⚡ Bajo | Esta semana |
| 4 | ... | 📈 Medio | 🔨 Medio | 2 semanas |

═══════════════════════════════════════════
8. PROMPTS LISTOS PARA COPIAR Y PEGAR
═══════════════════════════════════════════
Para los 3 cambios prioritarios, generá un PROMPT COMPLETO que el dueño
copia y pega en Claude/ChatGPT y obtiene el copy nuevo listo.
Cada prompt debe incluir: rol, contexto, fórmulas, restricciones, idioma.

### PROMPT #1 — [nombre del cambio]
[texto completo del prompt, con contexto rellenado]

### PROMPT #2 — [nombre del cambio]
[texto completo]

### PROMPT #3 — [nombre del cambio]
[texto completo]

═══════════════════════════════════════════
9. REFERENCIAS DEL NICHO QUE CONVIERTEN
═══════════════════════════════════════════
Para el nicho detectado, mencioná 3-5 patrones que SÍ funcionan en LATAM:
- Estructura típica de landing que convierte
- Trust signals estándar del nicho
- Tipo de garantía habitual
- Formato de CTA que más rinde

═══════════════════════════════════════════
10. CVR ESTIMADO
═══════════════════════════════════════════
CVR actual estimado: X%
CVR potencial post-cambios: Y%
Lift esperado: +Z%
Justificación breve.

REGLAS DE ORO:
- Brutal honestidad: si es mala, decilo claro.
- Cada recomendación: específica + accionable.
- Cero teoría, todo output directo.
- Lenguaje: español neutro de LATAM o rioplatense.
- Si algo no se pudo extraer bien, decilo upfront.
"""


def audit_landing_page(url: str, negocio_info: str = "", api_key: str = "") -> str:
    """
    Audita una landing page con análisis CRO nivel dios.
    Modelo: Sonnet 4.6 con prompt caching (system cacheado, ahorro ~60% en audits repetidos).
    """
    if not api_key:
        return "Error: api_key is required"

    try:
        extracted = _extract_landing_data(url)
    except requests.RequestException as e:
        return f"Error fetching landing page: {str(e)}"
    except Exception as e:
        return f"Error extracting landing data: {str(e)}"

    business_context = f"CONTEXTO DEL NEGOCIO:\n{negocio_info}\n\n" if negocio_info else ""
    user_message = (
        f"{business_context}"
        f"LANDING EXTRAÍDA (HTML + imágenes + meta):\n"
        f"{json.dumps(extracted, indent=2, ensure_ascii=False)}"
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=3500,
            system=[
                {
                    "type": "text",
                    "text": CRO_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text
    except Exception as e:
        return f"Error auditing landing page: {str(e)}"
