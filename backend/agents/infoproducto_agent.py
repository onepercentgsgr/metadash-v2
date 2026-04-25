"""
Infoproducto Agent — Nivel Dios

Receives (step_id, state), reads shared memory, calls Claude,
saves the output back to shared memory, and returns it.
"""

import json
import logging
import os
from typing import Any, Optional

import anthropic
from sqlalchemy.orm import Session

from agents.shared_memory import SharedMemoryStore

logger = logging.getLogger(__name__)


# Per-step metadata: which "agent persona" runs the prompt and the section it owns.
STEP_META = {
    "oferta":         {"agent": "EL INVESTIGADOR",  "focus": "Modelado de Oferta"},
    "investigacion":  {"agent": "EL INVESTIGADOR",  "focus": "Investigación de Mercado"},
    "avatares":       {"agent": "COPYWRITER DR",    "focus": "Avatares + Ángulos de Campaña"},
    "brand":          {"agent": "DIRECTOR DE ARTE", "focus": "Identidad Visual"},
    "mockup":         {"agent": "DIRECTOR DE ARTE", "focus": "Mockup Principal"},
    "ads":            {"agent": "DIRECTOR DE ARTE", "focus": "Prompts de ADS"},
    "bonus_mockups":  {"agent": "DIRECTOR DE ARTE", "focus": "Bonus Mockups"},
    "bundle":         {"agent": "DIRECTOR DE ARTE", "focus": "Bundle Completo"},
    "landing":        {"agent": "DEVELOPER",        "focus": "Landing Page de Conversión"},
    "copys":          {"agent": "COPYWRITER DR",    "focus": "Copys para Ads"},
    "guiones":        {"agent": "COPYWRITER DR",    "focus": "Guiones de Video Ads"},
    "ugc":            {"agent": "DIRECTOR DE ARTE", "focus": "UGC Realistas"},
    "producto":       {"agent": "EL INVESTIGADOR",  "focus": "Generador de Producto"},
    "upsells":        {"agent": "COPYWRITER DR",    "focus": "Upsells y AOV"},
    "email":          {"agent": "COPYWRITER DR",    "focus": "Email Marketing"},
}


def _build_prompt(step_id: str, state: dict, memory_context: dict) -> str:
    """
    Build the 'nivel dios' prompt for the given step.
    Uses the current state for this step's inputs and the full shared
    memory for cross-step context (so step N reads everything from 0..N-1).
    """
    meta = STEP_META.get(step_id, {"agent": "AGENTE", "focus": step_id})
    pais = state.get("pais", "LATAM")
    moneda = state.get("moneda", "USD")
    modismo = state.get("modismo", "neutro latinoamericano")

    step_data = state.get(step_id, {}) or {}

    # Build summary of previous steps' outputs so this step builds on them.
    previous_outputs = {}
    for sid in STEP_META.keys():
        if sid == step_id:
            continue
        out = (state.get(sid, {}) or {}).get("output")
        if out:
            previous_outputs[sid] = out[:600]

    return f"""Actuás como {meta['agent']} — el mejor en {meta['focus']} para infoproductos en {pais}.

═══════════════════════════════════════════════════════
CONTEXTO DEL PROYECTO (memoria compartida)
═══════════════════════════════════════════════════════
• Mercado: {pais} | Moneda: {moneda} | Tono cultural: {modismo}
• Datos del paso actual ({step_id}):
{json.dumps(step_data, ensure_ascii=False, indent=2)}

• Outputs ya generados en pasos anteriores:
{json.dumps(previous_outputs, ensure_ascii=False, indent=2) if previous_outputs else "(este es el primer paso)"}

• Memoria compartida adicional (campañas, métricas, insights):
{json.dumps(memory_context, ensure_ascii=False, indent=2)[:1500]}

═══════════════════════════════════════════════════════
REGLAS ABSOLUTAS
═══════════════════════════════════════════════════════
1. CERO vaguedades — cada output debe ser accionable hoy.
2. Adaptá precio, vocabulario y ejemplos a {pais} (moneda {moneda}, modismos {modismo}).
3. Construí sobre lo ya generado en pasos anteriores — no contradigas, no repitas.
4. El output debe poder copiarse y usarse directo, sin re-edición.
5. Priorizá lo que más impacta en CPL, CVR y ROAS — no lo que suena lindo.

═══════════════════════════════════════════════════════
TAREA: {meta['focus']}
═══════════════════════════════════════════════════════
Generá el output completo para esta sección. Usá títulos claros, listas
numeradas cuando aplique, y siempre cerrá con KPIs/métricas de éxito
esperadas para {pais}."""


def run_infoproducto_step(
    db: Session,
    user_id: int,
    step_id: str,
    state: dict,
    api_key: Optional[str] = None,
    model: str = "claude-opus-4-7",
) -> str:
    """
    Run the infoproducto agent for a specific step.

    1. Reads shared memory for cross-step context.
    2. Builds the prompt for `step_id` using `state` + memory.
    3. Calls Claude.
    4. Saves the output to shared memory under key `infoproducto.{step_id}`
       and persists the full state under `infoproducto.state`.
    5. Returns the output text.
    """
    if step_id not in STEP_META:
        raise ValueError(f"Unknown infoproducto step: {step_id}")

    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    memory = SharedMemoryStore(db, user_id)
    memory_context = memory.get_full_context()

    prompt = _build_prompt(step_id, state, memory_context)

    client = anthropic.Anthropic(api_key=key)
    message = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    output = message.content[0].text

    # Persist: per-step output + full state snapshot, so other agents see it.
    memory.write(f"infoproducto.{step_id}", output, agent="infoproducto_agent", memory_type="product")
    new_state = {**state, step_id: {**(state.get(step_id) or {}), "output": output}}
    memory.write("infoproducto.state", new_state, agent="infoproducto_agent", memory_type="product")

    # Mirror the most useful product fields to the canonical product.* keys
    # so Meta Ads / TikTok agents can read them without knowing about steps.
    if step_id == "oferta":
        oferta = state.get("oferta", {}) or {}
        for k_src, k_dst in [
            ("nombre", "product.nombre"),
            ("publico", "product.publico"),
            ("precio", "product.precio"),
            ("diferencial", "product.diferencial"),
        ]:
            if oferta.get(k_src):
                memory.write(k_dst, oferta[k_src], agent="infoproducto_agent", memory_type="product")
        if state.get("pais"):
            memory.write("pais", state["pais"], agent="infoproducto_agent", memory_type="product")
        if state.get("moneda"):
            memory.write("moneda", state["moneda"], agent="infoproducto_agent", memory_type="product")

    logger.info(f"[infoproducto_agent] step={step_id} user={user_id} output_len={len(output)}")
    return output
