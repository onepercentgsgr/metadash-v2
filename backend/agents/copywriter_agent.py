"""
Copywriter Agent - Crea copy de landing pages y anuncios usando respuesta directa
Basado en el Playbook Nivel Dios framework
"""

import anthropic
from typing import Optional

client = anthropic.Anthropic()
MODEL = "claude-haiku-4-5-20251001"

def generate_landing_page_copy(
    nicho: str,
    audience: str,
    pain_point: str,
    mechanism_name: str,
    mechanism_description: str,
    price: float,
    bonos: list[str],
    tone: str = "cercano, humilde y motivador"
) -> dict:
    """
    Genera el copy completo para una landing page usando estructura de respuesta directa.

    Estructura:
    - Headline (promesa + tiempo + beneficio)
    - Lead (conectar con el dolor)
    - Presentation (mecanismo único)
    - Stack de oferta (producto + bonos)
    - Garantía
    - CTA
    """

    bonos_formatted = "\n".join([f"- {bono}" for bono in bonos])

    prompt = f"""Eres un copywriter experto en respuesta directa especializado en infoproductos digitales.

Necesito que generes el copy COMPLETO para una landing page de una sola página.

CONTEXTO:
- Nicho: {nicho}
- Audiencia target: {audience}
- Dolor principal: {pain_point}
- Mecanismo Único: {mechanism_name}
- Descripción: {mechanism_description}
- Precio: USD {price}
- Bonos incluidos:
{bonos_formatted}

INSTRUCCIONES:

Genera usando estructura de Respuesta Directa:

1. HEADLINE (Máximo 12 palabras):
   Fórmula: [Resultado] + [Tiempo] + [Sin el dolor]
   Ej: "Duerme Mejor en 15 Días Sin Pastillas"

2. SUB-HEADLINE (1-2 líneas):
   Conecta con el problema específico

3. LEAD (3-4 líneas):
   Historia que valida el dolor. "¿Cuántas noches sin dormir?"

4. PRESENTACIÓN DEL MECANISMO (4-5 párrafos):
   - Qué es el {mechanism_name}
   - Por qué funciona
   - Por qué es diferente a lo tradicional
   - Quién debería usarlo
   - Qué NO necesitas (herramientas caras, cursos largos, etc)

5. DESGLOSE DEL STACK (para cada bonus):
   [BONO]: [Beneficio en 1 frase]
   Valor percibido: USD [estimado]

6. VALOR TOTAL DEL STACK:
   Suma de todos los bonos

7. TU PRECIO HOY:
   USD {price} (descuento del X%)

8. GARANTÍA:
   7 días dinero de vuelta sin preguntas. "Si no te funciona..."

9. PREGUNTAS FRECUENTES (5-6):
   - ¿Es para mí si soy principiante?
   - ¿Cuánto tiempo toma ver resultados?
   - ¿Qué pasa si no funciona?
   - Etc

10. CIERRE + CTA:
    1-2 párrafos finales de convicción.
    Botón: "Acceso Ahora - USD {price}"

TONO: {tone}

RESTRICCIONES:
- No uses bullet points en el cuerpo, solo párrafos
- Enfócate en transformación, no features
- Usa lenguaje de beneficio, no técnico
- Cada sección debe ser corta y punchy
- Incluye "Por qué tú" - por qué este usuario específico

FORMATO:
Entrega el copy en bloques claramente etiquetados para que se pueda usar directamente en Webflow/Shopify."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    copy_content = response.content[0].text

    return {
        "status": "success",
        "copy": copy_content,
        "sections": [
            "headline",
            "sub_headline",
            "lead",
            "mechanism_presentation",
            "stack_breakdown",
            "total_value",
            "price_offer",
            "guarantee",
            "faq",
            "closing_cta"
        ],
        "estimated_words": len(copy_content.split())
    }


def generate_ad_scripts(
    nicho: str,
    pain_point: str,
    mechanism_name: str,
    price: float,
    angle_type: str = "multi"  # "pain", "result", "mechanism"
) -> dict:
    """
    Genera 3 variaciones de guiones para anuncios Meta/TikTok de 30 segundos.

    Variaciones:
    - Var A: Enfocada en el Dolor
    - Var B: Enfocada en el Resultado
    - Var C: Enfocada en el Mecanismo Único
    """

    prompt = f"""Eres un copywriter de anuncios especializado en digital products.

Necesito 3 guiones para anuncios de 30 segundos para Meta Ads / TikTok.

CONTEXTO:
- Nicho: {nicho}
- Dolor principal: {pain_point}
- Mecanismo Único: {mechanism_name}
- Precio: USD {price}

INSTRUCCIONES:

Genera 3 variaciones de 30 segundos cada una:

**VARIACIÓN A: Enfocada en el Dolor**
- Hook (primeros 5 seg): Pregunta que duela o estadística impactante
- Cuerpo (15 seg): Validar el dolor, mostrarlo tangible
- CTA (último segundo): Curiosidad pura para hacer clic

