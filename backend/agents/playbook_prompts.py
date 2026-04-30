"""
Playbook 'Nivel Dios' Prompts — Backend-only IP.

These 8 prompts power the entire Playbook flow. They previously lived in
frontend/src/pages/playbook.jsx as plain JS strings, which meant any
competitor with DevTools could lift them. This module is the single
source of truth — the frontend should NEVER receive these strings.

The wizard (15 steps) maps each step_id -> one of the 8 prompts via
STEP_TO_PROMPT. Some prompts are reused across steps (e.g. MOCKUPS_PROMPT
covers brand, mockup, bonus_mockups) because the underlying creative
brief is the same.

Placeholders inside each prompt (e.g. [NICHO], [PRECIO], [PAÍS],
[NOMBRE DEL PRODUCTO], [AUDIENCIA TARGET], [DOLOR], [MECANISMO]) are
filled at runtime in infoproducto_agent._build_prompt() from the user's
state + previous step outputs.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Prompt 0 — Evaluación de Nichos
# ─────────────────────────────────────────────────────────────────────────────
NICHE_SELECTOR_PROMPT = """Actúa como analista de oportunidades de mercado digital para infoproductos en LATAM.

Contexto:
Tengo [3-5] ideas de nicho para evaluar RÁPIDO. Mi modelo: 2 tiendas Shopify/semana, valido con ads + TikTok orgánico en 72hs, escalo las ganadoras.

Ideas:
1. [NICHO A]
2. [NICHO B]
3. [NICHO C]
4. [NICHO D]
5. [NICHO E]

País target: [PAÍS]

Para CADA nicho dame:
1. 5 keywords para Meta Ads Library
2. Qué espero encontrar si es viable
3. Banderas rojas
4. Ticket promedio estimado
5. Potencial en TikTok orgánico
6. Score 1-10

Al final:
- Ranking de mejor a peor
- Los 2 que ejecuto esta semana
- El que descarto y por qué"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 1 — Research de Mercado + Avatar
# ─────────────────────────────────────────────────────────────────────────────
RESEARCH_AVATAR_PROMPT = """Actúa como un funnel hacker y copywriter de respuesta directa.

Contexto:
Nicho ganador: [NICHO]
Datos encontrados:
- Ads activos: [NÚMERO]
- Tiempo corriendo: [MESES]
- Ticket promedio: USD [RANGO]
- Tipo de producto: [PDF/VIDEO/TEMPLATES]

Necesito:
1. Tamaño del mercado en [PAÍS]: cuánta gente tiene este problema
2. Tendencia: subiendo/estable/bajando
3. Keywords con volumen transaccional
4. Competencia orgánica en IG/TikTok/YT
5. Si capturo 0.1% del mercado a USD [PRECIO], cuánto facturo
6. DECISIÓN: SÍ/NO en 3 líneas

Crea tu MECANISMO ÚNICO:
- Nombre del mecanismo: [ej: "El Protocolo de 15 minutos"]
- Por qué es diferente: [describe tu ángulo único]
- Beneficio principal: [qué logra el usuario]"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 2 — Stack de Oferta Irresistible
# ─────────────────────────────────────────────────────────────────────────────
OFFER_STACK_PROMPT = """Voy a vender [NOMBRE DEL PRODUCTO] a USD [PRECIO].

Diseña un "Stack de Oferta" que incluya:

1. Producto Principal: [Nombre atractivo, no "curso" o "guía"]
2. Bono 1: [Resuelve objeción específica]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

3. Bono 2: [Otra objeción]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

4. Bono 3: [Urgencia/scarcity]
   Valor percibido: USD [estimado]
   Beneficio: [1 frase]

VALOR TOTAL DEL STACK: USD [suma de todos]
PRECIO DE HOY: USD [PRECIO] (Descuento del X%)

