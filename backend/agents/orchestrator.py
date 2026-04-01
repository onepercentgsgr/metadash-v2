import anthropic
import json
from . import optimizer, finance, script_gen, creative_director, landing_auditor, advisor


def run_full_audit(
    campaigns_data: list = None,
    creatives_data: list = None,
    financial_data: dict = None,
    landing_url: str = "",
    negocio_info: str = "",
    api_key: str = ""
) -> str:
    """
    Orchestrates a complete audit by calling all specialist agents and synthesizing results.
    
    Args:
        campaigns_data: List of campaign data (optional)
        creatives_data: List of creative data (optional)
        financial_data: Dict of financial data (optional)
        landing_url: Landing page URL to audit (optional)
        negocio_info: Business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        Unified CEO-level recommendation with all insights synthesized
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        # Collect all agent reports
        reports = {}
        findings_summary = []
        
        # 1. Landing Page Audit (if URL provided)
        if landing_url:
            print("[Orchestrator] Running landing page audit...")
            landing_report = landing_auditor.audit_landing_page(landing_url, negocio_info, api_key)
            reports["Landing Page Audit"] = landing_report
            findings_summary.append("• Landing page audit completed")
        
        # 2. Campaign Analysis (if campaigns provided)
        if campaigns_data:
            print("[Orchestrator] Analyzing campaigns...")
            campaigns_report = optimizer.analyze_campaigns(campaigns_data, negocio_info, api_key)
            reports["Campaign Analysis"] = campaigns_report
            findings_summary.append("• Campaign optimization analysis completed")
        
        # 3. Creative Analysis (if creatives provided)
        if creatives_data:
            print("[Orchestrator] Analyzing creatives...")
            creatives_report = creative_director.analyze_creatives(creatives_data, negocio_info, api_key)
            reports["Creative Analysis"] = creatives_report
            findings_summary.append("• Creative performance analysis completed")
        
        # 4. Financial Analysis (if financial data provided)
        if financial_data:
            print("[Orchestrator] Analyzing finances...")
            finance_report = finance.analyze_finances(financial_data, negocio_info, api_key)
            reports["Financial Analysis"] = finance_report
            findings_summary.append("• Financial health analysis completed")
        
        # 5. Script Generation (based on campaign findings)
        if campaigns_data or creatives_data:
            print("[Orchestrator] Generating scripts...")
            brief = "Based on current campaigns and creatives, generate new script variations"
            if creatives_data and len(creatives_data) > 0:
                brief = f"Generate scripts for {creatives_data[0].get('product', 'our product')}"
            scripts_report = script_gen.generate_scripts(brief, negocio_info, api_key, num_scripts=2)
            reports["Script Generation"] = scripts_report
            findings_summary.append("• Copy scripts generated")
        
        # 6. CEO Synthesis - Pass all reports to Claude CEO
        print("[Orchestrator] CEO synthesizing all reports...")
        
        reports_text = "\n\n".join([
            f"=== {title} ===\n{report}" for title, report in reports.items()
        ])
        
        findings_text = "\n".join(findings_summary)
        
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        ceo_prompt = f"""Sos el CEO / Head of Growth de esta empresa. Recibiste reportes de tu equipo de 5 expertos:
- Media Buyer (campañas)
- Creative Director (creatives)
- CFO (finanzas)
- CRO Expert (landing)
- Copywriter (scripts)

Tu trabajo es sintetizar TODO en un plan de acción ejecutivo priorizado.{business_context}

REPORTES DE EQUIPO:
{reports_text}

RESUMEN DE ANÁLISIS COMPLETADO:
{findings_text}

Proporciona un resumen ejecutivo unificado en 5 secciones:

1. **RESUMEN EJECUTIVO** - Situación actual en 2-3 párrafos. Health check general del negocio.

2. **ACCIONES PRIORIZADAS** - Dividido por timeline:
   - HOY (acciones inmediatas, <24 horas)
   - ESTA SEMANA (acciones críticas, <7 días)
   - ESTE MES (iniciativas de mayor impacto, <30 días)

3. **ASIGNACIÓN DE BUDGET** - Recomendación de cómo distribuir presupuesto entre:
   - Ads/campañas (% y en qué)
   - Optimización de landing/funnel (% de resources)
   - Creative testing (% de presupuesto)

4. **ALERTAS DE RIESGO** - Top 3 riesgos/blockers identificados y cómo mitigarlos

5. **PROYECCIÓN DE CRECIMIENTO** - Si se implementa el plan, cuál sería el impacto en:
   - MER / ROAS esperado
   - Revenue proyectado (30-90 días)
   - Crecimiento de customer base

Sé ejecutivo pero también pragmático. Proporciona números reales, no estimaciones vagas."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            messages=[
                {
                    "role": "user",
                    "content": ceo_prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error running full audit: {str(e)}"
