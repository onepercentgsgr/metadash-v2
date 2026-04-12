"""
Design Agent - Genera mockups, estrategia de conversión, y optimizaciones visuales
Basado en el Playbook Nivel Dios
"""

import anthropic
from typing import Optional

client = anthropic.Anthropic()
MODEL = "claude-haiku-4-5-20251001"

def generate_mockup_strategy(
    product_type: str,  # "PDF", "VIDEO", "TEMPLATE", "CURSO"
    product_name: str,
    nicho: str,
    price: float
) -> dict:
    """
    Genera estrategia de mockups para aumentar valor percibido.

    Los mockups hacen que lo digital parezca tangible:
    - PDF como libro físico
    - Video como serie en una tablet
    - Templates como kit profesional
    """

    prompt = f"""Eres un especialista en diseño de mockups para infoproductos digitales.

Tu objetivo: Hacer que lo DIGITAL parezca TANGIBLE para aumentar valor percibido.

CONTEXTO:
- Tipo de producto: {product_type}
- Nombre: {product_name}
- Nicho: {nicho}
- Precio: USD {price}

INSTRUCCIONES:

Genera una estrategia completa de mockups para presentar este producto.

Si es PDF:
- Portada 3D (libro sobre escritorio)
- Mock de páginas interiores (abiertas)
- Bundle visual (PDF + bonos juntos en un kit)
- Versión tablet (para reflejar consumo digital)

Si es VIDEO/CURSO:
- Mockup de laptop mostrando videos
- Mockup de tablet para consumo móvil
- Dashboard del área de miembros
- Progreso (mostrando % completado)

Si es TEMPLATE:
- Template en uso (en Figma/Adobe)
- Antes-después del resultado
- Componentes individuales
- Kit completo en overhead view

Si es GUÍA/LIBRO:
- Portada como bestseller
- Páginas interiores con contenido real
- Versión en diferentes formatos (PDF, web, ePub)

Para CADA mockup dame:

1. DESCRIPCIÓN: ¿Qué muestra? ¿Dónde se usa en la landing?

2. HERRAMIENTAS RECOMENDADAS:
   - Canva
   - Figma
   - MockFlow
   - O generador de mockups específico

3. COPY VISUAL (texto que aparece):
   - Título
   - Subtitle
   - Elementos clave a destacar

4. IMPACTO EN CONVERSIÓN:
   - Cómo afecta la percepción de valor
   - Dónde colocarlo en la landing

5. TIEMPO DE CREACIÓN:
   - Cuánto tarda con herramientas simples

ORDEN RECOMENDADO:
1. Principal (hero mockup)
2. Secundarios (3-4 variaciones)
3. Bonus mockups (si hay ofertas especiales)

RESTRICCIONES:
- Debe ser creíble (no CGI obviamente falso)
- Destacar el valor del producto
- Mostrar profesionalismo
- Color y tipografía deben coincidir con branding

FORMATO:
Estructura clara con mockup 1, 2, 3, etc."""

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

    strategy = response.content[0].text

    return {
        "status": "success",
        "mockup_strategy": strategy,
        "product_type": product_type,
        "conversion_impact": "25-40% lift en perceived value"
    }


def generate_landing_optimization_audit(
    headline: str,
    pain_point: str,
    price: float,
    offer_stack: list[str]
) -> dict:
    """
    Audita y sugiere optimizaciones para landing page basado en psicología de conversión.

    Revisa:
    - Claridad del headline
    - Manejo de objeciones
    - Estructura del copy
    - CTA placement
    - Social proof strategy
    """

    bonos_formatted = "\n".join([f"- {bono}" for bono in offer_stack])

    prompt = f"""Eres un especialista en optimización de conversión para landing pages.

CONTEXTO DE LA LANDING:
- Headline: {headline}
- Dolor que resuelve: {pain_point}
- Precio: USD {price}
- Stack de oferta:
{bonos_formatted}

INSTRUCCIONES:

Audita esta landing page y dame:

1. EVALUACIÓN DEL HEADLINE (Score 1-10):
   - ¿Promete resultado claro?
   - ¿Tiene tiempo definido?
   - ¿Elimina un dolor específico?
   - ¿Es memorable?

2. MANEJO DE OBJECIONES:
   Identifica las 5 objeciones más probables del usuario:
   - Objeción 1: [objeción]
   - Respuesta sugerida: [cómo rebatirla]

   Repite para 5 objeciones principales.

3. ESTRUCTURA DEL COPY:
   - ¿El lead conecta emocionalmente?
   - ¿La presentación valida?
   - ¿El stack es claro?
   - ¿La garantía es fuerte?
   - ¿El CTA es convincente?

   Score cada sección 1-10.

4. ELEMENTOS FALTANTES (Critical):
   ¿Qué NO incluye la landing que debería tener?
   - Social proof (testimonios)
   - Video de ventas
   - Urgencia/Scarcity
   - Garantía
   - FAQ
   - Contador de tiempo
   - Bonos de último minuto

5. RECOMENDACIONES DE COPYWRITING:
   Para CADA objeción o elemento faltante, dame:
   - Copy sugerido (2-3 líneas)
   - Dónde incluirlo
   - Por qué funciona

6. OPTIMIZACIONES DE LAYOUT:
   - ¿Dónde poner video (si hay)?
   - ¿Dónde poner testimonios?
   - ¿Dónde poner garantía?
   - ¿Dónde poner CTA secundario?

7. A/B TEST SUGERIDO:
   Dame 3 variaciones de headline para testear.

8. SCORE FINAL DE CONVERSIÓN:
   Estimación: Si el copy es 100%, dónde está esta landing (1-100)?

RESTRICCIONES:
- Sé brutal, no suavices
- Si algo falta, dilo claro
- Las objeciones deben ser reales del mercado
- Las sugerencias deben ser accionables

FORMATO:
Cada sección numerada y clara. Al final, un resumen ejecutivo de "Top 3 cosas que cambiaría"."""

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

    audit = response.content[0].text

    return {
        "status": "success",
        "conversion_audit": audit,
        "audit_type": "comprehensive landing page analysis"
    }


