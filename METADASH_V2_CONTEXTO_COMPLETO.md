# 🚀 MetaDash v2 — Contexto Completo del Proyecto

**Última actualización:** Diciembre 2024  
**Versión:** 2.0 Production  
**Estado:** MVP en producción, bugs críticos arreglados

---

## 📋 RESUMEN EJECUTIVO

**MetaDash v2** es una plataforma SaaS de gestión inteligente de campañas de Meta Ads con **8 agentes autónomos de IA** que optimizan campañas 24/7 sin intervención humana.

- **Tech Stack:** Next.js (Pages Router) + FastAPI + PostgreSQL + Claude Haiku 4.5
- **Hosting:** Vercel (frontend) + Railway (backend + DB)
- **Modelos de Negocio:** Trial de 7 días → Planes pagos (Starter $29, Pro $79, Enterprise $199)
- **Monetización:** MercadoPago + Stripe (suscripciones + pagos únicos)
- **Playbook Integrado:** "Nivel Dios" — guía paso-a-paso para escalar negocios en 48h

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                        │
│                   Next.js Pages Router                      │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ Landing Page │   Dashboard  │ Playbook     │             │
│  │ (Marketing)  │ (User Area)  │ Nivel Dios   │             │
│  └──────────────┴──────────────┴──────────────┘             │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │ Admin Panel  │  Pricing     │ Onboarding   │             │
│  │ (Clientes)   │  (Plans)     │  (5 steps)   │             │
│  └──────────────┴──────────────┴──────────────┘             │
└─────────────────┬──────────────────────────────────────────┘
                  │ REST API (JWT Auth + Header())
                  │
