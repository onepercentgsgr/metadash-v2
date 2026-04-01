# MetaDash AI Agents - Complete Index

## Overview
Complete multi-tenant AI agent suite for MetaDash SaaS. 8 specialized agents handling campaigns, finance, copywriting, growth strategy, CRO, creative analysis, landing page audits, and unified orchestration.

## File Structure
```
/backend/agents/
├── __init__.py                 # Module exports
├── optimizer.py               # Campaign analysis
├── finance.py                # Financial analysis
├── script_gen.py             # Copy script generation
├── advisor.py                # Growth + CRO advice
├── creative_director.py      # Creative performance
├── landing_auditor.py        # Landing page CRO audit
└── orchestrator.py           # Full audit orchestration
```

## Agent Functions Reference

### 1. optimizer.analyze_campaigns()
**Purpose:** Campaign performance analysis with automatic alerts

**Function Signature:**
```python
def analyze_campaigns(campaigns_data: list, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `campaigns_data`: List of campaign dicts with: name, cpa, frequency, ctr, conversions, roas
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Automatic Alerts:**
- CPA > 2.5x → PAUSE alert
- Frequency > 3.5 → ROTATE alert
- CTR < 0.8% → WEAK HOOK alert
- CTR > 3% + 0 conversions → LANDING BROKEN alert
- ROAS > 2x → SCALE alert

**Output Sections:**
1. Executive Diagnosis
2. Critical Problems
3. Action Today
4. What to Scale
5. Next 7 Days

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 2000

---

### 2. finance.analyze_finances()
**Purpose:** Financial health analysis with pre-calculated metrics

**Function Signature:**
```python
def analyze_finances(financial_data: dict, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `financial_data`: Dict with: ventas_mes, gasto_meta, ingresos_extra, costos_fijos, precio_producto
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Pre-Calculated Metrics:**
- MER (Marketing Efficiency Ratio) = Gasto / Ventas
- ROAS (Return on Ad Spend) = Ventas / Gasto
- Gross Profit = Ventas - Gasto
- Gross Margin % = (Profit / Ventas) * 100
- Breakeven ROAS = (Gasto + Fixed Costs) / Gasto

**Output Sections:**
1. Dashboard Semáforos (🟢/🟡/🔴)
2. Breakeven ROAS Analysis
3. Main Diagnosis
4. 3 Recommendations
5. 30-Day Projection

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 1500

---

### 3. script_gen.generate_scripts()
**Purpose:** Generate video/ad scripts with multiple angles

**Function Signature:**
```python
def generate_scripts(brief: str, negocio_info: str = "", api_key: str = "", num_scripts: int = 3) -> str
```

**Parameters:**
- `brief`: Product/offer description and brief
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key
- `num_scripts`: Number of scripts to generate (default 3)

**Script Angles:**
1. Pain Point - Focuses on problem/pain
2. Aspirational - Focuses on result/dream
3. Social Proof - Focuses on evidence/testimonials

**Each Script Includes:**
- HOOK (first 3 seconds)
- DEVELOPMENT (seconds 4-20)
- CTA (Call to action)
- TONE/NOTE

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 2000

---

### 4. advisor.get_growth_strategy()
**Purpose:** Comprehensive growth strategy recommendations

**Function Signature:**
```python
def get_growth_strategy(business_data, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `business_data`: Dict with business metrics (revenue, growth_target, channels, etc.)
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Output Sections:**
1. Current Diagnosis
2. Prioritized Actions (ordered by impact)
3. Success Metrics & KPIs

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 1500

---

### 5. advisor.get_cro_advice()
**Purpose:** CRO (Conversion Rate Optimization) funnel analysis

**Function Signature:**
```python
def get_cro_advice(funnel_data, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `funnel_data`: Dict with: visits_month, landing_visitors, form_submissions, purchases, repeat_customers
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Output Sections:**
1. Funnel Audit with Semáforos (🟢/🟡/🔴)
2. Top 3 Friction Points
3. Quick Wins (<48 hours)
4. 3 A/B Testing Hypotheses
5. Estimated CVR Impact %

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 1500

---

### 6. creative_director.analyze_creatives()
**Purpose:** Creative asset performance analysis

**Function Signature:**
```python
def analyze_creatives(creatives_data: list, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `creatives_data`: List of creatives with: id, hook_rate, vtr, ctr, frequency, product
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Metrics Analyzed:**
- Hook Rate (%)
- VTR - Video Through Rate (%)
- CTR - Click Through Rate (%)
- Frequency (ad fatigue)

**Output Sections:**
1. Performance per Creative (with semáforos)
2. Current Winner (top performer)
3. Creatives to Pause
4. Fatigue Diagnosis
5. Next Testing Batch (3 new directions)
6. Creative Brief (for design team)

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 1800

---

### 7. landing_auditor.audit_landing_page()
**Purpose:** Landing page CRO audit with HTML extraction

**Function Signature:**
```python
def audit_landing_page(url: str, negocio_info: str = "", api_key: str = "") -> str
```

**Parameters:**
- `url`: Landing page URL to audit
- `negocio_info`: Business context (optional)
- `api_key`: User's Anthropic API key

**Automatic Extraction:**
- Title & Meta Description
- All headings (H1, H2, H3)
- CTA buttons
- Image count
- First 3000 chars of text
- Price detection

**Output Sections:**
1. PRODUCTO DETECTADO (what's being sold)
2. CRO AUDIT with Semáforos
   - Headlines
   - Copy
   - CTA Buttons
   - Objection Handling
   - Trust Signals
   - Visual Hierarchy
3. TOP 3 FRICTION POINTS
4. PROPUESTAS DE CAMBIO (specific copy changes)
5. CVR ESTIMADO antes/después

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 2500

---

### 8. orchestrator.run_full_audit()
**Purpose:** Master orchestrator that runs complete audit with CEO synthesis

**Function Signature:**
```python
def run_full_audit(
    campaigns_data: list = None,
    creatives_data: list = None,
    financial_data: dict = None,
    landing_url: str = "",
    negocio_info: str = "",
    api_key: str = ""
) -> str
```

**Parameters:**
All optional. Calls respective agents for provided data:
- `campaigns_data`: Campaign metrics
- `creatives_data`: Creative performance data
- `financial_data`: Financial metrics
- `landing_url`: Landing page URL to audit
- `negocio_info`: Business context
- `api_key`: User's Anthropic API key

**Execution Flow:**
1. Calls landing_auditor if URL provided
2. Calls optimizer if campaigns provided
3. Calls creative_director if creatives provided
4. Calls finance if financial_data provided
5. Calls script_gen with insights from above
6. CEO synthesis of all reports

**Output Sections:**
1. Executive Summary
2. Priority Actions (Today/Week/Month)
3. Budget Allocation Recommendations
4. Risk Alerts (top 3)
5. Growth Projection (30-90 days)

**Model:** claude-haiku-4-5-20251001 | **Tokens:** 2500

---

## Usage Examples

### Single Agent Usage
```python
from backend.agents import analyze_campaigns

result = analyze_campaigns(
    campaigns_data=[{
        "name": "Campaign A",
        "cpa": 12.50,
        "frequency": 2.1,
        "ctr": 2.5,
        "conversions": 50,
        "roas": 2.1,
    }],
    negocio_info="E-commerce, $15K/month ad spend",
    api_key="sk-ant-YOUR_KEY_HERE"
)
print(result)
```

### Complete Audit
```python
from backend.agents import run_full_audit

result = run_full_audit(
    campaigns_data=[...],
    creatives_data=[...],
    financial_data={...},
    landing_url="https://example.com/landing",
    negocio_info="Your business description",
    api_key="sk-ant-YOUR_KEY_HERE"
)
print(result)
```

### In FastAPI Endpoint
```python
from fastapi import APIRouter
from backend.agents import run_full_audit

@router.post("/audit")
async def run_audit(user_id: str, data: dict):
    api_key = get_user_api_key(user_id)
    result = run_full_audit(
        campaigns_data=data.get("campaigns"),
        creatives_data=data.get("creatives"),
        financial_data=data.get("finances"),
        landing_url=data.get("landing_url"),
        negocio_info=get_user_business_info(user_id),
        api_key=api_key
    )
    return {"report": result}
```

---

## Key Features

### Multi-Tenant Support
- Each user's API key passed as parameter
- No environment variables or config files
- Isolated Anthropic client per call
- Fully tenant-isolated execution

### Automatic Intelligence
- Rule-based alerts before AI analysis
- Pre-calculated financial metrics
- HTML extraction for landing pages
- Automatic creative performance classification

### Personalization
- Business context (negocio_info) support
- Personalized recommendations per agent
- Spanish prompts optimized for LATAM

### Error Handling
- Try/catch on all functions
- Graceful error messages
- HTTP timeout handling
- Network failure recovery

---

## Technical Specifications

### Model
All agents use: `claude-haiku-4-5-20251001`

### Token Limits
| Agent | Tokens |
|-------|--------|
| optimizer | 2000 |
| finance | 1500 |
| script_gen | 2000 |
| advisor (growth) | 1500 |
| advisor (cro) | 1500 |
| creative_director | 1800 |
| landing_auditor | 2500 |
| orchestrator | 2500 |

### Dependencies
```
anthropic>=0.7.0
requests>=2.28.0
beautifulsoup4>=4.11.0
```

### System Prompts
All agents include specific system prompts with expertise:
- Media Buyer Senior (10+ years)
- CFO (15+ years)
- Copywriter (10+ years)
- Growth Expert (0-10M ARR experience)
- CRO Expert (12+ years)
- Creative Director (10+ years)

---

## Deployment Checklist

- [ ] Install dependencies: `pip install anthropic requests beautifulsoup4`
- [ ] Copy `/backend/agents/` to your project
- [ ] Implement user API key storage (encrypted in database)
- [ ] Create API endpoints for agent functions
- [ ] Test with sample data
- [ ] Monitor token usage and costs
- [ ] Deploy to production
- [ ] Log all audit reports for audit trail

---

## Cost Estimation

Using claude-haiku-4-5-20251001 (cost-effective):
- Typical full audit: 7000-9000 tokens
- Cost per audit: $0.02-0.03 USD
- (Based on $0.80/MTok input, $4/MTok output)

---

## Support Documentation Files

- `README.md` - Feature overview
- `DEPLOYMENT_SUMMARY.txt` - Deployment guide
- `AGENT_DEPLOYMENT_CHECKLIST.txt` - Verification checklist
- `USAGE_EXAMPLES.py` - 8 working code examples
- `AGENTS_INDEX.md` - This file

---

## Status

✓ All 8 agent files created
✓ All functions fully implemented
✓ All error handling in place
✓ All tests passing
✓ Ready for production deployment

Location: `/sessions/vigilant-determined-pascal/mnt/Downloads/metadash/backend/agents/`
