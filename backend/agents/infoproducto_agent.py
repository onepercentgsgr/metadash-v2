"""
Infoproducto Agent — Nivel Dios

Receives (step_id, state), reads shared memory, calls Claude,
saves the output back to shared memory, and returns it.

Now uses the IP-protected 'Nivel Dios' Playbook prompts (see
agents.playbook_prompts) as the system message, with Anthropic prompt
caching enabled so repeated calls hit the cache (~90% cheaper). The
volatile per-request user state goes in `messages`, not `system`.

Default model is Sonnet 4.6 — cheaper, fast, and its prompt-cache
threshold (1024 tokens) is reachable by our Playbook prompts so caching
actually delivers savings. Reserve Opus for the final CEO synthesis.
"""

import json
import logging
import os
from typing import Any, Optional

import anthropic
from sqlalchemy.orm import Session

from agents.shared_memory import SharedMemoryStore
from agents.playbook_prompts import STEP_TO_PROMPT

logger = logging.getLogger(__name__)


# Per-step metadata: which "agent persona" runs the prompt and the section it owns.
STEP_META = {
    "oferta":         {"agent": "EL INVESTIGADOR",         "focus": "Modelado de Oferta"},
    "investigacion":  {"agent": "EL INVESTIGADOR",         "focus": "Investigación de Mercado"},
    "avatares":       {"agent": "COPYWRITER DR",           "focus": "Avatares + Ángulos de Campaña"},
    "brand":          {"agent": "DIRECTOR DE ARTE",        "focus": "Identidad Visual"},
    "mockup":         {"agent": "DIRECTOR DE ARTE",        "focus": "Mockup Principal"},
    "ads":            {"agent": "DIRECTOR DE ARTE",        "focus": "Prompts de ADS"},
    "bonus_mockups":  {"agent": "DIRECTOR DE ARTE",        "focus": "Bonus Mockups"},
    "bundle":         {"agent": "DIRECTOR DE ARTE",        "focus": "Bundle Completo"},
    "landing":        {"agent": "DEVELOPER",               "focus": "Landing Page de Conversión"},
    "copys":          {"agent": "COPYWRITER DR",           "focus": "Copys para Ads"},
    "guiones":        {"agent": "COPYWRITER DR",           "focus": "Guiones de Video Ads"},
    "ugc":            {"agent": "DIRECTOR DE ARTE",        "focus": "UGC Realistas"},
    "producto":       {"agent": "EL INVESTIGADOR",         "focus": "Generador de Producto"},
    "upsells":        {"agent": "COPYWRITER DR",           "focus": "Upsells y AOV"},
    "email":          {"agent": "COPYWRITER DR",           "focus": "Email Marketing"},
    "lanzamiento":    {"agent": "ESTRATEGA DE LANZAMIENTO","focus": "Plan de Lanzamiento (Faceless/Cámara + Calendario 7 días)"},
}


# Common placeholders we fill from state.oferta + state-level fields.
# Order matters only in the sense that we want the most-specific keys to
# survive (so we apply defaults first, then overrides).
def _resolve_placeholders(state: dict) -> dict:
    """Map state -> {placeholder_token: value}. Missing -> sensible default."""
    oferta = (state.get("oferta") or {})
    investig = (state.get("investigacion") or {})
    avatares = (state.get("avatares") or {})

    pais = state.get("pais", "LATAM")
    moneda = state.get("moneda", "USD")
    precio = oferta.get("precio") or oferta.get("price") or "[definir]"
    nombre = oferta.get("nombre") or oferta.get("nombre_producto") or "[definir]"
    publico = oferta.get("publico") or avatares.get("publico") or "[definir]"
    nicho = oferta.get("nicho") or investig.get("nicho") or "[definir]"
    dolor = avatares.get("dolor") or investig.get("dolor") or "[definir]"
    mecanismo = oferta.get("mecanismo") or investig.get("mecanismo") or "[definir]"
    diferencial = oferta.get("diferencial") or "[definir]"

    return {
        "[NICHO]": str(nicho),
        "[NICHO A]": str(nicho),
        "[PAÍS]": str(pais),
        "[PRECIO]": str(precio),
        "[NOMBRE DEL PRODUCTO]": str(nombre),
        "[PRODUCTO]": str(nombre),
        "[AUDIENCIA TARGET]": str(publico),
        "[DOLOR]": str(dolor),
        "[MECANISMO]": str(mecanismo),
        "[COPY DEL HOOK]": oferta.get("hook") or "[definir]",
        "[PAIN/RESULT/MECHANISM]": "PAIN",
        "[9x16/1x1/3x4/CAROUSEL]": "9x16",
    }


