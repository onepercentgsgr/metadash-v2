"""
Pipeline Orchestrator — runs the full Nivel Dios infoproducto pipeline
across all 16 steps with smart parallelization and SSE streaming.

DAG of dependencies (waves run sequentially, steps within a wave run in parallel):
  Wave 1: oferta → investigacion → avatares  (sequential foundation)
  Wave 2: brand, producto                    (parallel)
  Wave 3: mockup, ads, copys                 (parallel)
  Wave 4: bonus_mockups, bundle, landing, guiones  (parallel)
  Wave 5: ugc, upsells, email                (parallel)
  Wave 6: lanzamiento                        (final synthesis, consumes all prior)

Each step writes to SharedMemoryStore so downstream agents see it.
SSE events: pipeline.start, step.start, step.delta, step.complete, step.error,
            wave.start, wave.complete, pipeline.done, pipeline.error.
"""

import json
import logging
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from queue import Queue
from typing import Generator, Any, Optional

from sqlalchemy.orm import Session

from agents.infoproducto_agent import run_infoproducto_step, STEP_META
from agents.shared_memory import SharedMemoryStore

logger = logging.getLogger(__name__)


# Wave topology — within a wave, steps run in parallel.
PIPELINE_WAVES: list[list[str]] = [
    ["oferta"],                                   # Wave 1: foundation
    ["investigacion"],                             # Wave 2: research depth
    ["avatares"],                                  # Wave 3: avatars
    ["brand", "producto"],                         # Wave 4: identity + product
    ["mockup", "ads", "copys"],                    # Wave 5: visuals + copy
    ["bonus_mockups", "bundle", "landing", "guiones"],  # Wave 6: content layer
    ["ugc", "upsells", "email"],                   # Wave 7: monetization
    ["lanzamiento"],                               # Wave 8: final launch plan
]


def _flatten_steps() -> list[str]:
    return [s for wave in PIPELINE_WAVES for s in wave]


def run_pipeline_streaming(
    db: Session,
    user_id: int,
    state: dict,
    api_key: str,
    run_id: Optional[str] = None,
) -> Generator[str, None, None]:
    """
    Generator yielding SSE-formatted events as the pipeline progresses.
    Steps within the same wave run in parallel via ThreadPoolExecutor.
    Outputs are accumulated in `state` and persisted to shared memory.
    """
    run_id = run_id or str(uuid.uuid4())
    all_steps = _flatten_steps()

    yield _sse({
        "type": "pipeline.start",
        "run_id": run_id,
        "total_steps": len(all_steps),
        "waves": [
            [{"step_id": s, "agent": STEP_META.get(s, {}).get("agent", "AGENTE"),
              "focus": STEP_META.get(s, {}).get("focus", s)} for s in wave]
            for wave in PIPELINE_WAVES
        ],
    })

    deliverables: dict[str, str] = {}
    started_at = time.time()

    try:
        for wave_idx, wave in enumerate(PIPELINE_WAVES):
            yield _sse({
                "type": "wave.start",
                "wave": wave_idx + 1,
                "steps": wave,
            })

            # Execute all steps in this wave in parallel
            results = _run_wave_parallel(
                wave=wave,
                db=db,
                user_id=user_id,
                state=state,
                api_key=api_key,
            )

            # Drain the queue and forward events as they happen
            for event in results:
                yield _sse(event)
                # Capture completed outputs into state + deliverables
                if event.get("type") == "step.complete":
                    sid = event["step_id"]
                    out = event.get("output", "")
                    deliverables[sid] = out
                    state[sid] = {**(state.get(sid) or {}), "output": out}

            yield _sse({
                "type": "wave.complete",
                "wave": wave_idx + 1,
            })

        # Final: persist deliverables under the run_id for ZIP bundling
        memory = SharedMemoryStore(db, user_id)
        memory.write(
            f"pipeline_run.{run_id}",
            {
                "deliverables": deliverables,
                "state": {k: v for k, v in state.items() if not k.startswith("_")},
                "completed_at": time.time(),
                "duration_seconds": time.time() - started_at,
            },
            agent="pipeline_orchestrator",
            memory_type="pipeline_run",
        )

        yield _sse({
            "type": "pipeline.done",
            "run_id": run_id,
            "duration_seconds": round(time.time() - started_at, 1),
            "steps_completed": len(deliverables),
        })

    except Exception as e:
        logger.exception(f"[pipeline] fatal error in run {run_id}: {e}")
        yield _sse({
            "type": "pipeline.error",
            "run_id": run_id,
            "error": str(e),
        })


