import anthropic
import json
import logging
from . import optimizer, finance, script_gen, creative_director, landing_auditor, advisor

logger = logging.getLogger(__name__)


def run_full_audit(
    campaigns_data: list = None,
    creatives_data: list = None,
    financial_data: dict = None,
    landing_url: str = "",
    negocio_info: str = "",
    api_key: str = "",
    db=None,
    user_id: int = None,
) -> str:
    """
    Orchestrates a complete audit by calling all specialist agents,
    writing findings to shared memory, and synthesizing results.

    All agents read/write the same shared memory so insights propagate.
    """
    if not api_key:
        return "Error: api_key is required"

    # Initialize shared memory if DB context available
    memory = None
    if db and user_id:
        try:
            from .shared_memory import SharedMemoryStore
            memory = SharedMemoryStore(db, user_id)
            logger.info(f"[Orchestrator] Shared memory initialized for user {user_id}")
        except Exception as e:
            logger.warning(f"[Orchestrator] Shared memory unavailable: {e}")

    try:
        reports = {}
        findings_summary = []

        # 1. Landing Page Audit
        if landing_url:
            logger.info("[Orchestrator] Running landing page audit...")
            landing_report = landing_auditor.audit_landing_page(landing_url, negocio_info, api_key)
            reports["Landing Page Audit"] = landing_report
            findings_summary.append("• Landing page audit completed")
            if memory:
                memory.add_insight(f"Landing audit: {landing_report[:200]}", "orchestrator")

        # 2. Campaign Analysis
        if campaigns_data:
            logger.info("[Orchestrator] Analyzing campaigns...")
            campaigns_report = optimizer.analyze_campaigns(campaigns_data, negocio_info, api_key)
            reports["Campaign Analysis"] = campaigns_report
            findings_summary.append("• Campaign optimization analysis completed")
            if memory:
                memory.add_insight(f"Campaign analysis: {campaigns_report[:200]}", "orchestrator")

        # 3. Creative Analysis
        if creatives_data:
            logger.info("[Orchestrator] Analyzing creatives...")
            creatives_report = creative_director.analyze_creatives(creatives_data, negocio_info, api_key)
            reports["Creative Analysis"] = creatives_report
            findings_summary.append("• Creative performance analysis completed")
            if memory:
                memory.add_insight(f"Creative analysis: {creatives_report[:200]}", "orchestrator")

        # 4. Financial Analysis
        if financial_data:
            logger.info("[Orchestrator] Analyzing finances...")
            finance_report = finance.analyze_finances(financial_data, negocio_info, api_key)
            reports["Financial Analysis"] = finance_report
            findings_summary.append("• Financial health analysis completed")
            if memory:
                memory.add_insight(f"Finance analysis: {finance_report[:200]}", "orchestrator")

        # 5. Script Generation
        if campaigns_data or creatives_data:
            logger.info("[Orchestrator] Generating scripts...")
            brief = "Based on current campaigns and creatives, generate new script variations"
            if creatives_data and len(creatives_data) > 0:
                brief = f"Generate scripts for {creatives_data[0].get('product', 'our product')}"
            scripts_report = script_gen.generate_scripts(brief, negocio_info, api_key, num_scripts=2)
            reports["Script Generation"] = scripts_report
            findings_summary.append("• Copy scripts generated")

        # 6. Inject shared memory context into CEO synthesis
        memory_context = ""
        if memory:
            try:
                full_ctx = memory.get_full_context()
                if full_ctx.get("product", {}).get("nombre"):
                    memory_context = f"\n\nCONTEXTO DE MEMORIA COMPARTIDA:\n"
                    memory_context += f"- Producto: {full_ctx['product']['nombre']}\n"
                    memory_context += f"- Nicho: {full_ctx['product']['nicho']}\n"
                    memory_context += f"- Público: {full_ctx['product']['publico']}\n"
                    if full_ctx.get("winning_creatives"):
                        memory_context += f"- Creativos ganadores: {len(full_ctx['winning_creatives'])}\n"
                    if full_ctx.get("failed_angles"):
                        memory_context += f"- Ángulos fallidos: {len(full_ctx['failed_angles'])}\n"
                    if full_ctx.get("campaign_data", {}).get("roas"):
                        memory_context += f"- ROAS actual: {full_ctx['campaign_data']['roas']}\n"
            except Exception as e:
                logger.warning(f"[Orchestrator] Could not read shared memory: {e}")

        # 7. CEO Synthesis
        logger.info("[Orchestrator] CEO synthesizing all reports...")

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

Tu trabajo es sintetizar TODO en un plan de acción ejecutivo priorizado.{business_context}{memory_context}

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

        result = message.content[0].text

        # Write final synthesis to shared memory
        if memory:
            memory.write("last_ceo_synthesis", result[:500], "orchestrator", "decision")
            memory.add_insight(f"CEO synthesis completed with {len(reports)} agent reports", "orchestrator")

        return result

    except Exception as e:
        logger.error(f"Error running full audit: {type(e).__name__}: {str(e)}")
        return f"Error running full audit: {str(e)}"
