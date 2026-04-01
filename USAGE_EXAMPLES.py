"""
MetaDash AI Agent Suite - Usage Examples
This file demonstrates how to use each agent in your application.
"""

from backend.agents import (
    analyze_campaigns,
    analyze_finances,
    generate_scripts,
    get_growth_strategy,
    get_cro_advice,
    analyze_creatives,
    audit_landing_page,
    run_full_audit,
)


# Example 1: Campaign Analysis
def example_campaign_analysis():
    """Analyze Meta Ads campaigns with automatic alerts"""
    
    campaigns = [
        {
            "name": "Winter Sale - Carousel",
            "cpa": 15.50,
            "frequency": 2.3,
            "ctr": 2.1,
            "conversions": 25,
            "roas": 1.8,
        },
        {
            "name": "Cold Traffic - Video",
            "cpa": 8.75,
            "frequency": 4.2,
            "ctr": 0.6,
            "conversions": 0,
            "roas": 0.9,
        },
    ]
    
    result = analyze_campaigns(
        campaigns_data=campaigns,
        negocio_info="E-commerce de ropa deportiva, $15K/mes en ads",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 2: Financial Analysis
def example_financial_analysis():
    """Analyze business finances with pre-calculated metrics"""
    
    financial_data = {
        "ventas_mes": 45000,
        "gasto_meta": 8500,
        "ingresos_extra": 2000,
        "costos_fijos": 12000,
        "precio_producto": 89,
    }
    
    result = analyze_finances(
        financial_data=financial_data,
        negocio_info="Productos digitales + físicos, margen bruto 65%",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 3: Script Generation
def example_script_generation():
    """Generate video scripts with multiple angles"""
    
    brief = """
    Producto: Curso online de copywriting directo (value $197)
    Precio: $47 (oferta limitada)
    Audience: Emprendedores de 25-45 años con negocio online
    Pain point: "No sé cómo escribir anuncios que venden"
    """
    
    result = generate_scripts(
        brief=brief,
        negocio_info="Infoproductos en LATAM",
        api_key="sk-ant-YOUR_API_KEY_HERE",
        num_scripts=3,
    )
    print(result)


# Example 4: Growth Strategy
def example_growth_strategy():
    """Get comprehensive growth strategy recommendations"""
    
    business_data = {
        "monthly_revenue": 25000,
        "growth_target_6m": 100000,
        "current_channels": ["Meta Ads", "Google", "Email"],
        "team_size": 3,
        "budget": 5000,
    }
    
    result = get_growth_strategy(
        business_data=business_data,
        negocio_info="SaaS B2B en LATAM, tasa de churn 3%",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 5: CRO Advice
def example_cro_advice():
    """Get CRO analysis of your funnel"""
    
    funnel_data = {
        "visits_month": 15000,
        "landing_visitors": 12000,
        "form_submissions": 1800,
        "purchases": 360,
        "repeat_customers": 45,
    }
    
    result = get_cro_advice(
        funnel_data=funnel_data,
        negocio_info="E-commerce de software",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 6: Creative Analysis
def example_creative_analysis():
    """Analyze creative asset performance"""
    
    creatives = [
        {
            "id": "creative_001",
            "hook_rate": 42,
            "vtr": 68,
            "ctr": 3.2,
            "frequency": 2.1,
            "product": "Video testimonial",
        },
        {
            "id": "creative_002",
            "hook_rate": 28,
            "vtr": 45,
            "ctr": 1.8,
            "frequency": 3.5,
            "product": "Carousel ads",
        },
        {
            "id": "creative_003",
            "hook_rate": 15,
            "vtr": 22,
            "ctr": 0.6,
            "frequency": 2.8,
            "product": "Static image",
        },
    ]
    
    result = analyze_creatives(
        creatives_data=creatives,
        negocio_info="Consultora de marketing digital",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 7: Landing Page Audit
def example_landing_audit():
    """Audit a landing page for CRO improvements"""
    
    result = audit_landing_page(
        url="https://example.com/landing",
        negocio_info="Venta de cursos online con garantía 30 días",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Example 8: Full Audit (Complete Analysis)
def example_full_audit():
    """Run a complete audit with all agents and CEO synthesis"""
    
    campaigns = [
        {
            "name": "Campaign A",
            "cpa": 12.50,
            "frequency": 2.1,
            "ctr": 2.5,
            "conversions": 50,
            "roas": 2.1,
        },
    ]
    
    creatives = [
        {
            "id": "creative_001",
            "hook_rate": 50,
            "vtr": 75,
            "ctr": 3.5,
            "frequency": 2.0,
        },
    ]
    
    financial_data = {
        "ventas_mes": 55000,
        "gasto_meta": 12000,
        "ingresos_extra": 3000,
        "costos_fijos": 15000,
        "precio_producto": 99,
    }
    
    result = run_full_audit(
        campaigns_data=campaigns,
        creatives_data=creatives,
        financial_data=financial_data,
        landing_url="https://example.com/landing",
        negocio_info="E-commerce BootCamp online, $50K ARR target",
        api_key="sk-ant-YOUR_API_KEY_HERE",
    )
    print(result)


# Usage in FastAPI/Flask
def example_api_integration():
    """
    Example of how to integrate agents in a FastAPI endpoint
    """
    
    """
    # FastAPI example:
    from fastapi import APIRouter, Depends
    from sqlalchemy.orm import Session
    
    from backend.agents import analyze_campaigns
    from backend.database import get_db
    from backend.models import User
    
    router = APIRouter()
    
    @router.post("/audit/campaigns")
    async def audit_campaigns(
        campaign_data: dict,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Get user's Anthropic API key from database
        api_key = user.anthropic_api_key
        
        # Run analysis with user's API key
        result = analyze_campaigns(
            campaigns_data=campaign_data["campaigns"],
            negocio_info=user.business_info,
            api_key=api_key,
        )
        
        # Save result to database
        audit = Audit(user_id=user.id, report=result)
        db.add(audit)
        db.commit()
        
        return {"report": result}
    """


if __name__ == "__main__":
    print("MetaDash AI Agent Examples")
    print("===========================")
    print()
    print("Uncomment examples below to test:")
    print()
    print("1. example_campaign_analysis()")
    print("2. example_financial_analysis()")
    print("3. example_script_generation()")
    print("4. example_growth_strategy()")
    print("5. example_cro_advice()")
    print("6. example_creative_analysis()")
    print("7. example_landing_audit()")
    print("8. example_full_audit()")
    print()
    print("Make sure to replace 'YOUR_API_KEY_HERE' with actual Anthropic API keys")
