import anthropic
import json
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Dimension,
    Metric,
    OrderBy,
)
from google.oauth2 import service_account
import traceback


def get_ga4_client(credentials_json: dict):
    """Create GA4 client from service account credentials."""
    credentials = service_account.Credentials.from_service_account_info(
        credentials_json,
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=credentials)


def fetch_ga4_data(property_id: str, credentials_json: dict, days: int = 30) -> dict:
    """
    Fetch key GA4 metrics for analysis.
    Returns a dict with traffic, conversion, and behavior data.
    """
    try:
        client = get_ga4_client(credentials_json)
        property_name = f"properties/{property_id}"

        # ── Overview metrics (last N days) ──
        overview_request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="totalUsers"),
                Metric(name="newUsers"),
                Metric(name="bounceRate"),
                Metric(name="averageSessionDuration"),
                Metric(name="screenPageViews"),
                Metric(name="conversions"),
                Metric(name="userEngagementDuration"),
            ],
        )
        overview = client.run_report(overview_request)

        overview_data = {}
        if overview.rows:
            row = overview.rows[0]
            for i, metric in enumerate(overview.metric_headers):
                val = row.metric_values[i].value
                overview_data[metric.name] = float(val) if "." in val else int(val)

        # ── Traffic sources ──
        sources_request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            dimensions=[
                Dimension(name="sessionDefaultChannelGroup"),
            ],
            metrics=[
                Metric(name="sessions"),
                Metric(name="conversions"),
                Metric(name="bounceRate"),
            ],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
            limit=10,
        )
        sources = client.run_report(sources_request)

        sources_data = []
        for row in sources.rows:
            sources_data.append({
                "channel": row.dimension_values[0].value,
                "sessions": int(row.metric_values[0].value),
                "conversions": int(row.metric_values[1].value),
                "bounce_rate": round(float(row.metric_values[2].value), 2),
            })

        # ── Top pages ──
        pages_request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            dimensions=[
                Dimension(name="pagePath"),
            ],
            metrics=[
                Metric(name="sessions"),
                Metric(name="bounceRate"),
                Metric(name="averageSessionDuration"),
                Metric(name="conversions"),
            ],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
            limit=15,
        )
        pages = client.run_report(pages_request)

        pages_data = []
        for row in pages.rows:
            pages_data.append({
                "page": row.dimension_values[0].value,
                "sessions": int(row.metric_values[0].value),
                "bounce_rate": round(float(row.metric_values[1].value), 2),
                "avg_duration_sec": round(float(row.metric_values[2].value), 1),
                "conversions": int(row.metric_values[3].value),
            })

        # ── Daily trend (last N days) ──
        daily_request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            dimensions=[Dimension(name="date")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="conversions"),
                Metric(name="totalUsers"),
            ],
            order_bys=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name="date"))],
        )
        daily = client.run_report(daily_request)

        daily_data = []
        for row in daily.rows:
            daily_data.append({
                "date": row.dimension_values[0].value,
                "sessions": int(row.metric_values[0].value),
                "conversions": int(row.metric_values[1].value),
                "users": int(row.metric_values[2].value),
            })

        # ── Device breakdown ──
        device_request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
            dimensions=[Dimension(name="deviceCategory")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="conversions"),
                Metric(name="bounceRate"),
            ],
        )
        devices = client.run_report(device_request)

        device_data = []
        for row in devices.rows:
            device_data.append({
                "device": row.dimension_values[0].value,
                "sessions": int(row.metric_values[0].value),
                "conversions": int(row.metric_values[1].value),
                "bounce_rate": round(float(row.metric_values[2].value), 2),
            })

        return {
            "overview": overview_data,
            "traffic_sources": sources_data,
            "top_pages": pages_data,
            "daily_trend": daily_data,
            "devices": device_data,
            "period_days": days,
            "property_id": property_id,
        }

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}


