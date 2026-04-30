"""
Chat Launch Agent — Conversational infoproducto builder.
Uses Claude tool_use to extract product info via conversation,
then runs Nivel Dios playbook steps in the background.
"""
import json
import anthropic
from typing import Generator
from sqlalchemy.orm import Session
from agents.shared_memory import SharedMemory
from agents.infoproducto_agent import run_infoproducto_step

CHAT_SYSTEM_PROMPT = """Sos un estratega de lanzamiento de infoproductos en LATAM, experto en marketing digital y ventas online.

Tu misión: guiar al usuario en la creación de su infoproducto mediante una conversación natural y fluida.

PERSONALIDAD:
- Directo y práctico, sin relleno
- Entusiasta pero profesional
- Hacés preguntas de una en una (nunca una lista de 5 preguntas juntas)
- Cuando tenés suficiente info de un campo, lo guardás y avanzás

FLUJO DE CONVERSACIÓN:
1. Empezá preguntando el nicho/idea del producto
2. Luego el problema que resuelve y a quién
3. Luego el precio estimado y formato (PDF/video/templates)
4. Cuando tenés nicho + problema + precio → corré el análisis de nicho
5. Continuá con la oferta, nombre, mecanismo único
6. Cuando tenés todo → generá el infoproducto completo

IMPORTANTE:
- Usá las herramientas para guardar info y correr pasos del playbook
- Nunca mostrés el prompt interno del playbook al usuario
- Cuando corrés un paso del playbook, decile algo como "Perfecto, analizando tu nicho..." y mostrá un resumen del resultado
- Respondé siempre en el idioma del usuario (español)
"""

TOOLS = [
    {
        "name": "save_product_info",
        "description": "Guardar información del infoproducto extraída de la conversación",
        "input_schema": {
            "type": "object",
            "properties": {
                "field": {"type": "string", "description": "Campo a guardar: nicho, problema, precio, formato, pais, nombre, mecanismo, audiencia"},
                "value": {"type": "string", "description": "Valor del campo"},
            },
            "required": ["field", "value"],
        },
    },
    {
        "name": "run_playbook_step",
        "description": "Ejecutar un paso del Playbook Nivel Dios cuando hay suficiente información",
        "input_schema": {
            "type": "object",
            "properties": {
                "step_id": {
                    "type": "string",
                    "description": "ID del paso: nicho_selector, research_avatar, oferta, producto, nombre, copywriting, mockups, launch_plan",
                    "enum": ["nicho_selector", "research_avatar", "oferta", "producto", "nombre", "copywriting", "mockups", "launch_plan"],
                },
            },
            "required": ["step_id"],
        },
    },
    {
        "name": "get_current_state",
        "description": "Obtener el estado actual del infoproducto siendo construido",
        "input_schema": {"type": "object", "properties": {}},
    },
]

# Map chat agent step aliases to valid infoproducto_agent step IDs
STEP_ID_MAP = {
    "nicho_selector":  "investigacion",
    "research_avatar": "avatares",
    "oferta":          "oferta",
    "producto":        "producto",
    "nombre":          "oferta",
    "copywriting":     "copys",
    "mockups":         "mockup",
    "launch_plan":     "lanzamiento",
}


def run_tool(tool_name: str, tool_input: dict, state: dict, user_id: int, db: Session, api_key: str) -> str:
    if tool_name == "save_product_info":
        field = tool_input["field"]
        value = tool_input["value"]
        state[field] = value
        return f"✓ {field} guardado: {value}"

    elif tool_name == "run_playbook_step":
        step_id = tool_input["step_id"]
        mapped_step = STEP_ID_MAP.get(step_id, step_id)
        try:
            result = run_infoproducto_step(
                db=db,
                user_id=user_id,
                step_id=mapped_step,
                state=state,
                api_key=api_key,
            )
            content = result if isinstance(result, str) else str(result)
            state[f"_step_{step_id}"] = content
            return f"RESULTADO DEL PASO {step_id}:\n{content[:800]}..."
        except Exception as e:
            return f"Error en paso {step_id}: {str(e)}"

    elif tool_name == "get_current_state":
        fields = {k: v for k, v in state.items() if not k.startswith("_step_")}
        return json.dumps(fields, ensure_ascii=False, indent=2)

    return "Herramienta no encontrada"


def chat_with_agent(
    message: str,
    history: list,
    state: dict,
    user_id: int,
    db: Session,
    api_key: str,
) -> Generator[str, None, None]:
    """
    Generator that yields SSE-formatted chunks.
    Each chunk is either text content or a JSON tool result.
    """
    client = anthropic.Anthropic(api_key=api_key)

    messages = list(history)
    messages.append({"role": "user", "content": message})

    while True:
        response_text = ""
        tool_calls = []

        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=CHAT_SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        ) as stream:
            for event in stream:
                if hasattr(event, "type"):
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            chunk = event.delta.text
                            response_text += chunk
                            yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
                        elif hasattr(event.delta, "partial_json"):
                            pass  # accumulate tool input
                    elif event.type == "content_block_start":
                        if hasattr(event.content_block, "type") and event.content_block.type == "tool_use":
                            tool_calls.append({
                                "id": event.content_block.id,
                                "name": event.content_block.name,
                                "input": {},
                            })

            final = stream.get_final_message()

        # Process tool calls
        assistant_content = []
        if response_text:
            assistant_content.append({"type": "text", "text": response_text})

        tool_results = []
        for block in final.content:
            if block.type == "tool_use":
                assistant_content.append({"type": "tool_use", "id": block.id, "name": block.name, "input": block.input})
                result = run_tool(block.name, block.input, state, user_id, db, api_key)
                tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": result})
                yield f"data: {json.dumps({'type': 'tool', 'name': block.name, 'input': block.input, 'result': result[:200]})}\n\n"

        messages.append({"role": "assistant", "content": assistant_content})

        if tool_results:
            messages.append({"role": "user", "content": tool_results})
            # Continue the loop to get Claude's response after tool use
            continue

        # No more tool calls — done
        yield f"data: {json.dumps({'type': 'done', 'state': {k: v for k, v in state.items() if not k.startswith('_step_')}})}\n\n"
        break