def _run_wave_parallel(
    wave: list[str],
    db: Session,
    user_id: int,
    state: dict,
    api_key: str,
) -> list[dict]:
    """
    Run all steps in a wave in parallel. Returns a list of events
    (step.start + step.complete OR step.error) in the order they completed.
    Each thread runs its own step against a fresh state snapshot.
    """
    events: list[dict] = []

    # If wave is single-step, just run inline (avoid threadpool overhead)
    if len(wave) == 1:
        sid = wave[0]
        events.append({"type": "step.start", "step_id": sid,
                       "agent": STEP_META.get(sid, {}).get("agent", "AGENTE"),
                       "focus": STEP_META.get(sid, {}).get("focus", sid)})
        try:
            output, duration, review = _run_single_step_safe(sid, db, user_id, state, api_key)
            events.append({
                "type": "step.complete",
                "step_id": sid,
                "output": output,
                "duration_seconds": duration,
                "critic_score": review.get("score"),
                "critic_regenerated": review.get("regenerated", False),
            })
        except Exception as e:
            logger.exception(f"[pipeline] step {sid} failed: {e}")
            events.append({
                "type": "step.error",
                "step_id": sid,
                "error": str(e),
            })
        return events

    # Multi-step wave: use a thread pool
    with ThreadPoolExecutor(max_workers=len(wave)) as executor:
        # Emit all step.start events first so the UI shows them activating
        for sid in wave:
            events.append({
                "type": "step.start",
                "step_id": sid,
                "agent": STEP_META.get(sid, {}).get("agent", "AGENTE"),
                "focus": STEP_META.get(sid, {}).get("focus", sid),
            })

        future_to_step = {
            executor.submit(_run_single_step_safe, sid, db, user_id, state, api_key, True): sid
            for sid in wave
        }

        for future in as_completed(future_to_step):
            sid = future_to_step[future]
            try:
                output, duration, review = future.result()
                events.append({
                    "type": "step.complete",
                    "step_id": sid,
                    "output": output,
                    "duration_seconds": duration,
                    "critic_score": review.get("score"),
                    "critic_regenerated": review.get("regenerated", False),
                })
            except Exception as e:
                logger.exception(f"[pipeline] step {sid} failed: {e}")
                events.append({
                    "type": "step.error",
                    "step_id": sid,
                    "error": str(e),
                })

    return events


def _run_single_step_safe(
    step_id: str,
    db: Session,  # Used for inline (single-thread) calls; threads create their own
    user_id: int,
    state: dict,
    api_key: str,
    use_own_session: bool = False,
) -> tuple[str, float, dict]:
    """
    Execute a single step and return (output, duration_seconds, critic_review).

    SQLAlchemy sessions are NOT thread-safe. When called from a worker thread
    (use_own_session=True), this creates and closes its own session for safety.
    Also deepcopies the state dict to avoid cross-thread reads of an evolving dict.
    """
    from agents.critic_agent import review_output, regenerate_with_feedback
    import copy as _copy

    own_db = None
    if use_own_session:
        from database import SessionLocal
        own_db = SessionLocal()
        active_db = own_db
    else:
        active_db = db

    try:
        t0 = time.time()
        local_state = _copy.deepcopy(state)

        output = run_infoproducto_step(
            db=active_db, user_id=user_id, step_id=step_id,
            state=local_state, api_key=api_key,
        )

        # Critic review
        focus = STEP_META.get(step_id, {}).get("focus", step_id)
        oferta = local_state.get("oferta") or {}
        product_context = (oferta.get("output", "") or "")[:500] or json.dumps(oferta, ensure_ascii=False)[:500]
        review = review_output(step_id, focus, output, api_key, product_context)

        # If quality is low, regenerate ONCE with feedback
        if review.get("score", 7) < 7 and review.get("feedback_for_regen"):
            logger.info(f"[critic] step {step_id} scored {review['score']}, regenerating with feedback")
            try:
                output = regenerate_with_feedback(
                    active_db, user_id, step_id, local_state,
                    review["feedback_for_regen"], api_key,
                )
                review["regenerated"] = True
            except Exception as e:
                logger.warning(f"[critic] regen failed for {step_id}: {e}")

        return output, round(time.time() - t0, 1), review
    finally:
        if own_db is not None:
            try:
                own_db.close()
            except Exception:
                pass