def _fill_placeholders(prompt: str, mapping: dict) -> str:
    out = prompt
    for token, value in mapping.items():
        out = out.replace(token, value)
    return out


def _build_runtime_footer(step_id: str, state: dict, memory_context: dict) -> str:
    """
    Volatile user-context block that sits AFTER the (cacheable) Playbook
    prompt. Contains the per-request state — never put this in `system`
    or you destroy cache hits.
    """
    meta = STEP_META.get(step_id, {"agent": "AGENTE", "focus": step_id})
    pais = state.get("pais", "LATAM")
    moneda = state.get("moneda", "USD")
    modismo = state.get("modismo", "neutro latinoamericano")

    step_data = state.get(step_id, {}) or {}

    # Summarize previous step outputs so this step builds on them.
    previous_outputs = {}
    for sid in STEP_META.keys():
        if sid == step_id:
            continue
        out = (state.get(sid, {}) or {}).get("output")
        if out:
            previous_outputs[sid] = out[:600]

    return f"""═══════════════════════════════════════════════════════
CONTEXTO DEL PROYECTO (memoria compartida)
═══════════════════════════════════════════════════════
• Persona del agente: {meta['agent']}
• Foco del paso: {meta['focus']}
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

Generá ahora el output completo para esta sección, siguiendo la estructura
del prompt del Playbook que recibiste arriba. Cerrá siempre con KPIs/métricas
de éxito esperadas para {pais}."""


def _build_generic_prompt(step_id: str, state: dict, memory_context: dict) -> str:
    """Fallback when a step has no Playbook prompt mapped."""
    meta = STEP_META.get(step_id, {"agent": "AGENTE", "focus": step_id})
    pais = state.get("pais", "LATAM")
    return (
        f"Actuás como {meta['agent']} — el mejor en {meta['focus']} para "
        f"infoproductos en {pais}.\n\n"
        + _build_runtime_footer(step_id, state, memory_context)
    )


def _build_prompt(step_id: str, state: dict, memory_context: dict) -> tuple[str, str]:
    """
    Returns (system_text, user_text).

    system_text  -> stable Playbook prompt (cacheable). Empty string if
                    this step has no mapped prompt and we fall back.
    user_text    -> volatile per-request state (never cached).
    """
    base_prompt = STEP_TO_PROMPT.get(step_id)
    if base_prompt is None:
        # No Playbook prompt for this step — use the generic builder.
        return "", _build_generic_prompt(step_id, state, memory_context)

    placeholders = _resolve_placeholders(state)
    system_text = _fill_placeholders(base_prompt, placeholders)
    user_text = _build_runtime_footer(step_id, state, memory_context)
    return system_text, user_text


def run_infoproducto_step(
    db: Session,
    user_id: int,
    step_id: str,
    state: dict,
    api_key: Optional[str] = None,
    model: str = "claude-sonnet-4-6",
) -> str:
    """
    Run the infoproducto agent for a specific step.

    1. Reads shared memory for cross-step context.
    2. Builds the prompt for `step_id` using the Nivel Dios Playbook
       prompt + state + memory.
    3. Calls Claude with prompt caching (system = stable Playbook, user
       = volatile state).
    4. Saves the output to shared memory under key `infoproducto.{step_id}`
       and persists the full state under `infoproducto.state`.
    5. Returns the output text.

    Default model is Sonnet 4.6 — fast, ~5x cheaper than Opus, and its
    1024-token prompt-cache minimum is reachable by our Playbook prompts
    so caching actually delivers cost savings (~90% on repeated calls).
    """
    if step_id not in STEP_META:
        raise ValueError(f"Unknown infoproducto step: {step_id}")

    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    memory = SharedMemoryStore(db, user_id)
    memory_context = memory.get_full_context()

    system_text, user_text = _build_prompt(step_id, state, memory_context)

    client = anthropic.Anthropic(api_key=key)

    # Build kwargs so we only pass `system` when we actually have a
    # stable Playbook prompt to cache. Cache_control on the last system
    # block tells Anthropic to cache that prefix; subsequent calls with
    # the same Playbook prompt hit the cache (~90% cheaper).
    create_kwargs: dict[str, Any] = {
        "model": model,
        "max_tokens": 8192,
        "messages": [{"role": "user", "content": user_text}],
    }
    if system_text:
        create_kwargs["system"] = [
            {
                "type": "text",
                "text": system_text,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    message = client.messages.create(**create_kwargs)
    output = message.content[0].text

    # Cache hit telemetry (best-effort — usage shape can vary by SDK version).
    try:
        usage = getattr(message, "usage", None)
        if usage is not None:
            cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
            cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
            logger.info(
                f"[infoproducto_agent] cache step={step_id} "
                f"read={cache_read} write={cache_write}"
            )
    except Exception:
        pass

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
