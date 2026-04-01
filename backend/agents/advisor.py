import anthropic
import json


def get_growth_strategy(business_data, negocio_info: str = "", api_key: str = "") -> str:
    """
    Provides comprehensive growth strategy recommendations.
    
    Args:
        business_data: Dict with business metrics and data
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        Growth strategy analysis
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un Head of Growth + CRO Expert con experiencia llevando negocios de 0 a $10M ARR en LATAM.{business_context}

DATOS DEL NEGOCIO:
{json.dumps(business_data, indent=2, ensure_ascii=False)}

Proporciona una estrategia de crecimiento en 3 secciones:

1. **DIAGNÓSTICO ACTUAL** - Análisis de estado actual, oportunidades de crecimiento identificadas
2. **ACCIONES PRIORIZADAS** - Lista de acciones ordenadas por impacto (potencial de crecimiento), incluyendo: acción, timeline, recurso requerido, impacto esperado
3. **MÉTRICAS DE ÉXITO** - KPIs clave a trackear para medir progreso

Sé estratégico pero también práctico. Enfócate en lo que realmente impacta el crecimiento."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error getting growth strategy: {str(e)}"


def get_cro_advice(funnel_data, negocio_info: str = "", api_key: str = "") -> str:
    """
    Provides CRO (Conversion Rate Optimization) advice for funnels.
    
    Args:
        funnel_data: Dict with funnel metrics (visits, conversions, etc.)
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        CRO analysis with specific recommendations
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un CRO Expert especializado en e-commerce y negocios digitales LATAM.{business_context}

DATOS DEL FUNNEL:
{json.dumps(funnel_data, indent=2, ensure_ascii=False)}

Proporciona un análisis CRO completo en 5 secciones:

1. **AUDIT DEL FUNNEL** - Estado de cada etapa del funnel con semáforos (🟢/🟡/🔴) basado en CVR:
   - Tasa de visita a landing
   - Tasa de landing a formulario/checkout
   - Tasa de formulario a pago
   - Tasa post-compra (retention/repeat)

2. **TOP 3 FRICTION POINTS** - Los 3 mayores puntos de fricción que están matando conversiones

3. **QUICK WINS** - Cambios simples que pueden implementarse en <48 horas con impacto inmediato

4. **3 HIPÓTESIS A/B** - Experimentos específicos a probar (cambio, métrica de éxito, población, duración)

5. **IMPACTO CVR ESTIMADO** - Si se implementan todas las recomendaciones, cuál sería el mejora esperada en CVR

Sé específico, usa números reales, proporciona hipótesis testables."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error getting CRO advice: {str(e)}"
