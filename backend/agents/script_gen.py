import anthropic
import json


def generate_scripts(brief: str, negocio_info: str = "", api_key: str = "", num_scripts: int = 3) -> str:
    """
    Generates direct response copy scripts for Meta Ads with different angles.
    
    Args:
        brief: Copy brief or product description
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
        num_scripts: Number of scripts to generate (default 3)
    
    Returns:
        Generated scripts with different angles
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un Copywriter Direct Response Senior con 10+ años en Meta Ads para LATAM. 
Combinás Gary Halbert, Eugene Schwartz y David Ogilvy.{business_context}

BRIEF DE COPY:
{brief}

Necesito que generes {num_scripts} scripts de video/ad copy diferentes, cada uno con un ángulo distinto:
1. Ángulo PAIN POINT (enfocado en el problema/dolor)
2. Ángulo ASPIRACIONAL (enfocado en el resultado/sueño)
3. Ángulo SOCIAL PROOF (enfocado en evidencia/testimonios)

Para CADA SCRIPT, proporciona:

**ÁNGULO: [nombre del ángulo]**
- **HOOK (primeros 3 segundos):** [Máximo 2 líneas que detengan el scroll]
- **DEVELOPMENT (segundos 4-20):** [Argumento principal, transición, detalles de solución]
- **CTA (Llamada a Acción):** [Call to action específica y urgente]
- **TONO/NOTA:** [Breve nota sobre tono y por qué funciona este ángulo]

Asegúrate que:
- Los HOOKS sean provocadores y detengan el scroll
- El copy sea conversacional pero persuasivo
- Los CTAs sean claros y creen urgencia
- Cada script sea diferente en estructura y enfoque
- Todos sean optimizados para video/captions de Meta Ads

Genera los {num_scripts} scripts ahora:"""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error generating scripts: {str(e)}"
