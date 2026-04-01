import anthropic
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse


def audit_landing_page(url: str, negocio_info: str = "", api_key: str = "") -> str:
    """
    Audits a landing page for CRO (Conversion Rate Optimization) improvements.
    Fetches the landing page HTML and extracts key content for analysis.
    
    Args:
        url: Landing page URL to audit
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        CRO audit analysis with specific recommendations
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        # Fetch the landing page
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Extract key content
        title = soup.title.string if soup.title else "No title found"
        meta_description = ""
        if soup.find("meta", attrs={"name": "description"}):
            meta_description = soup.find("meta", attrs={"name": "description"}).get("content", "")
        
        # Extract all headings
        headings = {}
        for i, h in enumerate(soup.find_all(["h1", "h2", "h3"])):
            headings[f"heading_{i}"] = h.get_text(strip=True)
        
        # Extract CTA buttons
        cta_buttons = []
        for button in soup.find_all(["button", "a"], class_=lambda x: x and ("btn" in x.lower() or "cta" in x.lower())):
            cta_buttons.append(button.get_text(strip=True))
        
        # Count images
        images_count = len(soup.find_all("img"))
        
        # Extract text content (first 3000 chars)
        text_content = soup.get_text()
        text_content = " ".join(text_content.split())[:3000]
        
        # Extract price if visible
        price = "Not visible"
        text_lower = text_content.lower()
        if "$" in text_content:
            price = "Visible (price mentioned)"
        
        # Build extracted data
        extracted = {
            "URL": url,
            "Title": title,
            "Meta Description": meta_description if meta_description else "No meta description",
            "Headings": headings if headings else "No headings found",
            "CTA Buttons": cta_buttons if cta_buttons else "No CTAs found",
            "Images Count": images_count,
            "Price Info": price,
            "Text Sample": text_content
        }
        
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un Senior CRO / Conversion Rate Optimization Expert con 12+ años optimizando landing pages de alto valor en LATAM. 
Tu análisis combina UX, copywriting, psicología del consumidor y datos.{business_context}

LANDING PAGE AUDITADA:
{json.dumps(extracted, indent=2, ensure_ascii=False)}

Proporciona un audit CRO completo en 5 secciones:

1. **PRODUCTO DETECTADO** - ¿Qué están vendiendo? Precio si es visible, target audience inferido

2. **CRO AUDIT** - Evalúa con semáforos (🟢/🟡/🔴) cada sección:
   - Headlines (¿Son convincentes? ¿Tienen benefit claro?)
   - Copy (¿Habla de pain points? ¿Es específico?)
   - CTA (¿Claros? ¿Crean urgencia? ¿Son visibles?)
   - Manejo de Objeciones (¿Hay garantías? ¿Testimonios?)
   - Trust Signals (¿Muestra credibilidad? ¿Reviews?)
   - Visual Hierarchy (¿Es fácil navegar? ¿Dónde está el CTA?)

3. **TOP 3 FRICTION POINTS** - Los 3 mayores problemas matando conversiones con explicación clara

4. **PROPUESTAS DE CAMBIO** - Cambios específicos de copy/estructura a implementar. Para cada cambio:
   - QUÉ cambiar (sección específica)
   - CÓMO cambiar (texto propuesto)
   - POR QUÉ funciona (psicología/datos)

5. **CVR ESTIMADO antes/después** - Estimación de CVR actual vs CVR esperado tras cambios (ej: "1.2% → 2.8%")

Sé brutalmente honesto. Si la landing es mediocre, dilo. Si falta algo crítico, señálalo."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except requests.RequestException as e:
        return f"Error fetching landing page: {str(e)}"
    except Exception as e:
        return f"Error auditing landing page: {str(e)}"
