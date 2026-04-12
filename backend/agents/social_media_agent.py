"""
Social Media Agent - Estrategia TikTok orgánico + Variaciones de creativos para Meta Ads
Basado en Playbook Nivel Dios Fase 5 y 6
"""

import anthropic
from typing import Optional

client = anthropic.Anthropic()
MODEL = "claude-haiku-4-5-20251001"

def generate_tiktok_strategy(
    nicho: str,
    pain_point: str,
    mechanism_name: str,
    target_audience: str,
    days: int = 7
) -> dict:
    """
    Genera estrategia completa de TikTok orgánico para validar en 72 horas.

    Objetivo: Generar tráfico GRATIS y validar si el ángulo funciona.

    Incluye:
    - Tipos de contenido
    - Hook strategy
    - Posting schedule
    - Métricas a trackear
    """

    prompt = f"""Eres un especialista en TikTok para infoproductos digitales.

Tu objetivo: Generar TRÁFICO GRATIS en {days} días testando hooks sin gastar en ads.

CONTEXTO:
- Nicho: {nicho}
- Dolor del usuario: {pain_point}
- Mecanismo Único: {mechanism_name}
- Audiencia: {target_audience}
- Duración: {days} días

INSTRUCCIONES:

Genera estrategia de contenido para TikTok que:
1. Testeé el ángulo de venta GRATIS
2. Genere tráfico al landing page
3. Valide si el hook funciona

**ESTRUCTURA DIARIA ({days} DÍAS)**

Para CADA día, dame:

DÍA 1-2: CONTENT FOUNDATION
- 3 tipos de videos que debo publicar (formato corto: 15-60 seg)
- Para CADA video: Hook, Propósito, CTA, Métrica a medir

DÍA 3-4: SCALE & TEST
- Analizar cuáles videos funcionan
- Replicar el hook ganador en 3 variaciones nuevas
- Meter un CTR más fuerte al landing

DÍA 5-6: MOMENTUM
- Subir contenido basado en lo que funcionó
- Agregar nuevo ángulo de venta
- Testear diferentes CTAs

DÍA 7: DECISIÓN
- Analizar overall performance
- ¿El hook funciona?
- ¿Hay tráfico al landing?

**PARA CADA VIDEO:**

1. HOOK (Primeros 3 segundos):
   - Debe detener el scroll
   - Visualmente impactante o una pregunta que duela
   - Ejemplos: "¿Por qué nadie te lo dijo?", "Mira esto...", "Espera 3 segundos"

2. CUERPO (10-15 segundos):
   - Validar el problema
   - Mostrar el mecanismo
   - Build curiosity

3. CTA (Último segundo):
   - "Link en bio"
   - "Descárgate la guía"
   - "Ver comentario fijado"

4. GUIÓN:
   Escribe el guión línea por línea

5. ELEMENTO VISUAL:
   Qué se ve (persona hablando, mockup, antes-después, etc)

6. AUDIO:
   Música recomendada (trending o calma)

7. MÉTRICA CLAVE:
   ¿Qué midió? (Watch time, shares, comments, link clicks)

**TIPOS DE VIDEOS SUGERIDOS:**

1. EDUCATIONAL: Enseña un pequeño hack del mecanismo
2. EMOTIONAL: Conecta con el dolor (historia)
3. CONTROVERSIAL: Rompe creencias ("Todos creen X pero...")
4. CURIOSITY: Hook puro que obliga a ver
5. TRANSFORMATION: Antes-después simple
6. FAQ: Responde preguntas del nicho
7. PROOF: Testimonios/Resultados rápidos

**POSTING SCHEDULE:**
- Cuándo postear (horas que funcionan en este nicho)
- Cuántos videos por día
- Responder comentarios en los primeros 30 minutos

**TRACKING:**
- Métrica #1: [métrica clave]
- Métrica #2: [métrica secundaria]
- Métrica #3: [validación de tráfico]

RESTRICCIONES:
- Sin presupuesto publicitario
- Máximo 60 segundos por video
- Lenguaje natural, sin "vender"
- No promociones obvias (suave, educativo)
- Consistencia > perfección

FORMATO:
Estructura por día, video por video."""

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
        "tiktok_strategy": strategy,
        "duration_days": days,
        "cost": "USD 0",
        "expected_traffic": "50-500 clicks depending on hook performance"
    }


