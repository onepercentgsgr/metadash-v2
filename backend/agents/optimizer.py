import anthropic
import json


def analyze_campaigns(
    campaigns_data: list,
    negocio_info: str = "",
    api_key: str = "",
    adsets_data: list = None,
    clarity_insights: str = "",
) -> str:
    if not api_key:
        return "Error: api_key is required"

    try:
        alerts = []

        for campaign in campaigns_data:
            name = campaign.get("name", "Unknown")
            cpa = campaign.get("cpa") or 0
            frequency = campaign.get("frequency") or 0
            ctr = campaign.get("ctr") or 0
            conversions = campaign.get("purchases") or 0
            roas = campaign.get("roas") or 0

            if cpa and cpa > 2.5:
                alerts.append(f"🔴 PAUSAR: {name} — CPA ${cpa:.2f} supera 2.5x el umbral")
            if frequency > 3.5:
                alerts.append(f"🟡 ROTAR CREATIVO: {name} — Frecuencia {frequency:.1f} muy alta, audiencia quemada")
            if ctr < 0.8 and campaign.get("impressions", 0) > 1000:
                alerts.append(f"🟡 HOOK DÉBIL: {name} — CTR {ctr:.2f}% por debajo del 0.8%")
            if ctr > 3 and conversions == 0:
                alerts.append(f"🔴 LANDING ROTA: {name} — CTR {ctr:.2f}% alto pero 0 conversiones")
            if roas and roas > 2:
                alerts.append(f"🟢 ESCALAR: {name} — ROAS {roas:.2f}x, candidate para aumentar presupuesto")

        if adsets_data:
            for adset in adsets_data:
                aname = adset.get("name", "Conjunto sin nombre")
                aroas = adset.get("roas") or 0
                afreq = adset.get("frequency") or 0
                acpa = adset.get("cpa") or 0
                if acpa and acpa > 2.5:
                    alerts.append(f"🔴 CONJUNTO PAUSAR: {aname} — CPA ${acpa:.2f}")
                if afreq > 4:
                    alerts.append(f"🟡 CONJUNTO QUEMAR: {aname} — Frecuencia {afreq:.1f}")
                if aroas and aroas > 3:
                    alerts.append(f"🟢 CONJUNTO ESCALAR: {aname} — ROAS {aroas:.2f}x")

        alerts_text = "\n".join(alerts) if alerts else "No hay alertas críticas automáticas."
        business_context = f"\nContexto del negocio: {negocio_info}" if negocio_info else ""

        adsets_section = ""
        if adsets_data:
            adsets_section = f"""
DATOS POR CONJUNTO DE ANUNCIOS:
{json.dumps(adsets_data, indent=2, ensure_ascii=False)}
"""

        clarity_section = ""
        if clarity_insights and clarity_insights.strip():
            clarity_section = f"""
INSIGHTS DE MICROSOFT CLARITY (comportamiento en landing):
{clarity_insights}

Usá estos datos de Clarity para cruzar con el rendimiento de los ads — si el ad convierte bien (buena CTR) pero la landing tiene rage clicks o abandono alto, el problema no es el creativo sino la página.
"""

        prompt = f"""Sos un Media Buyer Senior con 10+ años gestionando cuentas de Meta Ads de alto volumen ($50K-$500K/mes). Trabajaste con e-commerce, SaaS, infoproductos en LATAM y España.{business_context}

ALERTAS AUTOMÁTICAS DETECTADAS:
{alerts_text}

DATOS DE CAMPAÑAS:
{json.dumps(campaigns_data, indent=2, ensure_ascii=False)}
{adsets_section}{clarity_section}
Analizá todo y respondé en 5 secciones específicas y accionables:

1. **DIAGNÓSTICO EJECUTIVO** — Salud general de la cuenta. Cuánto se gasta, cuánto se genera, si es rentable.

2. **PROBLEMAS CRÍTICOS** — Top 3 cosas que requieren acción HOY. Nombra campañas y conjuntos específicos.

3. **ACCIÓN HOY** — Lista numerada, pasos concretos para ejecutar en las próximas 2 horas.

4. **QUÉ ESCALAR Y CÓMO** — Qué está funcionando y cómo aumentar el presupuesto sin quemar el rendimiento.

5. **PRÓXIMOS 7 DÍAS** — Plan semanal priorizado con fechas y métricas objetivo.

Sé ultra específico. Mencioná nombres de campañas y conjuntos. Citá números. Evitá generalidades."""

        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    except Exception as e:
        return f"Error analizando campañas: {str(e)}"
