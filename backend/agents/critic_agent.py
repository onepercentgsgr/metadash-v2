"""
Critic Agent — reviews each pipeline step's output, scores it 1-10, and
flags issues. If score < 7, the step gets ONE regeneration with feedback.

Uses Claude Haiku 4.5 (claude-haiku-4-5-20251001) for speed and cost
(~12x cheaper than Sonnet, perfect for review tasks).
"""

import json
import logging
from typing import Optional

import anthropic

logger = logging.getLogger(__name__)

CRITIC_SYSTEM = """Sos un editor senior de marketing digital especializado en infoproductos LATAM.
Tu trabajo: revisar UN entregable y devolver un JSON con score (1-10) y feedback específico.

CRITERIOS:
- ¿Tiene clichés genéricos vacíos? ("descubre el secreto", "cambia tu vida", etc.) → resta puntos
- ¿Es coherente con el contexto del producto?
- ¿El tono coincide con el público objetivo?
- ¿Hay datos concretos, números, especificidad?
- ¿Se siente escrito por un experto o por una IA genérica?

DEVOLVÉ ÚNICAMENTE JSON con esta forma exacta:
{"score": <1-10>, "issues": [<lista corta de problemas concretos>], "feedback_for_regen": "<instrucción específica de 1-2 oraciones para regenerar mejor>"}

Si el output está bien (score >= 7), devolvé issues=[] y feedback_for_regen="".
"""


def review_output(
    step_id: str,
    step_focus: str,
    output: str,
    api_key: str,
    product_context: Optional[str] = None,
) -> dict:
    """Review a step's output. Returns {score, issues, feedback_for_regen}."""
    if not output or len(output.strip()) < 50:
        return {"score": 3, "issues": ["Output muy corto o vacío"], "feedback_for_regen": "Generá un output completo y detallado."}

    user_msg = f"""PASO: {step_id} ({step_focus})
{f'CONTEXTO DEL PRODUCTO: {product_context[:600]}' if product_context else ''}

OUTPUT A REVISAR:
{output[:6000]}

Devolvé el JSON con tu evaluación."""

    try:
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=CRITIC_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw)
        result["score"] = int(result.get("score", 5))
        result["issues"] = list(result.get("issues", []))
        result["feedback_for_regen"] = str(result.get("feedback_for_regen", ""))
        return result
    except Exception as e:
        logger.warning(f"[critic] failed for {step_id}: {e}")
        return {"score": 7, "issues": [], "feedback_for_regen": ""}  # fail-open: accept output


def regenerate_with_feedback(
    db,
    user_id: int,
    step_id: str,
    state: dict,
    feedback: str,
    api_key: str,
) -> str:
    """Re-run a step with critic feedback injected as additional instruction."""
    # We append the feedback to the state's notes field so the playbook prompt sees it
    enriched_state = dict(state)
    step_data = dict(enriched_state.get(step_id) or {})
    notes = step_data.get("notas", "") or ""
    step_data["notas"] = f"{notes}\n\n[FEEDBACK PARA REGENERAR — RESPETÁ ESTAS INSTRUCCIONES]\n{feedback}".strip()
    enriched_state[step_id] = step_data

    from agents.infoproducto_agent import run_infoproducto_step
    return run_infoproducto_step(
        db=db, user_id=user_id, step_id=step_id,
        state=enriched_state, api_key=api_key,
    )
