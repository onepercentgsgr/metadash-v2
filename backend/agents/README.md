# MetaDash AI Agent Suite

Complete AI agent system for the MetaDash SaaS platform. All agents are multi-tenant ready with per-user API key support.

## Files Created

### 1. `__init__.py`
Central module that exports all agent functions for easy importing.

### 2. `optimizer.py`
**Function:** `analyze_campaigns(campaigns_data, negocio_info, api_key)`

Media Buyer Senior agent that analyzes Meta Ads campaigns with automatic rule-based alerts:
- CPA > 2.5x → PAUSE alert
- Frequency > 3.5 → ROTATE alert
- CTR < 0.8% → WEAK HOOK alert
- CTR > 3% + 0 conversions → LANDING BROKEN alert
- ROAS > 2x → SCALE alert

Output: 5 sections (Executive Diagnosis, Critical Problems, Action Today, What to Scale, Next 7 Days)

### 3. `finance.py`
**Function:** `analyze_finances(financial_data, negocio_info, api_key)`

CFO/Director Financiero agent that pre-calculates MER, ROAS, gross profit metrics and provides financial health analysis.

Output: 5 sections (Dashboard semáforos, Break-even ROAS, Main Diagnosis, 3 Recommendations, 30-day Projection)

### 4. `script_gen.py`
**Function:** `generate_scripts(brief, negocio_info, api_key, num_scripts)`

Direct Response Copywriter that generates video/ad scripts with 3 different angles:
- Pain Point angle
- Aspirational angle
- Social Proof angle

Each script includes HOOK (first 3 seconds), DEVELOPMENT (seconds 4-20), CTA, and notes.

### 5. `advisor.py`
Two functions for strategic advice:

**`get_growth_strategy(business_data, negocio_info, api_key)`**
- Growth strategist that provides: Diagnosis, Actions prioritized by impact, Success metrics

**`get_cro_advice(funnel_data, negocio_info, api_key)`**
- CRO Expert that provides: Funnel Audit with semáforos, Top 3 Friction Points, Quick Wins, 3 A/B Hypotheses, CVR Impact Estimate

### 6. `creative_director.py`
**Function:** `analyze_creatives(creatives_data, negocio_info, api_key)`

Creative Director that analyzes performance of creative assets per Hook Rate, VTR, CTR, Frequency.

Output: 6 sections (Performance per Creative, Current Winner, Creatives to Pause, Fatigue Diagnosis, Next Testing Batch, Creative Brief)

### 7. `landing_auditor.py`
**Function:** `audit_landing_page(url, negocio_info, api_key)`

Senior CRO Expert that:
1. Fetches landing page HTML via requests + BeautifulSoup
2. Extracts: title, meta description, headings, CTA buttons, images, text content
3. Analyzes for CRO improvements

Output: 5 sections (Producto Detectado, CRO Audit with semáforos, Top 3 Friction Points, Propuestas de Cambio, CVR antes/después)

### 8. `orchestrator.py`
**Function:** `run_full_audit(campaigns_data, creatives_data, financial_data, landing_url, negocio_info, api_key)`

Master orchestrator that:
1. Calls landing_auditor if URL provided
2. Calls optimizer if campaigns_data provided
3. Calls creative_director if creatives_data provided
4. Calls finance if financial_data provided
5. Calls script_gen with insights from above
6. Synthesizes all reports as CEO with unified action plan

Output: 5 sections (Executive Summary, Priority Actions by Timeline, Budget Allocation, Risk Alerts, Growth Projection)

## Key Features

- **Multi-tenant Ready:** Every function accepts `api_key` parameter - creates its own Anthropic client
- **No Environment Variables:** Never reads from config/settings - fully isolated per tenant
- **Automatic Alerts:** optimizer.py includes rule-based alerts before Claude analysis
- **Pre-calculated Metrics:** finance.py pre-calculates MER, ROAS, gross profit
- **Error Handling:** All functions use try/except and return error messages gracefully
- **Business Context:** All agents support optional `negocio_info` parameter for business-specific context
- **Production Ready:** All files are complete, functional, and syntax-validated

## Model & Tokens

All agents use: `claude-haiku-4-5-20251001`

Token limits per agent:
- optimizer.py: 2000 tokens
- finance.py: 1500 tokens
- script_gen.py: 2000 tokens
- advisor.py: 1500 tokens each
- creative_director.py: 1800 tokens
- landing_auditor.py: 2500 tokens
- orchestrator.py: 2500 tokens (CEO synthesis)

## Usage Example

```python
from agents import run_full_audit

# Run complete audit
result = run_full_audit(
    campaigns_data=[...],
    creatives_data=[...],
    financial_data={...},
    landing_url="https://example.com/landing",
    negocio_info="E-commerce de camisetas con $10K/mes en ads",
    api_key="sk-ant-..."
)

print(result)
```

## Requirements

- anthropic
- requests
- beautifulsoup4

## Location

All files located in: `/sessions/vigilant-determined-pascal/mnt/Downloads/metadash/backend/agents/`