Para CADA bono, responde:
- ¿Qué objeción resuelve?
- ¿Por qué lo valúo en USD X?
- ¿Cómo hago que parezca "gratis"?"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 3 — Copy de Landing Page
# ─────────────────────────────────────────────────────────────────────────────
LANDING_COPY_PROMPT = """Escribe el copy para una Landing Page de una sola página.

Necesito:
1. Headline magnético (máximo 12 palabras):
   Fórmula: [Resultado] + [Tiempo] + [Sin el dolor]

2. Lead (conectar con el problema):
   Historia que valida el dolor

3. Presentación del mecanismo:
   - Qué es
   - Por qué funciona
   - Por qué es diferente
   - Quién debería usarlo

4. Stack de oferta:
   [Bono 1]: [Beneficio] - Valor USD X
   [Bono 2]: [Beneficio] - Valor USD X
   [Bono 3]: [Beneficio] - Valor USD X
   VALOR TOTAL: USD X
   PRECIO HOY: USD [PRECIO]

5. Garantía de 7 días
6. Preguntas frecuentes (5-6)
7. CTA final fuerte

TONO: [cercano, humilde, motivador]"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 4 — Mockups y Diseño Visual
# ─────────────────────────────────────────────────────────────────────────────
MOCKUPS_PROMPT = """Eres especialista en mockups para infoproductos digitales.

Tu objetivo: Hacer que lo DIGITAL parezca TANGIBLE.

Tipo de producto: [PDF/VIDEO/TEMPLATE/CURSO]
Nombre: [PRODUCTO]
Nicho: [NICHO]
Precio: USD [PRECIO]

Genera para CADA mockup:
1. DESCRIPCIÓN: ¿Qué muestra? ¿Dónde en la landing?
2. HERRAMIENTAS: Canva/Figma/MockFlow
3. COPY VISUAL: Títulos y elementos clave
4. IMPACTO: Cómo afecta valor percibido
5. TIEMPO: Cuánto tarda crear

Orden:
1. Principal (hero mockup)
2. Secundarios (3-4 variaciones)
3. Bonus mockups (si hay ofertas especiales)

PALETA DE COLORES:
- Color primario: #XXXXXX (psicología)
- Color secundario: #XXXXXX
- Color CTA: #XXXXXX (debe contrastar)

TIPOGRAFÍA:
- Headline: [Google Font]
- Body: [Google Font]
- Tamaños: [especifica]"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 5 — Estrategia TikTok Orgánico
# ─────────────────────────────────────────────────────────────────────────────
TIKTOK_ORGANIC_PROMPT = """Eres especialista en TikTok para infoproductos.

Objetivo: Generar TRÁFICO GRATIS en 7 días testando hooks.

Nicho: [NICHO]
Dolor del usuario: [DOLOR]
Mecanismo: [MECANISMO]
Audiencia: [AUDIENCIA TARGET]

Genera para CADA DÍA (7 días):

DÍA 1-2: CONTENT FOUNDATION
- 3 videos (15-60 seg cada uno)
- Para CADA video: Hook | Propósito | CTA | Métrica

DÍA 3-4: SCALE & TEST
- Analizar cuáles funcionan
- Replicar hook ganador en 3 variaciones
- Meter CTA más fuerte

DÍA 5-6: MOMENTUM
- Contenido basado en lo que funcionó
- Nuevo ángulo de venta
- Test diferentes CTAs

DÍA 7: DECISIÓN
- ¿El hook funciona?
- ¿Hay tráfico al landing?
- ¿Cuántos clics?

PARA CADA VIDEO:
- Hook (3 seg): Detiene scroll
- Cuerpo (10-15 seg): Valida problema
- CTA: "Link en bio" o "Ver comentario fijado"
- Visual recomendado
- Audio: Música trending o calma
- Métrica clave

POSTING SCHEDULE:
- Cuándo postear (horas que funcionan)
- Cuántos/día
- Responder comentarios en primeros 30 min"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 6 — Variaciones de Creativos Meta Ads
# ─────────────────────────────────────────────────────────────────────────────
META_ADS_VARIATIONS_PROMPT = """Eres especialista en creative testing para Meta Ads.

Tu hook ganador funciona. Ahora genera 10 VARIACIONES testando UNA cosa a la vez.

Hook ganador: [COPY DEL HOOK]
Ángulo: [PAIN/RESULT/MECHANISM]
Formato: [9x16/1x1/3x4/CAROUSEL]

PRINCIPIO: Si funciona, no cambies TODO. Cambia 1 variable.

GRUPO 1: VARIAR VISUALES (mismo guión y música)
1. Visual A: [describe]
2. Visual B: [describe]
3. Visual C: [describe]

GRUPO 2: VARIAR VOZ
4. Voz Masculina Deep
5. Voz Femenina Energética
6. Voz Rápida Directa

