import anthropic
import json


def analyze_campaigns(campaigns_data: list, negocio_info: str = "", api_key: str = "") -> str:
    """
    Analyzes Meta Ads campaigns with automatic rule-based alerts before Claude analysis.
    
    Args:
        campaigns_data: List of campaign dictionaries with metrics
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        Analysis string with 5 sections
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        # Pre-calculate alerts based on rules
        alerts = []
        
        for campaign in campaigns_data:
            campaign_name = campaign.get("name", "Unknown")
            
            # CPA > 2.5x = PAUSE
            cpa = campaign.get("cpa", 0)
            if cpa > 2.5:
                alerts.append(f"🔴 PAUSE: {campaign_name} - CPA ${cpa:.2f} exceeds 2.5x threshold")
            
            # Frequency > 3.5 = ROTATE
            frequency = campaign.get("frequency", 0)
            if frequency > 3.5:
                alerts.append(f"🟡 ROTATE: {campaign_name} - Frequency {frequency:.1f} too high")
            
            # CTR < 0.8% = WEAK HOOK
            ctr = campaign.get("ctr", 0)
            if ctr < 0.8:
                alerts.append(f"🟡 WEAK HOOK: {campaign_name} - CTR {ctr:.2f}% below 0.8%")
            
            # CTR > 3% + 0 conversions = LANDING BROKEN
            conversions = campaign.get("conversions", 0)
            if ctr > 3 and conversions == 0:
                alerts.append(f"🔴 LANDING BROKEN: {campaign_name} - High CTR {ctr:.2f}% but 0 conversions")
            
            # ROAS > 2x = SCALE
            roas = campaign.get("roas", 0)
            if roas > 2:
                alerts.append(f"🟢 SCALE: {campaign_name} - ROAS {roas:.2f}x performing well")
        
        # Prepare context for Claude
        alerts_text = "\n".join(alerts) if alerts else "No critical alerts triggered."
        
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Eres un Media Buyer Senior con 10+ años gestionando cuentas de Meta Ads de alto volumen ($50K-$500K/mes). 
Trabajaste con e-commerce, SaaS, infoproductos en LATAM y España.{business_context}

ALERTAS AUTOMÁTICAS DETECTADAS:
{alerts_text}

DATOS DE CAMPAÑAS ACTUALES:
{json.dumps(campaigns_data, indent=2, ensure_ascii=False)}

Proporciona un análisis completo en 5 secciones:

1. **DIAGNÓSTICO EJECUTIVO** - Resumen de la salud general de la cuenta
2. **PROBLEMAS CRÍTICOS** - Top 3 issues que requieren acción inmediata
3. **ACCIÓN HOY** - Pasos concretos a ejecutar hoy
4. **QUÉ ESCALAR** - Campañas/estrategias con potencial de crecimiento
5. **PRÓXIMOS 7 DÍAS** - Plan semanal priorizado

Sé específico, accionable y basado en datos."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error analyzing campaigns: {str(e)}"
