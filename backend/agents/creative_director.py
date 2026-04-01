import anthropic
import json


def analyze_creatives(creatives_data: list, negocio_info: str = "", api_key: str = "") -> str:
    """
    Analyzes creative performance across Meta Ads with detailed diagnostics.
    
    Args:
        creatives_data: List of creative dictionaries with performance metrics
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        Creative analysis with performance recommendations
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        # Pre-analyze creative performance
        creative_status = []
        winner = None
        max_ctr = 0
        creatives_to_pause = []
        
        for creative in creatives_data:
            creative_id = creative.get("id", "Unknown")
            hook_rate = creative.get("hook_rate", 0)
            vtr = creative.get("vtr", 0)  # View-Through Rate
            ctr = creative.get("ctr", 0)
            frequency = creative.get("frequency", 0)
            
            # Determine status
            status = "🟢" if ctr > 2 else "🟡" if ctr > 1 else "🔴"
            creative_status.append(f"{status} {creative_id}: CTR {ctr:.2f}%, VTR {vtr:.1f}%, Hook {hook_rate:.1f}%")
            
            # Find winner
            if ctr > max_ctr:
                max_ctr = ctr
                winner = creative_id
            
            # Identify fatigue or poor performers
            if frequency > 3 or ctr < 0.5:
                creatives_to_pause.append(creative_id)
        
        status_text = "\n".join(creative_status)
        pause_text = ", ".join(creatives_to_pause) if creatives_to_pause else "None"
        
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un Creative Director con 10+ años dirigiendo estrategia creativa para e-commerce y DTC en Meta Ads.{business_context}

PERFORMANCE DE CREATIVES ACTUAL:
{status_text}

DATOS DETALLADOS:
{json.dumps(creatives_data, indent=2, ensure_ascii=False)}

Proporciona un análisis creativo en 6 secciones:

1. **PERFORMANCE POR CREATIVE** - Tabla/lista con semáforos (🟢/🟡/🔴) para cada creative basado en CTR, VTR, Hook Rate

2. **CREATIVE GANADOR** - Cuál es tu top performer y por qué funciona

3. **CREATIVES A PAUSAR** - Cuáles deberían pausarse inmediatamente y razón: {pause_text}

4. **DIAGNÓSTICO DE FATIGA** - Análisis de fatiga creativa (frequency > 3 = señal de fatiga)

5. **PRÓXIMAS CREATIVAS A TESTEAR** - 3 nuevas direcciones creativas a probar basadas en lo que está funcionando

6. **CREATIVE BRIEF** - Guía detallada para el equipo de diseño/video sobre qué hacer después

Usa datos reales, sé específico sobre qué elementos funcionan (hook, copy, visual, CTA)."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1800,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error analyzing creatives: {str(e)}"