def generate_creative_variations(
    winning_hook: str,
    angle_type: str,  # "pain", "result", "mechanism"
    format_type: str = "9x16"  # "9x16", "1x1", "3x4", "carousel"
) -> dict:
    """
    Genera variaciones de creativos basadas en un hook que funciona.

    Método: Cambiar UNA SOLA COSA a la vez:
    - Mismo guion, cambio de visuales
    - Mismos visuales, cambio de música
    - Misma música, cambio de voz
    - Después, cambiar ángulo completo pero mantener lo que funciona

    Basado en: "10 creativos activos en tu AveoPad"
    """

    prompt = f"""Eres especialista en creative testing para Meta Ads.

Tu objetivo: Generar 10 variaciones de UN HOOK que funciona, testear cada una, y escalar.

CONTEXTO:
- Hook ganador: {winning_hook}
- Tipo de ángulo: {angle_type}
- Formato: {format_type}

INSTRUCCIONES:

Genera 10 variaciones de este creative, cambiando UNA cosa a la vez:

**PRINCIPIO:**
Si algo funciona, no lo cambies TODO. Cambia 1 variable a la vez para entender qué realmente funciona.

**VARIACIONES (10 TOTAL):**

GRUPO 1: VARIAR VISUALES (cambio de visual, mismo guion y música)
1. Visual A: [describe visual 1]
   - Guion: [igual al original]
   - Música: [igual]
   - Por qué: [hipótesis]

2. Visual B: [describe visual 2]
   - Similar pero diferente enfoque
   - Por qué testear

3. Visual C: [describe visual 3]

GRUPO 2: VARIAR VOZ (mismo visual, cambio de voz/narrador)
4. Voz Masculina Deep: [características]
5. Voz Femenina Energética: [características]
6. Voz Rápida Directa: [características]

GRUPO 3: VARIAR MÚSICA (mismos visuales, cambio de audio)
7. Música Energética: [bpm, estilo]
8. Música Calma: [bpm, estilo]
9. Sin música, solo voiceover: [características]

GRUPO 4: NUEVO ÁNGULO, MISMO HOOK
10. Variación final: Mantener el hook pero cambiar contexto visual
    - Por ejemplo: si era "dolor", ahora mostrarlo en diferente situación

**PARA CADA VARIACIÓN:**

1. CAMBIO ESPECÍFICO:
   ¿Exactamente qué cambié?

2. COPY DEL CREATIVO:
   Si cambia algo, copialo aquí

3. DURACIÓN:
   Cuántos segundos

4. FORMATO TÉCNICO:
   - Resolución: 1080x1920 (9x16)
   - Tamaño archivo: <4MB
   - Codec: H264

5. TRACKING:
   - Métrica para medir: CTR, CPV, Conversión
   - Variable dependiente

6. HIPÓTESIS:
   ¿Por qué creo que va a funcionar mejor o igual?

7. CTA:
   ¿Mismo o cambio algo?

**TESTING PROTOCOL:**

- Lanzar CADA variación a presupuesto mínimo ($5 USD)
- Dejar correr 24 horas
- Los 3 ganadores: aumentar presupuesto
- Los 7 perdedores: pausar y aprender

**PLAN DE ESCALA:**

Una vez identificar la mejor:
- Semana 1: Testear 10 variaciones (Grupo 1+2+3)
- Semana 2: 10 nuevas variaciones del ganador
- Semana 3: Cambiar ángulo completamente, mantener visual
- Semana 4: Si sigue funcionando, AUMENTAR PRESUPUESTO

RESTRICCIONES:
- Cambio de 1 variable a la vez (máximo 2)
- Documento debe ser accionable
- Incluir referencias visuales si es posible
- No más de 30-60 segundos por video

FORMATO:
Tabla clara con: VARIACIÓN | CAMBIO | CTA | HIPÓTESIS | TESTING"""

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

    variations = response.content[0].text

    return {
        "status": "success",
        "creative_variations": variations,
        "total_creatives": 10,
        "testing_budget_per_creative": "USD 5",
        "testing_duration": "24 hours per creative"
    }


