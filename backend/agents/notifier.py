import anthropic
import json
import re
import os
import logging
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def check_thresholds(
    campaigns_data: list,
    target_margin: float,
    notification_email: str = "",
) -> list[dict]:
    breakeven_roas = round(100 / target_margin, 2) if target_margin > 0 else 2.0

    alerts = []

    for campaign in campaigns_data:
        name = campaign.get("name", "Campaña desconocida")
        spend = campaign.get("spend") or 0
        roas = campaign.get("roas") or 0
        frequency = campaign.get("frequency") or 0
        ctr = campaign.get("ctr") or 0
        impressions = campaign.get("impressions") or 0
        purchases = campaign.get("purchases") or 0

        if roas < breakeven_roas and spend > 0:
            alerts.append({
                "nivel": "critico",
                "tipo": "roas_bajo",
                "campaña": name,
                "roas": roas,
                "breakeven": breakeven_roas,
                "mensaje": (
                    f"'{name}' tiene ROAS {roas:.2f} por debajo del breakeven {breakeven_roas} "
                    f"con ${spend:.2f} gastados."
                ),
            })

        if frequency > 4.0:
            alerts.append({
                "nivel": "advertencia",
                "tipo": "frecuencia_alta",
                "campaña": name,
                "frecuencia": frequency,
                "mensaje": (
                    f"'{name}' tiene frecuencia {frequency:.1f}, audiencia posiblemente saturada."
                ),
            })

        if ctr < 0.5 and impressions > 5000:
            alerts.append({
                "nivel": "advertencia",
                "tipo": "ctr_bajo",
                "campaña": name,
                "ctr": ctr,
                "impresiones": impressions,
                "mensaje": (
                    f"'{name}' tiene CTR {ctr:.2f}% con {impressions:,} impresiones. "
                    f"El creativo puede no estar resonando."
                ),
            })

        # CTR alto pero sin conversiones con gasto significativo → landing posiblemente rota
        if ctr > 3 and purchases == 0 and spend > 10:
            alerts.append({
                "nivel": "critico",
                "tipo": "landing_rota",
                "campaña": name,
                "ctr": ctr,
                "spend": spend,
                "mensaje": (
                    f"'{name}' tiene CTR {ctr:.2f}% y ${spend:.2f} gastados pero 0 compras. "
                    f"Posible problema en la landing page."
                ),
            })

        if roas >= breakeven_roas * 1.5:
            alerts.append({
                "nivel": "positivo",
                "tipo": "escalar",
                "campaña": name,
                "roas": roas,
                "breakeven": breakeven_roas,
                "mensaje": (
                    f"'{name}' tiene ROAS {roas:.2f}, un {((roas / breakeven_roas) - 1) * 100:.0f}% "
                    f"por encima del breakeven. Candidata a escalar presupuesto."
                ),
            })

    if notification_email and any(a["nivel"] == "critico" for a in alerts):
        try:
            smtp_host = os.environ.get("SMTP_HOST")
            smtp_port = int(os.environ.get("SMTP_PORT", 587))
            smtp_user = os.environ.get("SMTP_USER")
            smtp_pass = os.environ.get("SMTP_PASS")

            if smtp_host and smtp_user and smtp_pass:
                critical_alerts = [a for a in alerts if a["nivel"] == "critico"]
                body = "Alertas críticas detectadas:\n\n" + "\n".join(
                    f"- [{a['tipo']}] {a['mensaje']}" for a in critical_alerts
                )

                msg = MIMEText(body, "plain", "utf-8")
                msg["Subject"] = f"⚠️ Alertas críticas en tus campañas ({len(critical_alerts)} alertas)"
                msg["From"] = smtp_user
                msg["To"] = notification_email

                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, [notification_email], msg.as_string())
        except Exception:
            logger.exception("Error enviando email de notificación")

    return alerts