def analyze_analytics(
    property_id: str,
    ga4_credentials: dict,
    negocio_info: str = "",
    api_key: str = "",
    days: int = 30,
    landing_url: str = "",
    meta_ads_summary: str = "",
) -> str:
    """
    Fetches GA4 data and runs AI analysis.
    Optionally correlates with Meta Ads data and landing page info.
    """
    if not api_key:
        return "Error: Se requiere Anthropic API key"

    if not property_id or not ga4_credentials:
        return "Error: Se requiere GA4 Property ID y credenciales de servicio"

    # Fetch real GA4 data
    ga4_data = fetch_ga4_data(property_id, ga4_credentials, days)

    if "error" in ga4_data:
        return f"Error conectando con Google Analytics: {ga4_data['error']}"

    # Build context
    business_ctx = f"\nContexto del negocio: {negocio_info}" if negocio_info else ""
    landing_ctx = f"\nLanding page principal: {landing_url}" if landing_url else ""
    meta_ctx = f"\n\nDATOS DE META ADS (para correlacionar):\n{meta_ads_summary}" if meta_ads_summary else ""

    prompt = f"""Sos un Growth Analyst Senior especializado en analytics para e-commerce y productos digitales en LATAM.
Analizás datos de Google Analytics 4 y generás insights accionables para escalar.{business_ctx}{landing_ctx}

DATOS DE GOOGLE ANALYTICS 4 (últimos {days} días):
{json.dumps(ga4_data, indent=2, ensure_ascii=False)}
{meta_ctx}

Generá un análisis completo en 6 secciones:

1. **RESUMEN DE TRÁFICO**
   - Sesiones totales, usuarios, tendencia (creciendo/cayendo/estable)
   - Bounce rate general y si es saludable para el tipo de negocio
   - Duración promedio y engagement

2. **FUENTES DE TRÁFICO - DIAGNÓSTICO**
   Para cada fuente principal:
   - 🟢/🟡/🔴 Estado de salud
   - Volumen vs calidad (sesiones vs conversiones)
   - Costo-efectividad si hay datos de paid
   - ¿Dependencia peligrosa de una sola fuente?

3. **ANÁLISIS DE PÁGINAS CLAVE**
   - ¿Cuáles páginas convierten mejor? ¿Cuáles tienen bounce alto?
   - Landing page vs páginas internas
   - Páginas que necesitan optimización urgente
   - Flujo de usuario inferido

4. **DISPOSITIVOS Y UX**
   - Mobile vs Desktop: ¿dónde se pierde más gente?
   - Si mobile tiene bounce alto → problema de UX mobile
   - Recomendaciones específicas por dispositivo

5. **CORRELACIÓN META ADS ↔ ANALYTICS** (si hay datos de Meta)
   - ¿El tráfico de paid coincide con lo que reporta Meta?
   - ¿Las conversiones de GA4 matchean con Meta?
   - Discrepancias y posibles causas (attribution window, pixel issues)
   - ¿El tráfico orgánico crece cuando paid está activo? (halo effect)

6. **ACCIONES PRIORIZADAS**
   - **URGENTE** (esta semana): Top 3 quick wins
   - **IMPORTANTE** (este mes): Optimizaciones de mediano plazo
   - **ESTRATÉGICO** (próximos 90 días): Cambios estructurales

   Para cada acción: qué hacer, resultado esperado, métrica a monitorear.

Sé específico con números. No generalices. Si ves algo alarmante, decilo directo."""

    try:
        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )

        return message.content[0].text

    except Exception as e:
        return f"Error en análisis de analytics: {str(e)}"


def get_ga4_summary_for_agents(property_id: str, ga4_credentials: dict, days: int = 30) -> str:
    """
    Returns a compact text summary of GA4 data that other agents can use as context.
    Used by the orchestrator to enrich other agents' analysis.
    """
    data = fetch_ga4_data(property_id, ga4_credentials, days)

    if "error" in data:
        return f"[GA4 no disponible: {data['error']}]"

    ov = data.get("overview", {})
    sources = data.get("traffic_sources", [])
    pages = data.get("top_pages", [])
    devices = data.get("devices", [])

    lines = [
        f"=== GOOGLE ANALYTICS 4 (últimos {days} días) ===",
        f"Sesiones: {ov.get('sessions', 'N/A')} | Usuarios: {ov.get('totalUsers', 'N/A')} | Nuevos: {ov.get('newUsers', 'N/A')}",
        f"Bounce Rate: {ov.get('bounceRate', 'N/A')}% | Duración promedio: {ov.get('averageSessionDuration', 'N/A')}s",
        f"Conversiones: {ov.get('conversions', 'N/A')} | PageViews: {ov.get('screenPageViews', 'N/A')}",
        "",
        "Top fuentes de tráfico:",
    ]

    for s in sources[:5]:
        cvr = (s["conversions"] / s["sessions"] * 100) if s["sessions"] > 0 else 0
        lines.append(f"  - {s['channel']}: {s['sessions']} sesiones, {s['conversions']} conv ({cvr:.1f}%), bounce {s['bounce_rate']}%")

    lines.append("\nTop páginas:")
    for p in pages[:5]:
        lines.append(f"  - {p['page']}: {p['sessions']} sesiones, bounce {p['bounce_rate']}%, {p['conversions']} conv")

    lines.append("\nDispositivos:")
    for d in devices:
        lines.append(f"  - {d['device']}: {d['sessions']} sesiones, {d['conversions']} conv, bounce {d['bounce_rate']}%")

    return "\n".join(lines)