def generate_scaling_strategy(
    winning_creative_stats: dict,
    current_budget: float,
    target_roas: float = 3.0
) -> dict:
    """
    Genera estrategia de scaling basada en RPV vs CPV.

    Fórmula:
    - Si RPV > CPV: aumentar presupuesto 20-50%
    - Si RPV < CPV: cambiar creativo, no presupuesto
    """

    rpv = winning_creative_stats.get("revenue_per_visitor", 0)
    cpv = winning_creative_stats.get("cost_per_visitor", 0)
    ctr = winning_creative_stats.get("ctr", 0)
    conversion_rate = winning_creative_stats.get("conversion_rate", 0)

    prompt = f"""Eres un especialista en scaling y matemáticas de Facebook Ads.

CONTEXTO:
- RPV (Revenue per Visitor): USD {rpv}
- CPV (Cost per Visitor): USD {cpv}
- CTR (Click-through rate): {ctr}%
- Conversion Rate: {conversion_rate}%
- Presupuesto actual: USD {current_budget}/día
- Target ROAS: {target_roas}x

INSTRUCCIONES:

Analiza la matemática y dame:

1. **¿ESCALO O NO?**
   - Si RPV > CPV: SÍ, ESCALA
   - Si RPV ≤ CPV: NO, CAMBIA CREATIVO

   Tu recomendación clara.

2. **SI ESCALO:**

   a) Nuevo presupuesto sugerido:
      - Opción Conservadora: +20%
      - Opción Moderada: +50%
      - Opción Agresiva: +100%

      Para CADA opción, calcula:
      - Nuevo presupuesto diario
      - Visitantes esperados
      - Ventas esperadas (a conversion rate actual)
      - Ganancia neta

   b) Cambios en estructura:
      - ¿Mantener el mismo creativo?
      - ¿Agregar variaciones nuevas?
      - ¿Expandir audiencia?
      - ¿Cambiar horarios de casting?

   c) Milestones de escala:
      - Día 1-3: Presupuesto X, métrica objetivo
      - Día 4-7: Presupuesto Y, métrica objetivo
      - Semana 2: Presupuesto Z, métrica objetivo

3. **SI NO ESCALO:**

   a) ¿Por qué no funciona la matemática?
      Desglose el problema.

   b) Qué cambio PRIMERO:
      - Creativo (el hook)
      - Landing page (copy/conversión)
      - Precio (la oferta)
      - Audiencia (el target)

      Ranking de impacto.

   c) A/B test recomendado:
      - Variable A: [cambio 1]
      - Variable B: [cambio 2]
      - Control: [versión actual]
      Presupuesto: USD $5-10/día

4. **MÉTRICAS A MONITOREAR (Diarias):**
   - CPV
   - RPV
   - CTR
   - Conversion rate
   - ROAS
   - Spend
   - Revenue

5. **DECISIONES AUTOMÁTICAS:**
   - Si ROAS cae debajo de X: [acción]
   - Si CPV sube más de X%: [acción]
   - Si CTR baja debajo de X%: [acción]

RESTRICCIONES:
- Cálculos deben ser conservadores
- No asumir que las métricas se mantienen (suelen cambiar)
- Incluir cushion para variabilidad
- Recomendaciones claras y accionables

FORMATO:
Estructura con decisión clara al inicio, seguida de análisis."""

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
        "scaling_strategy": strategy,
        "rpv_cpv_ratio": f"{rpv / cpv if cpv > 0 else 0:.2f}",
        "recommendation": "SCALE" if rpv > cpv else "TEST DIFFERENT CREATIVE"
    }


async def run_social_media_analysis(data: dict) -> dict:
    """
    Ejecuta análisis completo de social media.
    """

    # TikTok strategy
    tiktok = generate_tiktok_strategy(
        nicho=data.get("nicho"),
        pain_point=data.get("pain_point"),
        mechanism_name=data.get("mechanism_name"),
        target_audience=data.get("audience"),
        days=7
    )

    # Creative variations
    variations = generate_creative_variations(
        winning_hook=data.get("hook", ""),
        angle_type=data.get("angle_type", "pain"),
        format_type=data.get("format_type", "9x16")
    )

    # Scaling strategy (si hay stats)
    scaling = None
    if data.get("winning_creative_stats"):
        scaling = generate_scaling_strategy(
            winning_creative_stats=data.get("winning_creative_stats", {}),
            current_budget=data.get("current_budget", 10)
        )

    return {
        "status": "success",
        "components": {
            "tiktok_strategy": tiktok,
            "creative_variations": variations,
            "scaling_strategy": scaling
        },
        "total_output": "Estrategia TikTok + Meta Ads completa"
    }