**VARIACIÓN B: Enfocada en el Resultado**
- Hook: Mostrar transformación, antes-después visual
- Cuerpo: Explicar rápido qué lograron
- CTA: "Mira cómo lo hicimos"

**VARIACIÓN C: Enfocada en el Mecanismo Único**
- Hook: Romper creencias ("Todos creen que X, pero la realidad es...")
- Cuerpo: Presentar el {mechanism_name}
- CTA: "Descubre cómo funciona"

RESTRICCIONES:
- Máximo 30 segundos (estimado: 50-70 palabras por guión)
- Lenguaje conversacional, como si lo dijera un amigo
- Incluir una acción clara (haz clic, descarga, mira)
- Apto para voiceover + visuals dinámicos
- Sin emojis en el guión, pero indicar dónde iría visual

FORMATO:
Para cada variación:
[HOOK - primeros 5 seg]
[CUERPO - 15-20 seg]
[CTA - último segundo]

---

Además, para cada guión dame:
- Tipo de visual recomendado (UGC/Mockup/Video de demostración)
- Música sugerida (energética/calmada/rápida)
- Texto que aparecería en pantalla (si lo hubiera)"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    scripts = response.content[0].text

    return {
        "status": "success",
        "scripts": scripts,
        "variations": 3,
        "platforms": ["Meta Ads", "TikTok"],
        "format": "30 seconds each"
    }


def generate_email_sequence(
    product_name: str,
    mechanism_name: str,
    price: float,
    bonos: list[str],
    days: int = 7
) -> dict:
    """
    Genera secuencia de emails para convertir leads en compradores.

    Secuencia típica:
    - Email 1: Hook + Presentación
    - Email 2: Validación social + Testimonios
    - Email 3: Urgencia + Oferta
    - Email 4: Reminder + Cierre
    """

    bonos_formatted = ", ".join(bonos)

    prompt = f"""Eres un email marketer especializado en productos digitales.

Genera una secuencia de {days} días para convertir leads en compradores.

PRODUCTO: {product_name}
MECANISMO: {mechanism_name}
PRECIO: USD {price}
BONOS: {bonos_formatted}

INSTRUCCIONES:

Genera {days} emails con esta estructura:

**EMAIL 1 (Hook + Presentación)**
- Subject line que provoque curiosidad
- Presentar el problema
- Introducir el {mechanism_name}
- Soft CTA: "Lee más"

**EMAIL 2 (Validación Social)**
- Subject line: Social proof
- Incluir 1-2 testimonios/resultados
- Explicar por qué funciona
- CTA: "Ver testimonios completos"

**EMAIL 3 (Limitación + Urgencia)**
- Subject line: Urgencia suave (descuento por X días, cupos limitados)
- Recordar el precio + stack
- Listear los bonos
- CTA: "Acceso ahora"

**EMAIL 4 (Último recordatorio)**
- Subject line: "Últimas horas..."
- Resuelta la objeción final
- Incluir garantía
- CTA final fuerte

RESTRICCIONES:
- Máximo 150 palabras por email
- Lenguaje conversacional y directo
- Incluir subject line para cada uno
- Sin exceso de emojis
- Cada email debe tener UN objetivo claro

FORMATO:
Para cada email:
---
EMAIL 1
[Subject]
[Cuerpo]
[CTA]
---"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    emails = response.content[0].text

    return {
        "status": "success",
        "emails": emails,
        "sequence_days": days,
        "estimated_conversion_lift": "15-30%"
    }


async def run_copywriter_analysis(data: dict) -> dict:
    """
    Endpoint wrapper para ejecutar todo el análisis del copywriter.
    """

    # Primero, generar landing page copy
    landing_copy = generate_landing_page_copy(
        nicho=data.get("nicho"),
        audience=data.get("audience"),
        pain_point=data.get("pain_point"),
        mechanism_name=data.get("mechanism_name"),
        mechanism_description=data.get("mechanism_description"),
        price=data.get("price", 17),
        bonos=data.get("bonos", []),
        tone=data.get("tone", "cercano, humilde y motivador")
    )

    # Generar ad scripts
    ad_scripts = generate_ad_scripts(
        nicho=data.get("nicho"),
        pain_point=data.get("pain_point"),
        mechanism_name=data.get("mechanism_name"),
        price=data.get("price", 17)
    )

    # Generar email sequence
    email_seq = generate_email_sequence(
        product_name=data.get("nicho"),
        mechanism_name=data.get("mechanism_name"),
        price=data.get("price", 17),
        bonos=data.get("bonos", [])
    )

    return {
        "status": "success",
        "components": {
            "landing_page": landing_copy,
            "ad_scripts": ad_scripts,
            "email_sequence": email_seq
        },
        "total_output": "3 componentes listos para usar"
    }