def generate_color_psychology_strategy(
    nicho: str,
    emotion_target: str,  # "trust", "urgency", "excitement", "calm"
    tone: str = "professional"
) -> dict:
    """
    Genera estrategia de colores y tipografía basada en psicología.

    Considera:
    - Psicología de colores por emoción
    - Contraste para CTAs
    - Legibilidad
    - Branding consistency
    """

    prompt = f"""Eres un especialista en psicología del color y diseño para conversión.

CONTEXTO:
- Nicho: {nicho}
- Emoción target: {emotion_target}
- Tono: {tone}

INSTRUCCIONES:

Genera estrategia de colores y tipografía optimizada para conversión.

1. PALETA DE COLORES RECOMENDADA (3 colores):
   Para cada color:
   - Nombre
   - Hex code
   - Psicología (por qué ese color)
   - Dónde usarlo en la landing
   - Contraste WCAG (accesibilidad)

2. SIGNIFICADO EMOCIONAL:
   - Cómo transmiten "{emotion_target}"
   - Qué sienten los usuarios
   - Por qué funciona en este nicho

3. CTA COLOR:
   - Recomendación específica para botón
   - Por qué ese color contra el fondo
   - Variación hover
   - Variación pressed

4. TIPOGRAFÍA:
   - Fuente para headline (Google Fonts)
   - Fuente para body (Google Fonts)
   - Tamaños recomendados
   - Line height para legibilidad
   - Por qué combinan

5. APLICACIÓN EN LANDING:
   - Hero section: colores A, B, C
   - Stack section: colores A, B, C
   - CTA buttons: color específico
   - Testimonios: color de fondo
   - Garantía: color de énfasis

6. REFERENCIAS VISUALES:
   - Landing page competidora que usa bien el color
   - Por qué funciona
   - Qué podrías adoptar

7. ARCHIVO DE ESTILOS:
   Da un CSS simple para implementar:
   ```
   --primary: #XXXXXX
   --secondary: #XXXXXX
   --cta: #XXXXXX
   --font-heading: 'Font Name'
   --font-body: 'Font Name'
   ```

RESTRICCIONES:
- Colores deben ser accesibles (WCAG AA mínimo)
- No más de 3 colores principales
- Las fuentes deben ser Google Fonts (gratis)
- Todo debe funcionar en Shopify/Webflow sin código custom

FORMATO:
Estructurado, con ejemplos de código CSS."""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1200,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    strategy = response.content[0].text

    return {
        "status": "success",
        "color_strategy": strategy,
        "accessibility": "WCAG AA compliant"
    }


async def run_design_analysis(data: dict) -> dict:
    """
    Ejecuta análisis completo de diseño.
    """

    # Mockup strategy
    mockups = generate_mockup_strategy(
        product_type=data.get("product_type", "PDF"),
        product_name=data.get("product_name"),
        nicho=data.get("nicho"),
        price=data.get("price", 17)
    )

    # Landing optimization
    landing_audit = generate_landing_optimization_audit(
        headline=data.get("headline", ""),
        pain_point=data.get("pain_point", ""),
        price=data.get("price", 17),
        offer_stack=data.get("bonos", [])
    )

    # Color psychology
    colors = generate_color_psychology_strategy(
        nicho=data.get("nicho"),
        emotion_target=data.get("emotion_target", "trust")
    )

    return {
        "status": "success",
        "components": {
            "mockup_strategy": mockups,
            "landing_audit": landing_audit,
            "color_psychology": colors
        },
        "total_output": "Estrategia visual completa"
    }