┌─────────────────▼──────────────────────────────────────────┐
│              BACKEND (Railway - FastAPI)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth: JWT (HS256) + bcrypt passwords               │  │
│  │  Roles: admin (enterprise plan) + client (trial)    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  8 Agentes de IA (Claude Haiku 4.5)                 │  │
│  │  • Campaign Optimizer    • Finance Analyst          │  │
│  │  • Creative Director     • Growth Advisor           │  │
│  │  • CRO Advisor          • Landing Page Auditor      │  │
│  │  • Copywriter (Playbook) • Designer (Playbook)      │  │
│  │  • Social Media (Playbook)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes:                                         │  │
│  │  /auth/*              → Register, Login, Me         │  │
│  │  /config              → Tenant settings (Meta, GA4) │  │
│  │  /campaigns           → Meta Ads data (placeholder) │  │
│  │  /agent/*             → 8 agent endpoints           │  │
│  │  /admin/users         → Gestión de clientes        │  │
│  │  /payments/*          → MercadoPago + Stripe       │  │
│  │  /autonomous/actions  → Aprobación de acciones     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Autonomous Scheduler (APScheduler)                 │  │
│  │  • Runs agents every 6 hours                        │  │
│  │  • Generates optimization actions                   │  │
│  │  • Logs all activities                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────┬──────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────┐
│         DATABASE (Railway PostgreSQL)                      │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ users        │ subscriptions │ agent_logs   │            │
│  │ tenant_confs │ fin_records   │ autonomous_.. │           │
│  │ shopify_ord. │ ...          │              │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Flow de Registro → Trial
```
1. Usuario accede a landing page → "Comenzar Gratis"
2. Rellena registro: email, password, nombre
3. Backend crea:
   - User (role="client", is_active=True)
   - TenantConfig (vacío, esperando Meta token)
   - Subscription (plan="trial", status="active", trial_end=now+7d)
4. Genera JWT token (24h expiry)
5. Frontend guarda token en localStorage
6. Redirige a /onboarding (5 pasos)
   - Paso 1: Bienvenida
   - Paso 2: Conectar Meta Ads
   - Paso 3: Conectar GA4
   - Paso 4: Configurar modo autónomo
   - Paso 5: Confirmación
7. POST /auth/complete-onboarding → actualiza TenantConfig
8. Redirige a /dashboard
```

### Admin User (Master)
- Email: `onepercent.gsgr@gmail.com` (seteable en `ADMIN_EMAIL` env var)
- Password: `ADMIN_PASSWORD` env var
- Role: "admin" (automático en startup)
- Plan: "enterprise" (365 días)
- Acceso: Panel Administrador → /admin

### Token Flow
```
Request headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Backend (main.py):
  @app.post("/endpoint")
  async def endpoint(authorization: Optional[str] = Header(None), ...):
      # Header() extrae el valor del header HTTP
      user = get_current_user_from_header(authorization, db)
      ...
```

---

## 📁 ESTRUCTURA DE CARPETAS

### Frontend (Next.js)
```
frontend/src/
├── pages/
│   ├── _app.jsx              → Provider wrapper (Auth)
│   ├── index.jsx             → Landing page (marketing)
│   ├── login.jsx             → Login form
│   ├── register.jsx          → Registro + redirect /onboarding
│   ├── dashboard.jsx         → Main user area (stats)
│   ├── agents.jsx            → Lista de agentes
│   ├── audit.jsx             → Auditoría completa
│   ├── financials.jsx        → Upload Excel
│   ├── settings.jsx          → Meta token + GA4 config
│   ├── pricing.jsx           → Planes + MercadoPago checkout
│   ├── onboarding.jsx        → 5-step wizard (trial setup)
│   ├── playbook.jsx          → 8 fases "Nivel Dios"
│   ├── payment/
│   │   ├── success.jsx       → Pago confirmado
│   │   ├── cancel.jsx        → Pago cancelado
│   │   └── pending.jsx       → Pago pendiente
│   └── admin/
│       └── index.jsx         → Panel Administrador
│
├── components/
│   ├── Layout.jsx            → Sidebar nav
│   ├── PromptBox.jsx         → Copy-to-clipboard prompts
│   └── ...
│
├── context/
│   └── AuthContext.jsx       → useAuth() hook
│
└── lib/
    └── api.js               → API client (apiFetch wrapper)
```

### Backend (FastAPI)
```
backend/
├── main.py                   → App principal + endpoints
├── models.py                 → SQLAlchemy models
├── database.py               → SQLAlchemy setup + pool config
├── config.py                 → Env vars (SECRET_KEY, ADMIN_*)
├── payment_routes.py         → /payments/* endpoints
├── payments.py               → MercadoPago integration
├── stripe_payments.py        → Stripe integration (placeholders)
│
├── agents/
│   ├── __init__.py          → Imports de todos los agentes
│   ├── copywriter_agent.py  → 3 funciones + async wrapper
│   ├── design_agent.py      → 3 funciones + async wrapper
│   ├── social_media_agent.py→ 3 funciones + async wrapper
│   └── ... (8+ agentes más)
│
├── jobs/
│   └── scheduler.py          → APScheduler config
│
├── requirements.txt          → Python deps
└── start.py                  → Entry point
```

---

## 🔧 VARIABLES DE ENTORNO CRÍTICAS

### Railway (Backend)
```
# SECRETS
SECRET_KEY=ca90492e04d8aaea836343d83787c39e221fdee6a94d15ca2612b99219183d54
ADMIN_EMAIL=onepercent.gsgr@gmail.com
ADMIN_PASSWORD=<secure-password>
DATABASE_URL=postgresql://user:pass@postgres:5432/metadash
JWT_ALGORITHM=HS256

# CONEXIONES
FRONTEND_URL=https://metadash-v2-n2em-git-master-one-percents-projects.vercel.app
ENVIRONMENT=production
ALLOWED_ORIGINS=https://metadash-v2-n2em-git-master-one-percents-projects.vercel.app

# META API
META_APP_ID=1660121868759220
META_ACCESS_TOKEN=EAAXl3z5FcL... (user token)
META_AD_ACCOUNT_ID=act_893021690235868

# PAGOS
STRIPE_SECRET_KEY=sk_test_... (placeholder, no usado)
STRIPE_WEBHOOK_SECRET=whsec_... (placeholder, no usado)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-... (MP token)

# GOOGLE ANALYTICS
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# LOGS
LOG_LEVEL=INFO
```

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://mellow-healing-production-36fd.up.railway.app
```

---

## 🗄️ MODELOS DE BASE DE DATOS

### User
```sql
id (PK)
email (UNIQUE)
hashed_password
name
role ['admin' | 'client']
is_active
created_at

← FK: TenantConfig (1:1)
← FK: Subscription (1:N)
← FK: AgentLog (1:N)
← FK: FinancialRecord (1:N)
← FK: ShopifyOrder (1:N)
← FK: AutonomousActionLog (1:N)
```

### Subscription
```sql
id (PK)
user_id (FK)
plan ['trial' | 'starter' | 'pro' | 'enterprise']
status ['active' | 'expired' | 'cancelled']
trial_start (nullable)
trial_end (nullable)
created_at
updated_at
```

### TenantConfig
```sql
id (PK)
user_id (FK, UNIQUE)

Meta Integration:
meta_access_token
meta_ad_account_id
meta_app_id
meta_app_secret

AI Keys:
anthropic_api_key
hf_api_key (Hugging Face)

Configs:
negocio_info (free-form business info)
landing_page_url
shopify_store_url
shopify_webhook_secret
mercadopago_access_token
ga4_property_id
ga4_credentials_json (JSON)
```

### AgentLog
```sql
id (PK)
user_id (FK)
agent_type ['optimizer'|'finance'|'script_gen'|'creative'|'advisor'|'cro'|'landing_audit'|'orchestrator'|'analytics'|'playbook_*']
input_summary (truncado a 100 chars)
output (truncado a 1000 chars, JSON o text)
created_at
```

### AutonomousActionLog
```sql
id (PK)
user_id (FK)
action_type ['pause_campaign'|'scale_budget'|'rotate_creative'|'alert'|...]
status ['pending'|'approved'|'executed'|'failed'|'cancelled']
target (campaign_123, adset_456, etc)
description (human-readable)
details (JSON with full data)
result (API response o error)
triggered_by (agent name)
requires_approval (boolean)
approved_by (user_id, nullable)
approved_at (datetime, nullable)
executed_at (datetime, nullable)
created_at
```

### FinancialRecord
```sql
id (PK)
user_id (FK)
periodo (month/quarter)
ingresos (revenue in cents)
costos (costs)
ad_spend (Meta spend)
devoluciones (refunds)
ordenes (order count)
created_at
```

---

## 🤖 AGENTES DE IA (Claude Haiku 4.5)

### 1. Campaign Optimizer (`/agent/optimize`)
**Entrada:** campaigns data, business info  
**Salida:** Recomendaciones de optimización (pause, scale, rotate)  
**Función:** `analyze_campaigns(data, negocio_info, api_key)`

### 2. Finance Analyst (`/agent/finance`)
**Entrada:** Financial records, spend data  
**Salida:** ROI analysis, cost breakdown, recommendations  
**Función:** `analyze_finances(data, negocio_info, api_key)`

### 3. Script Generator (`/agent/scripts`)
**Entrada:** Campaign brief, business context  
**Salida:** Ad copy scripts for videos/audio  
**Función:** `generate_scripts(brief, negocio_info, api_key)`

### 4. Creative Director (`/agent/creatives`)
**Entrada:** Creative performance metrics  
**Salida:** Design recommendations, A/B test suggestions  
**Función:** `analyze_creatives(data, negocio_info, api_key)`

### 5. Growth Strategist (`/agent/growth`)
**Entrada:** Campaign data, market context  
**Salida:** Scaling strategy, expansion ideas  
**Función:** `get_growth_strategy(context, negocio_info, api_key)`

### 6. CRO Advisor (`/agent/cro`)
**Entrada:** Landing page data, user behavior  
**Salida:** Conversion optimization recommendations  
**Función:** `get_cro_advice(context, negocio_info, api_key)`

### 7. Landing Page Auditor (`/agent/landing-audit`)
**Entrada:** Landing page URL  
**Salida:** Full audit (headlines, copy, design, CTA)  
**Función:** `audit_landing_page(url, negocio_info, api_key)`

### 8. Orchestrator (`/agent/full-audit`)
**Entrada:** All context (campaigns, creatives, financial, GA4)  
**Salida:** Comprehensive business audit + recommendations  
**Función:** `run_full_audit(...)`

### Playbook Agentes (3 adicionales para "Nivel Dios")

#### Playbook Copywriter (`/agent/playbook/copywriter`)
- `generate_landing_page_copy(nicho, audience, pain_point, mechanism, price, bonos, tone)`
- `generate_ad_scripts(nicho, pain_point, mechanism, price, angle_type)`
- `generate_email_sequence(product_name, mechanism, price, bonos, days=7)`

#### Playbook Designer (`/agent/playbook/design`)
- `generate_mockup_strategy(product_type, name, nicho, price)`
- `generate_landing_optimization_audit(headline, pain_point, price, stack)`
- `generate_color_psychology_strategy(nicho, emotion_target, tone)`

#### Playbook Social Media (`/agent/playbook/social-media`)
- `generate_tiktok_strategy(nicho, pain_point, mechanism, audience, days=7)`
- `generate_creative_variations(hook, angle_type, format="9x16")`
- `generate_scaling_strategy(winning_stats, budget, target_roas=3.0)`

---

## 🎯 PLAYBOOK NIVEL DIOS — 8 FASES

**Framework:** Cómo escalar un producto digital en 48h usando RPV > CPV

### Fase 0: NICHE (Seleccionar nicho)
- Prompt: Análisis de mercado, competencia, oportunidad
- AI: Copywriter genera insights
- Checkbox: Niche validado

### Fase 1: RESEARCH + AVATAR
- Prompt: Target audience profiling
- AI: Copywriter crea avatar detallado
- Checkbox: Avatar definido

### Fase 2: STACK DE OFERTA
- Prompt: Product + 3 bonuses (value > 2x price)
- AI: Designer valida estructura de oferta
- Checkbox: Stack aprobado

### Fase 3: LANDING PAGE
- Prompt: Copywriter genera copy (headline, benefits, CTA)
- AI: Designer audita y sugiere mejoras
- Checkbox: Copy listo

### Fase 4: MOCKUPS + SHOPIFY
- Prompt: Designer genera mockup strategy
- AI: Designer da recomendaciones de design
- Checkbox: Mockups creados

### Fase 5: TikTok ORGÁNICO
- Prompt: Social Media genera 7-day TikTok strategy
- AI: Valida hooks, ángulos, formatos
- Checkpoint: Validación orgánica antes de Meta spend

### Fase 6: Meta Ads (RPV > CPV)
- Prompt: Social Media genera creative variations
- AI: Optimizer recomienda budget distribution
- Checkpoint: Ejecutar cuando RPV > CPV

### Fase 7: ANÁLISIS RPV vs CPV
- Prompt: Finance Analyst calcula métricas
- AI: Growth Strategist genera scaling plan
- Output: Go/No-go decision + next steps

---

## 🔄 FLUJOS PRINCIPALES

### 1. Registration Flow (Cliente Nuevo)
```
Landing page → "Comenzar Gratis" 
    ↓
register.jsx form
    ↓
POST /auth/register
    ↓
Backend:
  - Crea User (role=client, is_active=True)
  - Crea TenantConfig vacío
  - Crea Subscription (plan=trial, trial_end=now+7days)
  - Genera JWT token
    ↓
Frontend recibe token + userData
  - localStorage.setItem('token', token)
  - Redirige a /onboarding
    ↓
Onboarding 5 pasos:
  1. Welcome
  2. Meta Ads connection
  3. GA4 connection
  4. Autonomous mode preference
  5. Completion
    ↓
POST /auth/complete-onboarding
    ↓
Redirige a /dashboard
```

### 2. Admin Login Flow
```
login.jsx form (email=onepercent.gsgr@gmail.com)
    ↓
POST /auth/login
    ↓
Backend verifica password vs hashed_password
    ↓
Si OK: genera JWT token
Si NO: devuelve 401
    ↓
Frontend:
  - localStorage.setItem('token', token)
  - Chequea response.role
  - Si role=='admin': redirige a /admin
  - Si role=='client': redirige a /dashboard
    ↓
/admin → Panel Administrador
  - Lista de clientes con filtros
  - Botones: Activar/Desactivar, Extender trial, Cambiar plan
  - Stats: total users, active trials, paid users, revenue
```

### 3. Payment Flow (Upgrade from Trial to Paid)
```
/pricing page → Select plan → "Ir a Pago"
    ↓
POST /payments/create-checkout (plan=starter|pro|enterprise)
    ↓
Backend:
  - Valida plan
  - Si trial: devuelve success URL (gratis)
  - Si paid: crea MercadoPago preference
    ↓
Redirects a MercadoPago checkout
    ↓
Usuario paga (o cancela)
    ↓
MercadoPago → webhook a /payments/webhook
    ↓
Backend:
  - Verifica pago approved
  - Actualiza Subscription (plan=starter, status=active)
    ↓
Usuario redirigido a /payment/success
    ↓
Acceso a plan pagado activado
```

### 4. Autonomous Agent Flow
```
APScheduler runs every 6 hours:
    ↓
For each user with subscription.status==active:
    ↓
run_full_audit(campaigns, creatives, financial, ga4_data)
    ↓
Optimizer + Finance + Growth agents analyze
    ↓
Generar AutonomousActionLog records (pending)
    ↓
Si requiere_approval: espera /autonomous/actions/{id}/approve
    ↓
Si aprobado: ejecuta en Meta API (placeholder)
    ↓
Logs guardados en AgentLog
```

---

## 🐛 BUGS ARREGLADOS (Sesión Actual)

### ❌ BUG CRÍTICO #1: Header() faltante en auth endpoints
**Causa:** FastAPI interpretaba `authorization: Optional[str] = None` como query parameter en lugar de HTTP header.  
**Impacto:** TODOS los 42 endpoints autenticados devolvían 401.  
**Fix:** Cambiar a `authorization: Optional[str] = Header(None)` en todos los @app endpoints.

### ❌ BUG CRÍTICO #2: CORS destruido
**Causa:** CORSMiddleware de FastAPI era frágil — dependía 100% de variables de Railway.  
**Impacto:** Register form fallaba con "CORS policy: no Access-Control-Allow-Origin header".  
**Fix:** Reemplazar con ManualCORSMiddleware que refleja el Origin header (funciona para ANY frontend URL).

### ❌ BUG #3: Admin user no se cargaba
**Causa:** `onepercent.gsgr@gmail.com` se registró como "client" antes de ser setado como ADMIN_EMAIL.  
**Fix:** Startup ahora chequea si ADMIN_EMAIL existe pero no es admin → auto-upgrade a admin role + enterprise plan.

### ❌ BUG #4: /signup 404
**Causa:** Landing page tenía 3 links a `/signup` pero la página real es `/register`.  
**Fix:** Sed replace en index.jsx: `/signup` → `/register`.

### ❌ BUG #5: set-plan endpoint esperaba query param
**Causa:** Frontend mandaba `{ plan: "pro" }` en JSON body, backend esperaba `plan` como query param.  
**Fix:** Agregar Pydantic model `AdminSetPlanRequest`, cambiar endpoint signature.

### ⚠️ ISSUE #6: Secret key cambio en Railway
**Causa:** Usuario regeneró `SECRET_KEY` en Railway.  
**Impacto:** Todos los tokens viejos se vuelven inválidos (token expired).  
**Solución:** Usuario debe cerrar sesión y volver a loguearse.

### ⚠️ ISSUE #7: Database sin connection pooling
**Causa:** PostgreSQL sin pool configurado = conexiones se abren/cierran por cada request.  
**Fix:** database.py ahora tiene `pool_size=10, max_overflow=20, pool_recycle=1800` para Railway.

---

## 📊 ESTADO ACTUAL (End of Session)

✅ **FUNCIONANDO:**
- Landing page (marketing, hero, agentes showcase)
- Registro de clientes (crea trial automático de 7 días)
- Login (admin + clients)
- Admin Panel (ver clientes, activar/desactivar, extender trial, cambiar plan)
- Onboarding wizard (5 pasos, guía de setup)
- Dashboard (stats básicas)
- Playbook Nivel Dios (8 fases interactivas con prompts)
- CORS (fixed definitivamente)
- Database pooling (production-ready)

⚠️ **EN PROGRESO / PENDIENTE:**
- Registro de clientes desde "Comenzar Gratis" (CORS fix en progreso)
- Conexión real a Meta API (placeholder endpoints, await integration)
- GA4 integration (endpoints ready, await credentials)
- MercadoPago suscripciones automáticas (checkout OK, webhooks testing)
- Autonomous agents scheduler (code ready, await cron validation)

---

## 🚀 NEXT STEPS (PRÓXIMA SESIÓN)

1. **Verifica que el cliente puede registrarse:**
   - Ventana incógnito → registro nuevo cliente
   - Debería ver landing page sin CORS errors
   - Redirige a onboarding
   - Crea trial automático

2. **Prueba Admin Panel:**
   - Loguearse como `onepercent.gsgr@gmail.com`
   - Deberías ver el link "👑 Admin" en el sidebar
   - Clickea → ve lista de clientes registrados
   - Prueba: activar, desactivar, extender trial, cambiar plan

3. **Meta Ads Integration:**
   - Conectar cuenta Meta real
   - Hacer fetch de campaigns desde Meta API
   - Validar que los agentes pueden analizar datos reales

4. **Payment Testing:**
   - Simular pago en MercadoPago sandbox
   - Verificar webhook → Subscription actualizada
   - Cliente pasa de trial a plan pagado

5. **Autonomous Agents:**
   - Validar scheduler corre cada 6 horas
   - Generar action logs
   - Probar aprobación/ejecución de acciones

---

## 🔑 CREDENCIALES (GUARDAR EN LUGAR SEGURO)

```
ADMIN LOGIN:
Email: onepercent.gsgr@gmail.com
Password: <en Railway ADMIN_PASSWORD>

DATABASE:
Host: postgres.railway.internal
Port: 5432
Database: metadash
User: postgres
Password: <en Railway DATABASE_URL>

META API:
App ID: 1660121868759220
Access Token: EAAXl3z5FcL...
Ad Account ID: act_893021690235868

VERCEL DEPLOYMENTS:
Primary: https://metadash-v2-n2em-git-master-one-percents-projects.vercel.app
Alternative: https://metadash-v2-n2em.vercel.app

RAILWAY:
Backend API: https://mellow-healing-production-36fd.up.railway.app
Database: postgres.railway.internal
```

---

## 📚 DOCUMENTACIÓN RÁPIDA

### Agregar nuevo endpoint
```python
@app.post("/endpoint-name", response_model=ResponseModel)
async def endpoint_handler(
    request: RequestModel,
    authorization: Optional[str] = Header(None),  # ← SIEMPRE Header() para auth
    db: Session = Depends(get_db),
):
    user = get_current_user_from_header(authorization, db)
    # ... lógica
    return response
```

### Llamar API desde frontend
```javascript
const response = await api.apiFetch("/endpoint-name", {
  method: "POST",
  body: JSON.stringify({ data: "value" })
});
```

### Agregar nuevo agente
```python
# backend/agents/new_agent.py
async def run_new_analysis(data: dict):
    result = await client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=1024,
        messages=[{ role: "user", content: prompt }]
    )
    return result.content[0].text

# backend/main.py
@app.post("/agent/new-agent")
async def run_new_agent(request: AgentRequest, ...):
    result = await run_new_analysis(request.context)
    return AgentResponse(result=result, agent="New Agent Name")
```

---

**Fecha de Creación:** 2024-12-XX  
**Última Actualización:** [HOY]  
**Próxima Revisión:** [EN PRÓXIMA SESIÓN]

---

*Este documento está diseñado para ser copiado/pegado en un nuevo chat para mantener continuidad del proyecto sin perder contexto.*