GRUPO 3: VARIAR MÚSICA
7. Música Energética: [bpm/estilo]
8. Música Calma: [bpm/estilo]
9. Sin música, solo voiceover

GRUPO 4: NUEVO ÁNGULO
10. Mantener hook, cambiar contexto visual

TESTING PROTOCOL:
- Lanzar CADA variación a $5 USD
- Dejar correr 24 horas
- 3 ganadores: aumentar presupuesto
- 7 perdedores: pausar y aprender

PLAN DE ESCALA:
- Semana 1: Testear 10 variaciones
- Semana 2: 10 nuevas del ganador
- Semana 3: Cambiar ángulo completamente
- Semana 4: Si funciona, ESCALAR PRESUPUESTO"""


# ─────────────────────────────────────────────────────────────────────────────
# Prompt 7 — Análisis RPV vs CPV
# ─────────────────────────────────────────────────────────────────────────────
RPV_VS_CPV_PROMPT = """Análisis de matemática para scaling.

MÉTRICAS ACTUALES:
- RPV (Revenue per Visitor): USD [X]
- CPV (Cost per Visitor): USD [X]
- CTR: [X%]
- Conversion Rate: [X%]
- Presupuesto actual: USD [X]/día
- Target ROAS: [X]x

FÓRMULA DE ORO:
RPV > CPV = ESCALA ✓
RPV ≤ CPV = CAMBIA CREATIVO ✗

DECISIÓN:
¿ESCALO O CAMBIO?

SI ESCALO:
1. Nuevo presupuesto sugerido (+20%, +50%, +100%)
2. Visitantes esperados
3. Ventas esperadas
4. Ganancia neta

CAMBIOS ESTRUCTURALES:
- ¿Mantener creativo?
- ¿Agregar variaciones?
- ¿Expandir audiencia?

MILESTONES:
- Día 1-3: Presupuesto X, objetivo Y
- Día 4-7: Presupuesto Y, objetivo Z
- Semana 2: Presupuesto Z, objetivo final

SI NO ESCALO:
1. ¿Por qué no funciona? (desglose del problema)
2. Qué cambio PRIMERO: Creativo / Landing / Precio / Audiencia
3. A/B test recomendado

MÉTRICAS DIARIAS A MONITOREAR:
- CPV
- RPV
- CTR
- Conversion rate
- ROAS
- Spend
- Revenue"""


# ─────────────────────────────────────────────────────────────────────────────
# Wizard step_id  ->  Playbook prompt
# ─────────────────────────────────────────────────────────────────────────────
# 15 wizard steps + 1 new "lanzamiento" step. Some prompts cover multiple
# steps (a step inherits the parent prompt and the runtime footer narrows
# the focus via STEP_META).
STEP_TO_PROMPT = {
    "oferta":         OFFER_STACK_PROMPT,
    "investigacion":  RESEARCH_AVATAR_PROMPT,
    "avatares":       RESEARCH_AVATAR_PROMPT,        # hereda research+avatar
    "brand":          MOCKUPS_PROMPT,                # hereda paleta/tono
    "mockup":         MOCKUPS_PROMPT,
    "ads":            META_ADS_VARIATIONS_PROMPT,
    "bonus_mockups":  MOCKUPS_PROMPT,
    "bundle":         OFFER_STACK_PROMPT,
    "landing":        LANDING_COPY_PROMPT,
    "copys":          META_ADS_VARIATIONS_PROMPT,
    "guiones":        TIKTOK_ORGANIC_PROMPT,
    "ugc":            TIKTOK_ORGANIC_PROMPT,
    "producto":       OFFER_STACK_PROMPT,
    "upsells":        OFFER_STACK_PROMPT,
    "email":          LANDING_COPY_PROMPT,
    "lanzamiento":    TIKTOK_ORGANIC_PROMPT,         # NUEVO step (faceless/cámara)
}


# Convenience for callers that want all 8 base prompts (e.g. caching layer
# or admin tools). Keep order stable so the prefix render stays deterministic.
ALL_PLAYBOOK_PROMPTS = (
    NICHE_SELECTOR_PROMPT,
    RESEARCH_AVATAR_PROMPT,
    OFFER_STACK_PROMPT,
    LANDING_COPY_PROMPT,
    MOCKUPS_PROMPT,
    TIKTOK_ORGANIC_PROMPT,
    META_ADS_VARIATIONS_PROMPT,
    RPV_VS_CPV_PROMPT,
)