def _sse(event: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


# ───────────────────────────── Bundle ZIP ─────────────────────────────

DELIVERABLE_FILENAMES: dict[str, str] = {
    "oferta":         "00-modelado-oferta.md",
    "investigacion":  "01-investigacion-mercado.md",
    "avatares":       "02-avatares-y-angulos.md",
    "brand":          "03-identidad-visual.md",
    "mockup":         "04-mockup-principal.md",
    "ads":            "05-prompts-de-ads.md",
    "bonus_mockups":  "05.1-bonus-mockups.md",
    "bundle":         "05.2-bundle-completo.md",
    "landing":        "06-landing-page.md",
    "copys":          "07-copys-meta-tiktok.md",
    "guiones":        "08-guiones-video-ads.md",
    "ugc":            "09-ugc-realistas.md",
    "producto":       "10-producto-completo.md",
    "upsells":        "11-upsells-aov.md",
    "email":          "12-email-marketing.md",
    "lanzamiento":    "13-plan-lanzamiento.md",
}


def build_bundle_zip(deliverables: dict[str, str], state: dict) -> bytes:
    """Build a ZIP file in memory with all deliverables + INDEX.md."""
    import io
    import zipfile

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        index_lines = ["# 📦 Tu Infoproducto Completo — Nivel Dios", ""]
        product_name = (state.get("oferta") or {}).get("nombre") or state.get("nombre") or "Tu Infoproducto"
        index_lines.append(f"**Producto:** {product_name}")
        index_lines.append(f"**Generado:** {time.strftime('%Y-%m-%d %H:%M')}")
        index_lines.append("")
        index_lines.append("---")
        index_lines.append("")
        index_lines.append("## 📋 Cómo usar cada archivo")
        index_lines.append("")

        usage_hints = {
            "oferta":         "Tu modelo de oferta. Pegalo en tu deck o como referencia interna.",
            "investigacion":  "Análisis de mercado. Útil para tu landing y tu pitch a inversores.",
            "avatares":       "Avatares + ángulos. La materia prima de tu copy y segmentación de ads.",
            "brand":          "Identidad visual. Pasásela a tu diseñador o usá las paletas en Canva.",
            "mockup":         "Prompt para Midjourney/Ideogram. Pegá en su prompt y generá tu mockup.",
            "ads":            "29 prompts para imágenes de ads. Generá en Midjourney/Flux y subí a Meta/TikTok.",
            "bonus_mockups":  "Prompts adicionales para los bonus.",
            "bundle":         "Layout del bundle completo (producto + bonuses).",
            "landing":        "Estructura de landing page. Construila en Hotmart/Kajabi/Webflow.",
            "copys":          "Copys listos para Meta y TikTok. Pegá en el Ads Manager.",
            "guiones":        "Guiones de 15s, 30s y 60s. Grabá o pasá a tu editor.",
            "ugc":            "Briefs de UGC. Pasáselos a tu creator o generá con HeyGen.",
            "producto":       "Outline completo del producto. Esto es tu PDF/curso para vender.",
            "upsells":        "Estrategia de upsells y AOV. Configurá en tu plataforma.",
            "email":          "Secuencia de emails. Cargá en Mailchimp/ActiveCampaign.",
            "lanzamiento":    "Plan de 7 videos + calendario. Tu hoja de ruta para lanzar.",
        }

        for sid, filename in DELIVERABLE_FILENAMES.items():
            if sid in deliverables:
                index_lines.append(f"- **`{filename}`** — {usage_hints.get(sid, '')}")

        index_lines.append("")
        index_lines.append("---")
        index_lines.append("")
        index_lines.append("## 🚀 Próximos pasos sugeridos")
        index_lines.append("")
        index_lines.append("1. Generá tus mockups con los prompts de `04-mockup-principal.md` en Midjourney/Ideogram")
        index_lines.append("2. Subí los copys de `07-copys-meta-tiktok.md` al Ads Manager")
        index_lines.append("3. Construí la landing siguiendo `06-landing-page.md`")
        index_lines.append("4. Programá la secuencia de emails de `12-email-marketing.md`")
        index_lines.append("5. Seguí el calendario de `13-plan-lanzamiento.md` día a día")
        index_lines.append("")
        index_lines.append("_Generado por MetaDash — Nivel Dios._")

        zf.writestr("INDEX.md", "\n".join(index_lines))

        # Write each deliverable
        for sid, output in deliverables.items():
            filename = DELIVERABLE_FILENAMES.get(sid, f"{sid}.md")
            agent = STEP_META.get(sid, {}).get("agent", "AGENTE")
            focus = STEP_META.get(sid, {}).get("focus", sid)
            content = f"# {focus}\n\n_Generado por: {agent}_\n\n---\n\n{output}\n"
            zf.writestr(filename, content)

    return buf.getvalue()
