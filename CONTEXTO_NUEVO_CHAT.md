# MetaDash — Contexto para nuevo chat

## Quién soy
Gerardo, Sky Eleven. Emprendedor argentino. Vendo PDFs digitales vía Meta Ads + Shopify.
Producto actual: PDF de IA Rentable — $17 USD.
Socios relevantes para este proyecto: solo yo (sin Nico).

---

## Qué es MetaDash
Dashboard propio de Meta Ads con 3 agentes IA integrados.
Reemplaza el análisis a ojo. Conecta a la API de Meta y usa Claude (Anthropic) para análisis.

**Por qué lo construimos:** Nico manejaba las campañas a ojo sin métricas reales.
Gerardo quiere control total con datos y decisiones automatizadas con IA.

**Uso futuro:** Este mismo dashboard se vende como DFY (Done For You) en el Curso 2 a otros emprendedores que hacen Meta Ads.

---

## Stack técnico
- **Backend:** Python FastAPI → VPS Hostinger de Gerardo
- **Frontend:** Next.js → Vercel (dominio alpedo disponible)
- **DB:** SQLite en el VPS
- **Meta:** facebook-business SDK oficial (API v20.0)
- **IA:** Anthropic Claude API (claude-opus-4-6)
- **Deploy:** Docker + docker-compose en VPS, Nginx + SSL con Certbot

---

## Archivos generados (en carpeta outputs/metadash/)

```
metadash/
├── SETUP.md                          ← Guía completa de deploy (4 pasos)
├── backend/
│   ├── main.py                       ← FastAPI con todos los endpoints
│   ├── meta_api.py                   ← Conexión Meta Marketing API
│   ├── config.py                     ← Variables de entorno (pydantic-settings)
│   ├── .env.example                  ← Template de variables a completar
│   ├── Dockerfile
│   ├── requirements.txt
│   └── agents/
│       ├── optimizer.py              ← Agente 1 ✅ (actualizado)
│       ├── script_gen.py             ← Agente 2 ✅ (actualizado)
│       └── finance.py                ← Agente 3 ✅ (actualizado)
├── frontend/
│   ├── package.json                  ← Next.js 14
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.local.example
│   └── src/
│       ├── pages/index.jsx           ← Dashboard principal (4 tabs)
│       ├── components/
│       │   ├── MetricCard.jsx
│       │   └── CampaignTable.jsx
│       └── lib/api.js                ← Cliente HTTP al backend
└── deploy/
    └── docker-compose.yml
```

---

## Los 3 Agentes IA — System Prompts implementados

### Agente 1 — Campaign Optimizer (optimizer.py)
**Rol:** Senior Performance Marketing Strategist
**Función:** Reglas determinísticas primero (pausa/escala/duplica/rota) → luego Claude hace análisis estratégico
**Output (5 secciones fijas):**
1️⃣ Campaign Diagnosis
2️⃣ Problem Detection
3️⃣ Optimization Action
4️⃣ Scaling Recommendation
5️⃣ Creative Suggestions

**Reglas automáticas implementadas:**
- CPA > 2.5x precio → ⛔ PAUSAR
- Frecuencia > 3 → 🔄 ROTAR CREATIVOS
- CPM bajo + CTR < 1.5% → 🪝 HOOK DÉBIL
- CTR > 3% + conversiones bajas → 🔗 PROBLEMA LANDING
- ROAS > 2x + CPA < 80% del precio → 🚀 ESCALAR +20%
- CTR > 2.5% + CPA < precio → 📋 DUPLICAR ADSET

### Agente 2 — Script Generator (script_gen.py)
**Rol:** Senior Direct Response Copywriter
**Función:** Analiza top 3 ads ganadores → extrae patrón → genera 5 guiones nuevos
**Estructura:** Hook / Problem / Agitation / Solution / CTA
**Output:** 5 AD SCRIPTs con Hook / Script / Visual idea / CTA / Angle
**Ángulos disponibles:** Curiosity, Shock, Contrarian, Problem revelation, Income opportunity, Hidden trick, Storytelling
**Formatos:** video_reels (15-30s) / carrusel / imagen_estatica

### Agente 3 — Finance/CFO (finance.py)
**Rol:** Senior Business Financial Analyst
**Función:** Calcula margen real + presupuesto Meta seguro + alertas de riesgo
**Output (5 secciones fijas):**
1️⃣ Financial Diagnosis
2️⃣ Real Profit
3️⃣ Safe Ad Budget
4️⃣ Scaling Recommendation
5️⃣ Risk Alerts

**Alerta automática si:** margen < 20% O gasto Meta crece más rápido que revenue

---

## Variables de entorno a completar (.env)

```
META_ACCESS_TOKEN=       ← de developers.facebook.com → Graph API Explorer
META_AD_ACCOUNT_ID=      ← formato act_XXXXXXXXXX (en Business Manager)
META_APP_ID=
META_APP_SECRET=
ANTHROPIC_API_KEY=       ← de console.anthropic.com
APP_PASSWORD=            ← password para entrar al dashboard
PRECIO_PDF=17.0
COSTO_SHOPIFY=29.0
COSTO_HERRAMIENTAS=30.0
COSTO_MONOTRIBUTO_MENSUAL=80.0
COSTO_DOMINIO_HOSTING=15.0
```

---

## Endpoints del backend (main.py)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Verificar que el server funciona |
| GET | /campaigns | Campañas con métricas |
| GET | /ads | Todos los ads con métricas |
| GET | /agent/optimize | Agente 1 — análisis completo |
| POST | /agent/scripts | Agente 2 — genera guiones |
| POST | /agent/finance | Agente 3 — análisis financiero |
| POST | /campaigns/action | Pausar/activar campaña |

---

## Frontend — 4 tabs del dashboard

1. **📊 Campañas** — tabla con todas las campañas, métricas, botones pausar/activar
2. **🤖 Agente Optimizer** — botón "Analizar ahora" → output del Agente 1
3. **💰 Agente Finanzas** — form (ventas mes + gasto Meta) → output del Agente 3
4. **✍️ Agente Guiones** — form (producto + nicho + formato) → output del Agente 2

---

## Estado actual
✅ Código completo generado y listo en outputs/metadash/
✅ Los 3 agentes tienen system prompts de nivel senior implementados
⏳ PENDIENTE: Deploy en VPS Hostinger (necesita credenciales de Gerardo)
⏳ PENDIENTE: Conectar dominio a Vercel
⏳ PENDIENTE: Completar el .env con tokens reales de Meta y Anthropic
⏳ PENDIENTE: Prueba en vivo con cuenta real de Meta Ads

---

## Próximos pasos sugeridos
1. Deploy del backend en VPS (seguir SETUP.md paso a paso)
2. Conectar Meta Access Token real
3. Test con datos reales de las campañas de herrería (para validar antes del PDF de IA)
4. Lanzar campaña del PDF de IA y usar el dashboard desde día 1
5. Futuro: agregar gráficos históricos (Chart.js ya está disponible en el stack)

---

## Contexto de negocio
- **PDF de IA Rentable:** producto principal, $17 USD, venta vía Meta Ads → Shopify
- **Funnel completo:** PDF → Skool de Live (Cristian) → Curso 2 DFY con Gustavo
- **Este dashboard** es la herramienta interna Y el producto DFY del Curso 2
- Higgsfield AI evaluado para creativos de producto (UGC Builder + Product-to-Video)
- Para videos con cara en cámara: Gerardo graba, guiones los genera el Agente 2
