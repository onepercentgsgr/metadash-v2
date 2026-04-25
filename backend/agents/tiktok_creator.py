"""
TikTok Video Creator Agent - 1 video per day strategy
Generates scripts, hooks, captions, and content calendar for TikTok
"""

from anthropic import Anthropic
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class TikTokCreatorAgent:
    """Agent that creates TikTok video content daily for selling infoproducts."""

    def __init__(self, api_key: Optional[str] = None):
        self.client = Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-opus-4-7"

    def generate_daily_video(self, context: dict) -> dict:
        """Generate complete TikTok video package for today."""

        memory = context.get("shared_memory", {})
        product = context.get("product", {})
        pais = memory.get("pais", "Argentina")
        nicho = product.get("nicho", "")
        publico = product.get("publico", "")
        precio = product.get("precio", "")
        angulo = context.get("angulo", "dolor")

        prompt = f"""Actuá como el mejor creador de contenido de TikTok para vender infoproductos en {pais}.

CONTEXTO DEL NEGOCIO:
- Nicho: {nicho}
- Público: {publico}
- Precio del producto: {precio}
- Ángulo del video: {angulo}
- Datos de campañas: {json.dumps(memory.get('campaign_data', {}), ensure_ascii=False)[:500]}

REGLAS ABSOLUTAS:
1. El hook dura MÁXIMO 3 segundos — si no engancha, se va
2. Sin intro, sin "hola soy", directo al gancho
3. Lenguaje coloquial de {pais} — cómo habla la gente en la calle
4. El video dura 15-60 segundos — ni más ni menos
5. Siempre hay un CTA al final claro
6. El video debe poder funcionar SIN AUDIO (subtítulos esenciales)
7. Usar tendencias actuales de TikTok

GENERÁ ESTO:

## CONCEPTO DEL VIDEO HOY
- Ángulo: {angulo}
- Duración ideal: [X] segundos
- Por qué va a funcionar HOY

## HOOK (primeros 3 segundos)
- Texto en pantalla: [texto exacto]
- Lo que dice el creador: [palabras exactas]
- Acción visual: [descripción de qué hace/muestra]

## GUIÓN COMPLETO (segundo a segundo)
[0-3s]: hook
[3-15s]: desarrollo
[15-30s]: solución/producto
[30-45s]: prueba social o resultado
[45-60s]: CTA

## CAPTION (descripción del video)
[Texto completo con hashtags para {pais}]

## HASHTAGS ESTRATÉGICOS
[10 hashtags — mix de nicho, trending y long-tail]

## ELEMENTOS DE PRODUCCIÓN
- Dónde grabar: [descripción]
- Qué mostrar: [elementos visuales]
- Música sugerida: [tipo/mood]
- Efecto de texto: [tipografía y animación]
- Transición clave: [descripción]

## PROMPT PARA MINIATURA CON IA
[Prompt listo para generar thumbnail con Midjourney/Flux]

## VARIANTE B (si el A no funciona)
[Hook alternativo + ángulo diferente]

## KPIs ESPERADOS
- Views esperados en 24hs: [rango]
- Engagement rate esperado: [%]
- Leads/ventas esperadas: [estimado]
"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "agent": "tiktok_creator",
            "date": datetime.now().isoformat(),
            "angulo": angulo,
            "content": response.content[0].text,
            "pais": pais
        }

    def generate_weekly_calendar(self, context: dict) -> dict:
        """Generate a full week of TikTok content with varied angles."""

        product = context.get("product", {})
        pais = context.get("shared_memory", {}).get("pais", "Argentina")
        nicho = product.get("nicho", "")

        angles = [
            "dolor + agitación",
            "transformación before/after",
            "detrás de escena / autenticidad",
            "mito vs. realidad del nicho",
            "tutorial rápido de valor gratuito",
            "testimonial/resultado real",
            "tendencia + nicho (trend hijacking)"
        ]

        prompt = f"""Creá un calendario completo de 7 videos de TikTok para vender un infoproducto de {nicho} en {pais}.

PRODUCTO: {json.dumps(product, ensure_ascii=False)}

Para cada día de la semana, con estos ángulos rotativos:
{chr(10).join([f'Día {i+1}: {a}' for i, a in enumerate(angles)])}

Para CADA video generá:
- Título del video
- Hook (primeros 3 segundos exactos)
- Concepto en 2 líneas
- Duración ideal
- Elemento diferencial del día
- Caption con hashtags
- Mejor hora para publicar en {pais}

Al final, incluí:
- La estrategia de los 7 días (arco narrativo)
- Cómo los videos se complementan
- Cuál es el más importante (el que más vende)
- Métricas a monitorear cada día
"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=6000,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "agent": "tiktok_creator",
            "type": "weekly_calendar",
            "date": datetime.now().isoformat(),
            "content": response.content[0].text
        }
