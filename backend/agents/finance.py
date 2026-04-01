import anthropic
import json


def analyze_finances(financial_data: dict, negocio_info: str = "", api_key: str = "") -> str:
    """
    Analyzes business finances with pre-calculated metrics.
    
    Args:
        financial_data: Dict with ventas_mes, gasto_meta, ingresos_extra, costos_fijos, precio_producto
        negocio_info: Optional business context
        api_key: Anthropic API key for this tenant
    
    Returns:
        Financial analysis string with 5 sections
    """
    if not api_key:
        return "Error: api_key is required"
    
    try:
        # Pre-calculate key metrics
        ventas_mes = financial_data.get("ventas_mes", 0)
        gasto_meta = financial_data.get("gasto_meta", 0)
        ingresos_extra = financial_data.get("ingresos_extra", 0)
        costos_fijos = financial_data.get("costos_fijos", 0)
        precio_producto = financial_data.get("precio_producto", 0)
        
        # Calculate MER (Marketing Efficiency Ratio)
        mer = gasto_meta / ventas_mes if ventas_mes > 0 else 0
        
        # Calculate ROAS (Return on Ad Spend)
        roas = ventas_mes / gasto_meta if gasto_meta > 0 else 0
        
        # Calculate gross profit
        gross_profit = ventas_mes - gasto_meta
        gross_margin = (gross_profit / ventas_mes * 100) if ventas_mes > 0 else 0
        
        # Break-even ROAS (considering fixed costs)
        total_spend = gasto_meta
        breakeven_roas = (total_spend + costos_fijos) / total_spend if total_spend > 0 else 0
        
        metrics_summary = {
            "MER": round(mer, 2),
            "ROAS": round(roas, 2),
            "Ventas Mes": f"${ventas_mes:,.0f}",
            "Gasto Meta": f"${gasto_meta:,.0f}",
            "Utilidad Bruta": f"${gross_profit:,.0f}",
            "Margen Bruto": f"{gross_margin:.1f}%",
            "Breakeven ROAS": round(breakeven_roas, 2),
            "Costos Fijos": f"${costos_fijos:,.0f}",
        }
        
        business_context = f"\nContext de negocio: {negocio_info}" if negocio_info else ""
        
        prompt = f"""Sos un CFO / Director Financiero con 15+ años en e-commerce y negocios digitales LATAM. 
Manejaste P&Ls de $1M a $50M ARR.{business_context}

DATOS FINANCIEROS Y MÉTRICAS CALCULADAS:
{json.dumps(financial_data, indent=2, ensure_ascii=False)}

MÉTRICAS AUTOMÁTICAS:
{json.dumps(metrics_summary, indent=2, ensure_ascii=False)}

Proporciona un análisis financiero en 5 secciones:

1. **DASHBOARD SEMÁFOROS** - Estado de: MER, ROAS, Margen Bruto, Breakeven (🟢/🟡/🔴)
2. **BREAKEVEN ROAS** - Cuál debería ser el ROAS mínimo y estado actual
3. **DIAGNÓSTICO PRINCIPAL** - Health check financiero del negocio
4. **3 RECOMENDACIONES** - Acciones para mejorar márgenes y rentabilidad
5. **PROYECCIÓN 30 DÍAS** - Forecast si se implementan cambios

Sé analítico, usa números reales y proporciona recomendaciones accionables."""
        
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return message.content[0].text
    
    except Exception as e:
        return f"Error analyzing finances: {str(e)}"
